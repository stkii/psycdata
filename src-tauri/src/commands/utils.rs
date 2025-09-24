use crate::services::excel;

pub(crate) fn validate_sheet_exists(
    path: &str,
    sheet: &str,
) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("ファイルパスが空です".to_string());
    }
    if sheet.trim().is_empty() {
        return Err("シート名が空です".to_string());
    }

    let sheets = excel::list_sheets(path)?;
    if !sheets.iter().any(|s| s == sheet) {
        return Err(format!("シートが見つかりません: {}", sheet));
    }
    Ok(())
}
