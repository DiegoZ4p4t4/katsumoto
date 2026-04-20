mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    clear_webview_cache_if_post_update();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::printer::print_escpos,
            commands::printer::print_tcp,
            commands::printer::list_serial_ports,
            commands::printer::open_cash_drawer,
            commands::printer::open_cash_drawer_tcp,
            commands::printer::check_printer_status,
            commands::printer::check_tcp_printer_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn clear_webview_cache_if_post_update() {
    let flag_path = dirs::cache_dir()
        .unwrap_or_default()
        .join("katsumoto-pos")
        .join(".post-update");

    if flag_path.exists() {
        let _ = std::fs::remove_file(&flag_path);

        if let Some(cache_dir) = dirs::cache_dir() {
            let webkit_cache = cache_dir
                .join("com.katsumoto.pos")
                .join("WebKit");
            if webkit_cache.exists() {
                let _ = std::fs::remove_dir_all(&webkit_cache);
            }

            let web_data = cache_dir
                .join("com.katsumoto.pos")
                .join("Web Data");
            if web_data.exists() {
                let _ = std::fs::remove_file(&web_data);
            }

            let web_data_journal = cache_dir
                .join("com.katsumoto.pos")
                .join("Web Data-journal");
            if web_data_journal.exists() {
                let _ = std::fs::remove_file(&web_data_journal);
            }
        }
    }
}
