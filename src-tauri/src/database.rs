use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

// Database Models

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Persona {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workstream {
    pub id: String,
    pub persona_id: String,
    pub name: String,
    pub description: Option<String>,
    pub status: WorkstreamStatus,
    pub priority: Priority,
    pub start_date: Option<DateTime<Utc>>,
    pub target_date: Option<DateTime<Utc>>,
    pub completed_date: Option<DateTime<Utc>>,
    pub progress_percentage: u8,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectTask {
    pub id: String,
    pub workstream_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: Priority,
    pub due_date: Option<DateTime<Utc>>,
    pub completed_date: Option<DateTime<Utc>>,
    pub estimated_hours: Option<f32>,
    pub actual_hours: Option<f32>,
    pub tags: Vec<String>,
    pub dependencies: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HabitTracker {
    pub id: String,
    pub workstream_id: String,
    pub name: String,
    pub description: Option<String>,
    pub target_frequency: HabitFrequency,
    pub target_quantity: Option<u32>,
    pub unit: Option<String>,
    pub is_active: bool,
    pub color: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HabitCompletion {
    pub id: String,
    pub habit_tracker_id: String,
    pub date: String, // YYYY-MM-DD format
    pub completed: bool,
    pub quantity_completed: Option<u32>,
    pub notes: Option<String>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JournalEntry {
    pub id: String,
    pub workstream_id: Option<String>,
    pub persona_id: Option<String>,
    pub title: String,
    pub content: String,
    pub entry_type: JournalEntryType,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Enums

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WorkstreamStatus {
    Active,
    Paused,
    Completed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TaskStatus {
    Backlog,
    ToDo,
    InProgress,
    Review,
    Done,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Priority {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HabitFrequency {
    Daily,
    Weekly { target_days: u8 },
    Custom { pattern: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JournalEntryType {
    Note,
    Update,
    Reflection,
    Meeting,
}

// Database Schema Creation

pub fn get_database_schema() -> &'static str {
    r#"
    -- personas table
    CREATE TABLE IF NOT EXISTS personas (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT 1
    );

    -- workstreams table
    CREATE TABLE IF NOT EXISTS workstreams (
        id TEXT PRIMARY KEY,
        persona_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        start_date TEXT,
        target_date TEXT,
        completed_date TEXT,
        progress_percentage INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (persona_id) REFERENCES personas (id)
    );

    -- project_tasks table
    CREATE TABLE IF NOT EXISTS project_tasks (
        id TEXT PRIMARY KEY,
        workstream_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        due_date TEXT,
        completed_date TEXT,
        estimated_hours REAL,
        actual_hours REAL,
        tags TEXT, -- JSON array
        dependencies TEXT, -- JSON array
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (workstream_id) REFERENCES workstreams (id)
    );

    -- habit_trackers table
    CREATE TABLE IF NOT EXISTS habit_trackers (
        id TEXT PRIMARY KEY,
        workstream_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        target_frequency TEXT NOT NULL,
        target_quantity INTEGER,
        unit TEXT,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        color TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (workstream_id) REFERENCES workstreams (id)
    );

    -- habit_completions table
    CREATE TABLE IF NOT EXISTS habit_completions (
        id TEXT PRIMARY KEY,
        habit_tracker_id TEXT NOT NULL,
        date TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT 0,
        quantity_completed INTEGER,
        notes TEXT,
        completed_at TEXT,
        FOREIGN KEY (habit_tracker_id) REFERENCES habit_trackers (id),
        UNIQUE(habit_tracker_id, date)
    );

    -- journal_entries table
    CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        workstream_id TEXT,
        persona_id TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        entry_type TEXT NOT NULL,
        tags TEXT, -- JSON array
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (workstream_id) REFERENCES workstreams (id),
        FOREIGN KEY (persona_id) REFERENCES personas (id)
    );
    "#
}

// Helper functions for ID generation
pub fn generate_id() -> String {
    Uuid::new_v4().to_string()
}

pub fn get_current_timestamp() -> DateTime<Utc> {
    Utc::now()
}
