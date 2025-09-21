use indexmap::IndexMap;
use std::collections::HashSet;
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::process::Command;
use std::sync::atomic::{
    AtomicU64,
    Ordering,
};
use std::time::{
    Duration,
    SystemTime,
};

use calamine::Data;
use tauri::AppHandle;

use crate::models::dto::ParsedTable;
use crate::services::excel;

fn header_from_cell(
    cell: &Data,
    index: usize,
) -> String {
    match cell {
        Data::String(s) => {
            let s = s.trim();
            if s.is_empty() {
                format!("列{}", index + 1)
            } else {
                s.to_string()
            }
        },
        Data::Float(f) => match serde_json::Number::from_f64(*f) {
            Some(n) => n.to_string(),
            None => format!("列{}", index + 1),
        },
        #[allow(deprecated)]
        Data::Int(n) => n.to_string(),
        Data::Bool(b) => {
            if *b {
                "TRUE".to_string()
            } else {
                "FALSE".to_string()
            }
        },
        Data::Empty | Data::Error(_) => format!("列{}", index + 1),
        other => {
            let s = format!("{}", other);
            if s.trim().is_empty() {
                format!("列{}", index + 1)
            } else {
                s
            }
        },
    }
}

pub fn build_numeric_dataset(
    path: &str,
    sheet: &str,
    variables: &[String],
) -> Result<IndexMap<String, Vec<Option<f64>>>, String> {
    if variables.is_empty() {
        return Err("変数が選択されていません".to_string());
    }

    let rows = excel::read_sheet_rows(path, sheet)?;
    if rows.is_empty() {
        return Err("指定シートにデータがありません".to_string());
    }

    let header_row = &rows[0];
    let headers: Vec<String> = header_row
        .iter()
        .enumerate()
        .map(|(i, cell)| header_from_cell(cell, i))
        .collect();

    // シート名が重複している場合はエラーを返す (ambiguous mapping)
    {
        let mut seen: HashSet<&str> = HashSet::new();
        let mut dups: Vec<String> = Vec::new();
        for h in headers.iter() {
            let key = h.as_str();
            if !seen.insert(key) {
                if !dups.iter().any(|d| d == h) {
                    dups.push(h.clone());
                }
            }
        }
        if !dups.is_empty() {
            return Err(format!(
                "シートのヘッダー（列名）が重複しています: {}",
                dups.join(", ")
            ));
        }
    }

    // Validate all requested variables exist
    for v in variables {
        if !headers.iter().any(|h| h == v) {
            return Err(format!("変数 '{}' が見つかりません", v));
        }
    }

    // Build selection set for quick membership checks
    let varset: HashSet<&str> = variables.iter().map(|s| s.as_str()).collect();

    // Determine indices in the original Excel header order (not selection order)
    let mut indices: Vec<(String, usize)> = Vec::new();
    for (idx, name) in headers.iter().enumerate() {
        if varset.contains(name.as_str()) {
            indices.push((name.clone(), idx));
        }
    }

    // Preserve insertion order of variables to keep UI order stable
    let mut dataset: IndexMap<String, Vec<Option<f64>>> = IndexMap::new();
    for (name, idx) in indices.into_iter() {
        let mut col: Vec<Option<f64>> = Vec::new();
        for row in rows.iter().skip(1) {
            let num = match row.get(idx) {
                Some(Data::Float(f)) => Some(*f),
                #[allow(deprecated)]
                Some(Data::Int(n)) => Some(*n as f64),
                Some(Data::String(s)) => s.trim().parse::<f64>().ok(),
                _ => None,
            };
            col.push(num);
        }
        if col.iter().any(|x| x.is_some()) {
            dataset.insert(name, col);
        }
    }

    if dataset.is_empty() {
        return Err("全ての選択列が数値または文字列として解釈できませんでした".to_string());
    }

    Ok(dataset)
}

fn find_cli_script() -> Option<PathBuf> {
    let candidates = [
        PathBuf::from("src-r/cli.R"),
        PathBuf::from("../src-r/cli.R"),
        PathBuf::from("../../src-r/cli.R"),
        PathBuf::from("../../../src-r/cli.R"),
    ];
    for p in candidates.iter() {
        let try_path = if p.is_absolute() {
            p.clone()
        } else {
            if let Ok(cwd) = std::env::current_dir() {
                cwd.join(p)
            } else {
                p.clone()
            }
        };
        if try_path.exists() {
            return Some(try_path);
        }
    }
    None
}

/// Excelから抽出済みの数値データセットをJSON化し一時ファイルへ書き込み
/// src-r/cli.R を Rscript --vanilla で起動し、分析モードを渡して実行
/// Rの標準出力(JSON)を受け取り ParsedTable にデコードして返却
pub fn run_r_analysis_with_dataset(
    _handle: &AppHandle,
    analysis: &str,
    dataset: &IndexMap<String, Vec<Option<f64>>>,
    _timeout: Duration,
    sort_code: Option<&str>,
) -> Result<ParsedTable, String> {
    // Serialize dataset to a temp JSON file
    let input_json = serde_json::to_string(dataset).map_err(|e| e.to_string())?;
    let mut tmp_path = std::env::temp_dir();
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let seq = COUNTER.fetch_add(1, Ordering::Relaxed);
    let ts = SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let pid = std::process::id();
    let fname = format!("psycdata_describe_{}_{}_{}.json", pid, ts, seq);
    tmp_path.push(&fname);
    {
        let mut f =
            fs::File::create(&tmp_path).map_err(|e| format!("一時ファイルの作成に失敗しました: {}", e))?;
        f.write_all(input_json.as_bytes())
            .map_err(|e| format!("一時ファイル書き込みに失敗しました: {}", e))?;
    }

    let script =
        find_cli_script().ok_or_else(|| "R CLI スクリプトが見つかりません: src-r/cli.R".to_string())?;

    // Pass project root for reliable renv activation in CLI
    let root_src_r = script
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| PathBuf::from("src-r"));

    let mut cmd = Command::new("Rscript");
    cmd.arg("--vanilla")
        .arg(script)
        .arg(analysis)
        .arg(&tmp_path)
        .env("LANG", "C")
        .env("R_PROJECT_ROOT", &root_src_r);
    if let Some(code) = sort_code {
        if !code.trim().is_empty() {
            cmd.arg(code);
        }
    }
    let output = cmd
        .output()
        .map_err(|e| format!("Rscript の起動に失敗しました: {}", e))?;

    // Cleanup temp file (best-effort)
    let _ = std::fs::remove_file(&tmp_path);

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("R 実行に失敗しました: {}", stderr.trim()));
    }

    let stdout =
        String::from_utf8(output.stdout).map_err(|e| format!("R出力のデコードに失敗しました: {}", e))?;

    let parsed: ParsedTable = serde_json::from_str(&stdout)
        .map_err(|e| format!("R出力のJSONパースに失敗しました: {}\n出力: {}", e, stdout))?;
    Ok(parsed)
}
