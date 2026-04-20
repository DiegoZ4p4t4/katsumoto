use std::fs;

#[tauri::command]
pub fn write_post_update_flag() {
    if let Some(cache_dir) = dirs::cache_dir() {
        let dir = cache_dir.join("katsumoto-pos");
        let _ = fs::create_dir_all(&dir);
        let _ = fs::write(dir.join(".post-update"), "1");
    }
}
