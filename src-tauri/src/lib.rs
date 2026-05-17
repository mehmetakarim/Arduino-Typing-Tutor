use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let mut builder =
                WebviewWindowBuilder::new(app, "main", WebviewUrl::App("/".into()))
                    .title("Arduino Typing Tutor")
                    .inner_size(1200.0, 800.0)
                    .min_inner_size(1024.0, 700.0)
                    .maximized(true)
                    .resizable(true);

            // Windows'ta GPU kaynaklı siyah ekran sorununu önle
            #[cfg(target_os = "windows")]
            {
                builder = builder
                    .additional_browser_args("--disable-gpu --disable-software-rasterizer");
            }

            builder.build()?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
