mod database;

use database::{get_database_schema, Persona, Workstream, WorkstreamStatus, generate_id, get_current_timestamp};
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

// Persona Management Commands
#[tauri::command]
async fn create_persona(
    state: tauri::State<'_, AppState>, 
    name: String, 
    description: Option<String>, 
    color: String
) -> Result<Value, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    let persona = Persona {
        id: generate_id(),
        name: name.clone(),
        description,
        color,
        created_at: get_current_timestamp(),
        updated_at: get_current_timestamp(),
        is_active: true,
    };
    
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
    
    Ok(serde_json::to_value(persona).map_err(|e| format!("Serialization error: {}", e))?)
}

#[tauri::command]
async fn update_persona(
    state: tauri::State<'_, AppState>,
    id: String,
    name: Option<String>,
    description: Option<String>,
    color: Option<String>,
    is_active: Option<bool>
) -> Result<Value, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    // Check if persona exists
    let mut stmt = db.prepare("SELECT id, name, description, color, created_at, updated_at, is_active FROM personas WHERE id = ?1")
        .map_err(|e| format!("SQL prepare error: {}", e))?;
    
    let existing_persona: Result<Option<(String, String, Option<String>, String, String, String, bool)>, rusqlite::Error> = 
        stmt.query_row([&id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, bool>(6)?
            ))
        }).optional();
    
    let existing_persona = existing_persona.map_err(|e| format!("SQL query error: {}", e))?;
    
    if existing_persona.is_none() {
        return Err(format!("Persona with ID '{}' not found", id));
    }
    
    let (_, old_name, old_description, old_color, created_at, _, old_is_active) = existing_persona.unwrap();
    
    let updated_name = name.unwrap_or(old_name);
    let updated_description = description.or(old_description);
    let updated_color = color.unwrap_or(old_color);
    let updated_is_active = is_active.unwrap_or(old_is_active);
    let updated_at = get_current_timestamp();
    
    db.execute(
        "UPDATE personas SET name = ?1, description = ?2, color = ?3, is_active = ?4, updated_at = ?5 WHERE id = ?6",
        rusqlite::params![updated_name, updated_description, updated_color, updated_is_active, updated_at.to_rfc3339(), id]
    ).map_err(|e| format!("SQL update error: {}", e))?;
    
    let updated_persona = Persona {
        id: id.clone(),
        name: updated_name,
        description: updated_description,
        color: updated_color,
        created_at: chrono::DateTime::parse_from_rfc3339(&created_at).unwrap().with_timezone(&chrono::Utc),
        updated_at,
        is_active: updated_is_active,
    };
    
    Ok(serde_json::to_value(updated_persona).map_err(|e| format!("Serialization error: {}", e))?)
}

// Workstream Management Commands
#[tauri::command]
async fn create_workstream(
    state: tauri::State<'_, AppState>, 
    persona_id: String,
    name: String, 
    description: Option<String>, 
    status: String
) -> Result<Value, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    // Verify persona exists
    let mut stmt = db.prepare("SELECT id FROM personas WHERE id = ?1 AND is_active = 1")
        .map_err(|e| format!("SQL prepare error: {}", e))?;
    
    let persona_exists: Result<Option<String>, rusqlite::Error> = stmt.query_row([&persona_id], |row| {
        Ok(row.get::<_, String>(0)?)
    }).optional();
    
    let persona_exists = persona_exists.map_err(|e| format!("SQL query error: {}", e))?;
    
    if persona_exists.is_none() {
        return Err(format!("Persona with ID '{}' not found or inactive", persona_id));
    }
    
    // Parse status
    let workstream_status = match status.as_str() {
        "planning" => WorkstreamStatus::Planning,
        "active" => WorkstreamStatus::Active,
        "paused" => WorkstreamStatus::Paused,
        "completed" => WorkstreamStatus::Completed,
        "cancelled" => WorkstreamStatus::Cancelled,
        _ => return Err(format!("Invalid status: {}. Valid statuses: planning, active, paused, completed, cancelled", status)),
    };
    
    let workstream = Workstream {
        id: generate_id(),
        persona_id,
        name: name.clone(),
        description,
        status: workstream_status,
        priority: database::Priority::Medium,
        start_date: None,
        target_date: None,
        completed_date: None,
        progress_percentage: 0,
        created_at: get_current_timestamp(),
        updated_at: get_current_timestamp(),
    };
    
    db.execute(
        "INSERT INTO workstreams (id, persona_id, name, description, status, priority, start_date, target_date, completed_date, progress_percentage, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        rusqlite::params![
            workstream.id,
            workstream.persona_id,
            workstream.name,
            workstream.description,
            serde_json::to_string(&workstream.status).map_err(|e| format!("Status serialization error: {}", e))?,
            serde_json::to_string(&workstream.priority).map_err(|e| format!("Priority serialization error: {}", e))?,
            workstream.start_date.map(|d| d.to_rfc3339()),
            workstream.target_date.map(|d| d.to_rfc3339()),
            workstream.completed_date.map(|d| d.to_rfc3339()),
            workstream.progress_percentage,
            workstream.created_at.to_rfc3339(),
            workstream.updated_at.to_rfc3339()
        ]
    ).map_err(|e| format!("SQL insert error: {}", e))?;
    
    Ok(serde_json::to_value(workstream).map_err(|e| format!("Serialization error: {}", e))?)
}

#[tauri::command]
async fn get_workstreams_by_persona(
    state: tauri::State<'_, AppState>,
    persona_id: String
) -> Result<Vec<Value>, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    let mut stmt = db.prepare("SELECT id, persona_id, name, description, status, created_at, updated_at FROM workstreams WHERE persona_id = ?1 ORDER BY created_at DESC")
        .map_err(|e| format!("SQL prepare error: {}", e))?;
    
    let workstream_iter = stmt.query_map([&persona_id], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "persona_id": row.get::<_, String>(1)?,
            "name": row.get::<_, String>(2)?,
            "description": row.get::<_, Option<String>>(3)?,
            "status": row.get::<_, String>(4)?,
            "created_at": row.get::<_, String>(5)?,
            "updated_at": row.get::<_, String>(6)?
        }))
    }).map_err(|e| format!("SQL query error: {}", e))?;
    
    let workstreams: Result<Vec<Value>, rusqlite::Error> = workstream_iter.collect();
    workstreams.map_err(|e| format!("SQL collect error: {}", e))
}

#[tauri::command]
async fn get_all_workstreams(state: tauri::State<'_, AppState>) -> Result<Vec<Value>, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    let mut stmt = db.prepare("SELECT w.id, w.persona_id, w.name, w.description, w.status, w.created_at, w.updated_at, p.name as persona_name, p.color as persona_color FROM workstreams w JOIN personas p ON w.persona_id = p.id ORDER BY w.created_at DESC")
        .map_err(|e| format!("SQL prepare error: {}", e))?;
    
    let workstream_iter = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "persona_id": row.get::<_, String>(1)?,
            "name": row.get::<_, String>(2)?,
            "description": row.get::<_, Option<String>>(3)?,
            "status": row.get::<_, String>(4)?,
            "created_at": row.get::<_, String>(5)?,
            "updated_at": row.get::<_, String>(6)?,
            "persona_name": row.get::<_, String>(7)?,
            "persona_color": row.get::<_, String>(8)?
        }))
    }).map_err(|e| format!("SQL query error: {}", e))?;
    
    let workstreams: Result<Vec<Value>, rusqlite::Error> = workstream_iter.collect();
    workstreams.map_err(|e| format!("SQL collect error: {}", e))
}

#[tauri::command]
async fn update_workstream(
    state: tauri::State<'_, AppState>,
    id: String,
    name: Option<String>,
    description: Option<String>,
    status: String
) -> Result<Value, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    // Check if workstream exists
    let mut stmt = db.prepare("SELECT id, persona_id, name, description, status, created_at, updated_at FROM workstreams WHERE id = ?1")
        .map_err(|e| format!("SQL prepare error: {}", e))?;
    
    let existing_workstream: Result<Option<(String, String, String, Option<String>, String, String, String)>, rusqlite::Error> = 
        stmt.query_row([&id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, String>(6)?
            ))
        }).optional();
    
    let existing_workstream = existing_workstream.map_err(|e| format!("SQL query error: {}", e))?;
    
    if existing_workstream.is_none() {
        return Err(format!("Workstream with ID '{}' not found", id));
    }
    
    let (_, persona_id, old_name, old_description, _old_status_str, created_at, _) = existing_workstream.unwrap();
    
    let updated_name = name.unwrap_or(old_name);
    let updated_description = description.or(old_description);
    let updated_status_str = status;
    let updated_at = get_current_timestamp();
    
    // Clean the status string - remove surrounding quotes if present
    let cleaned_status = updated_status_str.trim_matches('"');
    println!("🔍 DEBUG: Cleaned status: '{}'", cleaned_status);
    
    // Validate status
    match cleaned_status {
        "planning" | "active" | "paused" | "completed" | "cancelled" => {},
        _ => return Err(format!("Invalid status: {}. Valid statuses: planning, active, paused, completed, cancelled", cleaned_status)),
    }
    
    db.execute(
        "UPDATE workstreams SET name = ?1, description = ?2, status = ?3, updated_at = ?4 WHERE id = ?5",
        rusqlite::params![updated_name, updated_description, cleaned_status, updated_at.to_rfc3339(), id]
    ).map_err(|e| format!("SQL update error: {}", e))?;
    
    let updated_workstream = Workstream {
        id: id.clone(),
        persona_id,
        name: updated_name,
        description: updated_description,
        status: serde_json::from_str(&format!("\"{}\"", cleaned_status)).unwrap_or(WorkstreamStatus::Planning),
        priority: database::Priority::Medium,
        start_date: None,
        target_date: None,
        completed_date: None,
        progress_percentage: 0,
        created_at: chrono::DateTime::parse_from_rfc3339(&created_at).unwrap().with_timezone(&chrono::Utc),
        updated_at,
    };
    
    Ok(serde_json::to_value(updated_workstream).map_err(|e| format!("Serialization error: {}", e))?)
}

#[tauri::command]
async fn delete_workstream(state: tauri::State<'_, AppState>, id: String) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    // Check if workstream exists first
    let mut stmt = db.prepare("SELECT name FROM workstreams WHERE id = ?1")
        .map_err(|e| format!("SQL prepare error: {}", e))?;
    
    let workstream_name: Result<Option<String>, rusqlite::Error> = stmt.query_row([&id], |row| {
        Ok(row.get::<_, String>(0)?)
    }).optional();
    
    let workstream_name = workstream_name.map_err(|e| format!("SQL query error: {}", e))?;
    
    if workstream_name.is_none() {
        return Err(format!("Workstream with ID '{}' not found", id));
    }
    
    // Delete the workstream
    let changes = db.execute("DELETE FROM workstreams WHERE id = ?1", [&id])
        .map_err(|e| format!("SQL delete error: {}", e))?;
    
    if changes == 0 {
        return Err(format!("No workstream was deleted with ID '{}'", id));
    }
    
    Ok(format!("Successfully deleted workstream '{}' with ID: {}", workstream_name.unwrap(), id))
}

// Project Task Management Commands
#[tauri::command]
async fn create_project_task(
    state: tauri::State<'_, AppState>,
    workstream_id: String,
    title: String,
    description: Option<String>,
    status: String,
    priority: String
) -> Result<Value, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // Verify workstream exists
    let mut stmt = db.prepare("SELECT id FROM workstreams WHERE id = ?1")
        .map_err(|e| format!("SQL prepare error: {}", e))?;

    let workstream_exists: Result<Option<String>, rusqlite::Error> = stmt.query_row([&workstream_id], |row| {
        Ok(row.get::<_, String>(0)?)
    }).optional();

    let workstream_exists = workstream_exists.map_err(|e| format!("SQL query error: {}", e))?;

    if workstream_exists.is_none() {
        return Err(format!("Workstream with ID '{}' not found", workstream_id));
    }

    // Parse status and priority
    let task_status = match status.as_str() {
        "backlog" => database::TaskStatus::Backlog,
        "todo" => database::TaskStatus::ToDo,
        "inprogress" => database::TaskStatus::InProgress,
        "review" => database::TaskStatus::Review,
        "done" => database::TaskStatus::Done,
        _ => return Err(format!("Invalid status: {}. Valid statuses: backlog, todo, inprogress, review, done", status)),
    };

    let task_priority = match priority.as_str() {
        "low" => database::Priority::Low,
        "medium" => database::Priority::Medium,
        "high" => database::Priority::High,
        "critical" => database::Priority::Critical,
        _ => return Err(format!("Invalid priority: {}. Valid priorities: low, medium, high, critical", priority)),
    };

    let task = database::ProjectTask {
        id: database::generate_id(),
        workstream_id,
        title: title.clone(),
        description,
        status: task_status,
        priority: task_priority,
        due_date: None,
        completed_date: None,
        estimated_hours: None,
        actual_hours: None,
        tags: Vec::new(),
        dependencies: Vec::new(),
        created_at: database::get_current_timestamp(),
        updated_at: database::get_current_timestamp(),
    };

    db.execute(
        "INSERT INTO project_tasks (id, workstream_id, title, description, status, priority, due_date, completed_date, estimated_hours, actual_hours, tags, dependencies, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        rusqlite::params![
            task.id,
            task.workstream_id,
            task.title,
            task.description,
            serde_json::to_string(&task.status).map_err(|e| format!("Status serialization error: {}", e))?,
            serde_json::to_string(&task.priority).map_err(|e| format!("Priority serialization error: {}", e))?,
            task.due_date.map(|d| d.to_rfc3339()),
            task.completed_date.map(|d| d.to_rfc3339()),
            task.estimated_hours,
            task.actual_hours,
            serde_json::to_string(&task.tags).map_err(|e| format!("Tags serialization error: {}", e))?,
            serde_json::to_string(&task.dependencies).map_err(|e| format!("Dependencies serialization error: {}", e))?,
            task.created_at.to_rfc3339(),
            task.updated_at.to_rfc3339()
        ]
    ).map_err(|e| format!("SQL insert error: {}", e))?;

    Ok(serde_json::to_value(task).map_err(|e| format!("Serialization error: {}", e))?)
}

#[tauri::command]
async fn get_tasks_by_workstream(
    state: tauri::State<'_, AppState>,
    workstream_id: String
) -> Result<Vec<Value>, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    let mut stmt = db.prepare("SELECT id, workstream_id, title, description, status, priority, due_date, completed_date, estimated_hours, actual_hours, tags, dependencies, created_at, updated_at FROM project_tasks WHERE workstream_id = ?1 ORDER BY created_at DESC")
        .map_err(|e| format!("SQL prepare error: {}", e))?;

    let task_iter = stmt.query_map([&workstream_id], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "workstream_id": row.get::<_, String>(1)?,
            "title": row.get::<_, String>(2)?,
            "description": row.get::<_, Option<String>>(3)?,
            "status": row.get::<_, String>(4)?,
            "priority": row.get::<_, String>(5)?,
            "due_date": row.get::<_, Option<String>>(6)?,
            "completed_date": row.get::<_, Option<String>>(7)?,
            "estimated_hours": row.get::<_, Option<f64>>(8)?,
            "actual_hours": row.get::<_, Option<f64>>(9)?,
            "tags": row.get::<_, String>(10)?,
            "dependencies": row.get::<_, String>(11)?,
            "created_at": row.get::<_, String>(12)?,
            "updated_at": row.get::<_, String>(13)?
        }))
    }).map_err(|e| format!("SQL query error: {}", e))?;

    let tasks: Result<Vec<Value>, rusqlite::Error> = task_iter.collect();
    tasks.map_err(|e| format!("SQL collect error: {}", e))
}

#[tauri::command]
async fn get_all_project_tasks(state: tauri::State<'_, AppState>) -> Result<Vec<Value>, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    let mut stmt = db.prepare("SELECT t.id, t.workstream_id, t.title, t.description, t.status, t.priority, t.due_date, t.completed_date, t.estimated_hours, t.actual_hours, t.tags, t.dependencies, t.created_at, t.updated_at, w.name as workstream_name, w.persona_id, p.name as persona_name, p.color as persona_color FROM project_tasks t JOIN workstreams w ON t.workstream_id = w.id JOIN personas p ON w.persona_id = p.id ORDER BY t.created_at DESC")
        .map_err(|e| format!("SQL prepare error: {}", e))?;

    let task_iter = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "workstream_id": row.get::<_, String>(1)?,
            "title": row.get::<_, String>(2)?,
            "description": row.get::<_, Option<String>>(3)?,
            "status": row.get::<_, String>(4)?,
            "priority": row.get::<_, String>(5)?,
            "due_date": row.get::<_, Option<String>>(6)?,
            "completed_date": row.get::<_, Option<String>>(7)?,
            "estimated_hours": row.get::<_, Option<f64>>(8)?,
            "actual_hours": row.get::<_, Option<f64>>(9)?,
            "tags": row.get::<_, String>(10)?,
            "dependencies": row.get::<_, String>(11)?,
            "created_at": row.get::<_, String>(12)?,
            "updated_at": row.get::<_, String>(13)?,
            "workstream_name": row.get::<_, String>(14)?,
            "persona_id": row.get::<_, String>(15)?,
            "persona_name": row.get::<_, String>(16)?,
            "persona_color": row.get::<_, String>(17)?
        }))
    }).map_err(|e| format!("SQL query error: {}", e))?;

    let tasks: Result<Vec<Value>, rusqlite::Error> = task_iter.collect();
    tasks.map_err(|e| format!("SQL collect error: {}", e))
}

#[tauri::command]
async fn update_project_task(
    state: tauri::State<'_, AppState>,
    id: String,
    title: Option<String>,
    description: Option<String>,
    status: String,
    priority: String
) -> Result<Value, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // Check if task exists
    let mut stmt = db.prepare("SELECT id, workstream_id, title, description, status, priority, created_at, updated_at FROM project_tasks WHERE id = ?1")
        .map_err(|e| format!("SQL prepare error: {}", e))?;

    let existing_task: Result<Option<(String, String, String, Option<String>, String, String, String, String)>, rusqlite::Error> =
        stmt.query_row([&id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, String>(6)?,
                row.get::<_, String>(7)?
            ))
        }).optional();

    let existing_task = existing_task.map_err(|e| format!("SQL query error: {}", e))?;

    if existing_task.is_none() {
        return Err(format!("Project task with ID '{}' not found", id));
    }

    let (_, workstream_id, old_title, old_description, _old_status_str, _old_priority_str, created_at, _) = existing_task.unwrap();

    let updated_title = title.unwrap_or(old_title);
    let updated_description = description.or(old_description);
    let updated_status_str = status;
    let updated_priority_str = priority;
    let updated_at = database::get_current_timestamp();

    // Clean the status string - remove surrounding quotes if present
    let cleaned_status = updated_status_str.trim_matches('"');
    let cleaned_priority = updated_priority_str.trim_matches('"');

    // Validate status and priority
    match cleaned_status {
        "backlog" | "todo" | "inprogress" | "review" | "done" => {},
        _ => return Err(format!("Invalid status: {}. Valid statuses: backlog, todo, inprogress, review, done", cleaned_status)),
    }

    match cleaned_priority {
        "low" | "medium" | "high" | "critical" => {},
        _ => return Err(format!("Invalid priority: {}. Valid priorities: low, medium, high, critical", cleaned_priority)),
    }

    db.execute(
        "UPDATE project_tasks SET title = ?1, description = ?2, status = ?3, priority = ?4, updated_at = ?5 WHERE id = ?6",
        rusqlite::params![updated_title, updated_description, cleaned_status, cleaned_priority, updated_at.to_rfc3339(), id]
    ).map_err(|e| format!("SQL update error: {}", e))?;

    let updated_task = database::ProjectTask {
        id: id.clone(),
        workstream_id,
        title: updated_title,
        description: updated_description,
        status: serde_json::from_str(&format!("\"{}\"", cleaned_status)).unwrap_or(database::TaskStatus::Backlog),
        priority: serde_json::from_str(&format!("\"{}\"", cleaned_priority)).unwrap_or(database::Priority::Medium),
        due_date: None,
        completed_date: None,
        estimated_hours: None,
        actual_hours: None,
        tags: Vec::new(),
        dependencies: Vec::new(),
        created_at: chrono::DateTime::parse_from_rfc3339(&created_at).unwrap().with_timezone(&chrono::Utc),
        updated_at,
    };

    Ok(serde_json::to_value(updated_task).map_err(|e| format!("Serialization error: {}", e))?)
}

#[tauri::command]
async fn delete_project_task(state: tauri::State<'_, AppState>, id: String) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // Get task title for confirmation message
    let mut stmt = db.prepare("SELECT title FROM project_tasks WHERE id = ?1")
        .map_err(|e| format!("SQL prepare error: {}", e))?;

    let task_title: Result<Option<String>, rusqlite::Error> = stmt.query_row([&id], |row| {
        Ok(row.get::<_, String>(0)?)
    }).optional();

    let task_title = task_title.map_err(|e| format!("SQL query error: {}", e))?;

    if task_title.is_none() {
        return Err(format!("Project task with ID '{}' not found", id));
    }

    db.execute("DELETE FROM project_tasks WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| format!("SQL delete error: {}", e))?;
    
    Ok(format!("Successfully deleted project task '{}' with ID: {}", task_title.unwrap(), id))
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
        .invoke_handler(tauri::generate_handler![greet, test_database_connection, create_test_persona, get_all_personas, delete_persona, clear_all_personas, create_persona, update_persona, create_workstream, get_workstreams_by_persona, get_all_workstreams, update_workstream, delete_workstream, create_project_task, get_tasks_by_workstream, get_all_project_tasks, update_project_task, delete_project_task])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
