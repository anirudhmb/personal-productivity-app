mod database;

use database::{get_database_schema, Persona, generate_id, get_current_timestamp};
use tauri_plugin_sql::{Builder, Migration, MigrationKind};
use serde_json::Value;
use std::sync::Mutex;
use rusqlite::{Connection, Result, OptionalExtension};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Database state management
struct AppState {
    db: Mutex<Connection>,
}

impl AppState {
    fn new() -> Result<Self, rusqlite::Error> {
        let conn = Connection::open("./data.db")?;
        Ok(AppState {
            db: Mutex::new(conn),
        })
    }
}

// Test database commands
#[tauri::command]
async fn test_database_connection(state: tauri::State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    // Test basic query to check if tables exist
    let mut stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .map_err(|e| format!("SQL prepare error: {}", e))?;
    
    let table_names: Result<Vec<String>, rusqlite::Error> = stmt.query_map([], |row| {
        Ok(row.get::<_, String>(0)?)
    }).map_err(|e| format!("SQL query error: {}", e))?
    .collect();
    
    let tables = table_names.map_err(|e| format!("SQL collect error: {}", e))?;
    
    Ok(format!("Database connected successfully! Found {} tables: {:?}", tables.len(), tables))
}

#[tauri::command]
async fn create_test_persona(state: tauri::State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    let persona = Persona {
        id: generate_id(),
        name: "Test Persona".to_string(),
        description: Some("This is a test persona created from Rust".to_string()),
        color: "#3b82f6".to_string(),
        created_at: get_current_timestamp(),
        updated_at: get_current_timestamp(),
        is_active: true,
    };
    
    // Insert the persona into the database
    db.execute(
        "INSERT INTO personas (id, name, description, color, created_at, updated_at, is_active) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![
            persona.id,
            persona.name,
            persona.description,
            persona.color,
            persona.created_at.to_rfc3339(),
            persona.updated_at.to_rfc3339(),
            persona.is_active
        ]
    ).map_err(|e| format!("SQL insert error: {}", e))?;
    
    Ok(format!("Test persona created successfully! ID: {}, Name: {}", persona.id, persona.name))
}

#[tauri::command]
async fn get_all_personas(state: tauri::State<'_, AppState>) -> Result<Vec<Value>, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    let mut stmt = db.prepare("SELECT id, name, description, color, created_at, updated_at, is_active FROM personas ORDER BY created_at DESC")
        .map_err(|e| format!("SQL prepare error: {}", e))?;
    
    let persona_iter = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "name": row.get::<_, String>(1)?,
            "description": row.get::<_, Option<String>>(2)?,
            "color": row.get::<_, String>(3)?,
            "created_at": row.get::<_, String>(4)?,
            "updated_at": row.get::<_, String>(5)?,
            "is_active": row.get::<_, bool>(6)?
        }))
    }).map_err(|e| format!("SQL query error: {}", e))?;
    
    let personas: Result<Vec<Value>, rusqlite::Error> = persona_iter.collect();
    personas.map_err(|e| format!("SQL collect error: {}", e))
}

#[tauri::command]
async fn delete_persona(state: tauri::State<'_, AppState>, id: String) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    // Check if persona exists first
    let mut stmt = db.prepare("SELECT name FROM personas WHERE id = ?1")
        .map_err(|e| format!("SQL prepare error: {}", e))?;
    
    let persona_name: Result<Option<String>, rusqlite::Error> = stmt.query_row([&id], |row| {
        Ok(row.get::<_, String>(0)?)
    }).optional();
    
    let persona_name = persona_name.map_err(|e| format!("SQL query error: {}", e))?;
    
    if persona_name.is_none() {
        return Err(format!("Persona with ID '{}' not found", id));
    }
    
    // Delete the persona
    let changes = db.execute("DELETE FROM personas WHERE id = ?1", [&id])
        .map_err(|e| format!("SQL delete error: {}", e))?;
    
    if changes == 0 {
        return Err(format!("No persona was deleted with ID '{}'", id));
    }
    
    Ok(format!("Successfully deleted persona '{}' with ID: {}", persona_name.unwrap(), id))
}

#[tauri::command]
async fn clear_all_personas(state: tauri::State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    // Count personas before deletion
    let mut stmt = db.prepare("SELECT COUNT(*) FROM personas")
        .map_err(|e| format!("SQL prepare error: {}", e))?;
    
    let count: i32 = stmt.query_row([], |row| {
        Ok(row.get::<_, i32>(0)?)
    }).map_err(|e| format!("SQL query error: {}", e))?;
    
    if count == 0 {
        return Ok("No personas found to delete".to_string());
    }
    
    // Delete all personas
    db.execute("DELETE FROM personas", [])
        .map_err(|e| format!("SQL delete error: {}", e))?;
    
    Ok(format!("Successfully deleted {} persona(s) from the database", count))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database connection and create schema
    let app_state = AppState::new().expect("Failed to initialize database");
    
    // Create database schema if it doesn't exist
    {
        let db = app_state.db.lock().expect("Failed to lock database");
        db.execute_batch(get_database_schema())
            .expect("Failed to create database schema");
    }
    
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
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![greet, test_database_connection, create_test_persona, get_all_personas, delete_persona, clear_all_personas])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
