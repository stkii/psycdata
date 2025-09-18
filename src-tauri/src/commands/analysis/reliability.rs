use crate::models::dto::ParsedTable;
use crate::services::{
    excel,
    r as rsvc,
};

/// Execute reliability analysis (Cronbach's alpha when model == 'alpha')
#[tauri::command]
pub async fn run_reliability(
    handle: tauri::AppHandle,
    path: String,
    sheet: String,
    variables: Vec<String>,
    model: Option<String>,
) -> Result<ParsedTable, String> {
    if path.trim().is_empty() {
        return Err("ファイルパスが空です".to_string());
    }
    if sheet.trim().is_empty() {
        return Err("シート名が空です".to_string());
    }
    // シート存在チェック（早期エラー）
    let sheets = excel::list_sheets(&path)?;
    if !sheets.iter().any(|s| s == &sheet) {
        return Err(format!("シートが見つかりません: {}", sheet));
    }

    let dataset = rsvc::build_numeric_dataset(&path, &sheet, &variables)?;

    // 第3引数として model を渡す（R CLI 側で reliability の時だけ解釈）
    let table = rsvc::run_r_analysis_with_dataset(
        &handle,
        "reliability",
        &dataset,
        std::time::Duration::from_secs(60),
        model.as_deref(),
    )?;
    Ok(table)
}

