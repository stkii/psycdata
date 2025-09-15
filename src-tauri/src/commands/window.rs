use tauri::{
    AppHandle,
    Emitter,
    Manager,
    WebviewUrl,
    WebviewWindowBuilder,
};

/// 指定ラベルのウィンドウを開く/再利用する、汎用版。
/// 既存の場合はフォーカスして、任意のイベントを emit できます。
/// 未存在の場合は指定 URL で新規作成（タイトル/サイズも指定可能）。
#[tauri::command]
pub fn open_or_reuse_window(
    handle: AppHandle,
    label: String,
    url: String,
    payload: Option<serde_json::Value>,
) -> Result<(), String> {
    if let Some(win) = handle.get_webview_window(&label) {
        // 既存ウィンドウを再利用
        let _ = win.set_focus();
        // ラベルに応じて既存ウィンドウへイベント通知（フロントは固定イベント名をlisten）
        match label.as_str() {
            "analysis" => {
                if let Some(data) = payload {
                    win.emit("analysis:load", data).map_err(|e| e.to_string())?;
                }
            },
            _ => {
                // 他ラベル向けの既存更新イベントが必要ならここに追加
            },
        }
        return Ok(());
    }

    // 新規作成時のウィンドウ属性はラベルで決定
    let mut builder = WebviewWindowBuilder::new(&handle, &label, WebviewUrl::App(url.into()));
    match label.as_str() {
        "analysis" => {
            builder = builder.title("PsycData - (Analysis Viewer)");
            builder = builder.inner_size(1920.0, 1080.0);
        },
        "table" => {
            builder = builder.title("PsycData - (Table Viewer)");
            builder = builder.inner_size(1920.0, 1080.0);
        },
        _ => {
            // デフォルト: ラベルをタイトルに、一般的なサイズ
            builder = builder.title(label.clone());
            builder = builder.inner_size(1280.0, 800.0);
        },
    }

    builder.build().map_err(|e| e.to_string())?;

    Ok(())
}
