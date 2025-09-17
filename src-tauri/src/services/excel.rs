//! Excel 読み込みの共通ユーティリティ
//! - ワークブックを開く/シート一覧取得
//! - 指定シートの行データ取得
//! - 行データを UI 向け DTO (ParsedTable) に変換

use crate::models::dto::ParsedTable;
use calamine::{
    open_workbook_auto,
    Data,
    Reader,
};

/// 先頭行のセルからヘッダー名を生成
/// - 空白や空文字はトリムし、空なら「列n」で補完
/// - 数値・真偽・その他も文字列化の上で空なら「列n」
pub fn compute_headers_from_first_row(row0: &[Data]) -> Vec<String> {
    row0.iter()
        .enumerate()
        .map(|(i, cell)| match cell {
            Data::String(s) => {
                let s = s.trim().to_string();
                if s.is_empty() {
                    format!("列{}", i + 1)
                } else {
                    s
                }
            },
            Data::Float(f) => {
                if let Some(n) = serde_json::Number::from_f64(*f) {
                    n.to_string()
                } else {
                    format!("列{}", i + 1)
                }
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
            Data::Empty | Data::Error(_) => format!("列{}", i + 1),
            other => {
                let s = format!("{}", other);
                if s.trim().is_empty() {
                    format!("列{}", i + 1)
                } else {
                    s
                }
            },
        })
        .collect()
}

/// 指定パスの Excel からシート名一覧を取得
/// 1枚も無い場合はエラー
pub fn list_sheets(path: &str) -> Result<Vec<String>, String> {
    let workbook = open_workbook_auto(path).map_err(|e| format!("ファイルを開けません: {}", e))?;
    let names = workbook.sheet_names().to_owned();
    if names.is_empty() {
        return Err("シートが見つかりません".to_string());
    }
    Ok(names)
}

/// 指定パス・シート名のセルを全行ベクタとして取得
pub fn read_sheet_rows(
    path: &str,
    sheet: &str,
) -> Result<Vec<Vec<Data>>, String> {
    let mut workbook = open_workbook_auto(path).map_err(|e| format!("ファイルを開けません: {}", e))?;
    let range = workbook
        .worksheet_range(sheet)
        .map_err(|e| format!("指定シートを読み込めません: {}", e))?;
    Ok(range.rows().map(|r| r.to_vec()).collect())
}

/// 行データを表形式DTOに変換
/// - 先頭行をヘッダーとして使用（空は「列n」で補完）
/// - 2行目以降をデータ行に変換（Empty→null, String/Bool/数値はそのまま、その他は文字列化）
pub fn rows_to_parsed_table(rows_data: Vec<Vec<Data>>) -> ParsedTable {
    if rows_data.is_empty() {
        return ParsedTable {
            headers: vec![],
            rows: vec![],
        };
    }

    let headers: Vec<String> = compute_headers_from_first_row(&rows_data[0]);

    let rows: Vec<Vec<serde_json::Value>> = rows_data
        .into_iter()
        .skip(1)
        .map(|row| {
            row.into_iter()
                .map(|cell| match cell {
                    Data::Empty => serde_json::Value::Null,
                    Data::String(s) => serde_json::Value::String(s),
                    Data::Float(f) => serde_json::Number::from_f64(f)
                        .map(serde_json::Value::Number)
                        .unwrap_or(serde_json::Value::Null),
                    #[allow(deprecated)]
                    Data::Int(n) => serde_json::Value::from(n),
                    Data::Bool(b) => serde_json::Value::Bool(b),
                    Data::Error(e) => serde_json::Value::String(format!("Error({:?})", e)),
                    other => serde_json::Value::String(format!("{}", other)),
                })
                .collect()
        })
        .collect();

    ParsedTable { headers, rows }
}
