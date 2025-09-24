use crate::commands::utils::validate_sheet_exists;
use crate::models::dto::ParsedTable;
use crate::services::r as rsvc;

/// Execute correlation analysis (upper-triangular matrix with significance marks prepared in R)
#[tauri::command]
pub async fn run_correlation(
    handle: tauri::AppHandle,
    path: String,
    sheet: String,
    variables: Vec<String>,
) -> Result<ParsedTable, String> {
    validate_sheet_exists(&path, &sheet)?;

    // Build numeric dataset in Excel column order
    let dataset = rsvc::build_numeric_dataset(&path, &sheet, &variables)?;
    // Run R analysis via CLI with "correlation"
    let table = rsvc::run_r_analysis_with_dataset(
        &handle,
        "correlation",
        &dataset,
        std::time::Duration::from_secs(60),
        None,
    )?;
    Ok(table)
}
