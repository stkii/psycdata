mod commands;
mod models;
mod services;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::analysis::describe::run_descriptive_stats,
            commands::analysis::correlation::run_correlation,
            commands::parse::list_sheets,
            commands::parse::parse_excel,
            commands::window::open_or_reuse_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
