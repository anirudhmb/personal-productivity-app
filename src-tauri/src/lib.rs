mod database;

use database::get_database_schema;
use tauri_plugin_sql::{Builder, Migration, MigrationKind};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            Builder::default()
                .add_migrations(
                    "sqlite:./data.db",
                    vec![Migration {
                        version: 1,
                        description: "create initial database schema",
                        kind: MigrationKind::Up,
                        sql: get_database_schema(),
                    }],
                )
                .build(),
        )
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
