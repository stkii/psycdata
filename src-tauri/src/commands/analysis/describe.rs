use crate::commands::utils::validate_sheet_exists;
use crate::models::dto::ParsedTable;
use crate::services::r as rsvc;

/// Execute descriptive statistics
/// - Input: file path, sheet name, variables
/// - Output: ParsedTable（header: Mean, SD, Min, Max; row: variables）
#[tauri::command]
pub async fn run_descriptive_stats(
    handle: tauri::AppHandle,
    path: String,
    sheet: String,
    variables: Vec<String>,
    order: Option<String>,
) -> Result<ParsedTable, String> {
    validate_sheet_exists(&path, &sheet)?;

    let dataset = rsvc::build_numeric_dataset(&path, &sheet, &variables)?;
    let table = rsvc::run_r_analysis_with_dataset(
        &handle,
        "descriptive",
        &dataset,
        std::time::Duration::from_secs(60),
        order.as_deref(),
    )?;
    Ok(table)
}
