mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
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
