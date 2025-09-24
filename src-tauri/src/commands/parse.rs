use crate::models::dto::ParsedTable;
use crate::services::excel;
use std::collections::HashSet;

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

    // MVP: 重複ヘッダーがある場合はエラー（結果の列対応が曖昧になるため）
    if !rows.is_empty() {
        let headers = excel::compute_headers_from_first_row(&rows[0]);
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

    Ok(excel::rows_to_parsed_table(rows))
}
