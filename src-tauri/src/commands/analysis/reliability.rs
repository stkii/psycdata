use crate::commands::utils::validate_sheet_exists;
use crate::models::dto::ParsedTable;
use crate::services::r as rsvc;

/// Execute reliability analysis (Cronbach's alpha when model == 'alpha')
#[tauri::command]
pub async fn run_reliability(
    handle: tauri::AppHandle,
    path: String,
    sheet: String,
    variables: Vec<String>,
    model: Option<String>,
) -> Result<ParsedTable, String> {
    validate_sheet_exists(&path, &sheet)?;

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
