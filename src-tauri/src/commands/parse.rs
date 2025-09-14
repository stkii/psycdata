use crate::models::dto::ParsedTable;
use crate::services::excel;

/// 指定Excelファイルのシート名一覧を返すコマンド
/// フロントのシート選択UIのために使用
#[tauri::command]
pub fn list_sheets(path: String) -> Result<Vec<String>, String> {
    excel::list_sheets(&path)
}

/// 指定したシートをJSONテーブルに変換して返すコマンド
#[tauri::command]
pub fn parse_excel(
    path: String,
    sheet: String,
) -> Result<ParsedTable, String> {
    let rows = excel::read_sheet_rows(&path, &sheet)?;
    Ok(excel::rows_to_parsed_table(rows))
}
