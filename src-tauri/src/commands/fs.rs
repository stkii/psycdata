use std::fs;

/// Save a UTF-8 text file at the given path
#[tauri::command]
pub fn save_text_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| format!("failed to write file: {}", e))
}

