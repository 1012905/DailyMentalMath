// 口算天天练 — 100以内加减乘除交互式练习系统
// 纯前端应用，Rust 后端仅用于托管 Tauri 窗口

#[tauri::command]
fn log_error(message: String) {
    // Logged via tauri_plugin_log; consumed by Tauri's log plugin (file/console).
    tracing::error!(target: "frontend", "{message}");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![log_error])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
