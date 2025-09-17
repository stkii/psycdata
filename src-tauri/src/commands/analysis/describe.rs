use crate::models::dto::ParsedTable;
use crate::services::{
    excel,
    r as rsvc,
};

/// Execute descriptive statistics
/// - Input: file path, sheet name, variables
/// - Output: ParsedTable（header: Mean, SD, Min, Max; row: variables）
#[tauri::command]
pub async fn run_descriptive_stats(
    handle: tauri::AppHandle,
    path: String,
    sheet: String,
    variables: Vec<String>,
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
    let table = rsvc::run_r_analysis_with_dataset(
        &handle,
        "descriptive",
        &dataset,
        std::time::Duration::from_secs(60),
    )?;
    Ok(table)
}
