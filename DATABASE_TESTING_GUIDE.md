# SQLite Database Testing Guide

Your Tauri app uses SQLite with the database file located at:
```
/Users/abelathur/Learn/tauri projects/personal-productivity-app/src-tauri/data.db
```

## Database Schema

Your database contains the following tables:
- **personas** - User personas/identities
- **workstreams** - Project streams linked to personas
- **project_tasks** - Individual tasks within workstreams
- **habit_trackers** - Habit tracking definitions
- **habit_completions** - Daily habit completion records
- **journal_entries** - Journal entries linked to personas/workstreams

## Testing Tools & Methods

### 1. SQLite Command Line Tool (Built-in)

```bash
# Connect to database
sqlite3 "/Users/abelathur/Learn/tauri projects/personal-productivity-app/src-tauri/data.db"

# Useful commands:
.tables                    # List all tables
.schema                    # Show complete schema
.schema table_name         # Show schema for specific table
.headers on               # Show column headers
.mode column              # Format output nicely
.mode json                # Output as JSON
SELECT * FROM personas;    # Query data
.exit                     # Exit sqlite3
```

### 2. SQLite Utils (Installed)

```bash
# Query data with nice formatting
sqlite-utils query "/Users/abelathur/Learn/tauri projects/personal-productivity-app/src-tauri/data.db" "SELECT * FROM personas" --table

# Query as JSON
sqlite-utils query "/Users/abelathur/Learn/tauri projects/personal-productivity-app/src-tauri/data.db" "SELECT * FROM personas" --json

# Get table info
sqlite-utils tables "/Users/abelathur/Learn/tauri projects/personal-productivity-app/src-tauri/data.db"

# Get schema info
sqlite-utils schema "/Users/abelathur/Learn/tauri projects/personal-productivity-app/src-tauri/data.db"
```

### 3. DB Browser for SQLite (GUI Tool)

You can manually install DB Browser for SQLite from:
- Download: https://sqlitebrowser.org/
- Or try: `brew install --cask db-browser-for-sqlite` (may need sudo)

Features:
- Visual database browser
- Query builder
- Data editing
- Schema visualization
- Export capabilities

### 4. VS Code Extensions

Install these VS Code extensions for SQLite support:
- **SQLite Viewer** - Browse and query SQLite databases
- **SQLite** - Execute SQL queries directly in VS Code

### 5. Online SQLite Tools

- **SQLite Online** (https://sqliteonline.com/) - Upload your .db file
- **DB Browser for SQLite Online** - Web-based version

### 6. Python Scripts (if you have Python)

```python
import sqlite3
import json

# Connect to database
conn = sqlite3.connect('/Users/abelathur/Learn/tauri projects/personal-productivity-app/src-tauri/data.db')
cursor = conn.cursor()

# Query data
cursor.execute("SELECT * FROM personas")
rows = cursor.fetchall()

# Get column names
columns = [description[0] for description in cursor.description]

# Convert to list of dictionaries
data = [dict(zip(columns, row)) for row in rows]
print(json.dumps(data, indent=2))

conn.close()
```

## Sample Queries

### Basic Queries
```sql
-- Get all personas
SELECT * FROM personas;

-- Count records in each table
SELECT 'personas' as table_name, COUNT(*) as count FROM personas
UNION ALL
SELECT 'workstreams', COUNT(*) FROM workstreams
UNION ALL
SELECT 'project_tasks', COUNT(*) FROM project_tasks
UNION ALL
SELECT 'habit_trackers', COUNT(*) FROM habit_trackers
UNION ALL
SELECT 'habit_completions', COUNT(*) FROM habit_completions
UNION ALL
SELECT 'journal_entries', COUNT(*) FROM journal_entries;

-- Get recent personas
SELECT name, created_at FROM personas ORDER BY created_at DESC LIMIT 5;
```

### Advanced Queries
```sql
-- Get personas with their workstreams
SELECT p.name as persona_name, w.name as workstream_name, w.status
FROM personas p
LEFT JOIN workstreams w ON p.id = w.persona_id;

-- Get habit completion statistics
SELECT ht.name, COUNT(hc.id) as completions, 
       COUNT(CASE WHEN hc.completed = 1 THEN 1 END) as successful_completions
FROM habit_trackers ht
LEFT JOIN habit_completions hc ON ht.id = hc.habit_tracker_id
GROUP BY ht.id, ht.name;
```

## Testing Your Tauri Commands

Your Rust code already includes test commands:
- `test_database_connection` - Tests database connectivity
- `create_test_persona` - Creates a test persona
- `get_all_personas` - Retrieves all personas

You can test these through your Tauri app's frontend or by calling them directly.

## Database File Location

The database file is created at runtime in the `src-tauri` directory:
```
src-tauri/data.db
```

This file persists between app runs and contains all your data.

## Backup & Restore

```bash
# Backup database
cp "/Users/abelathur/Learn/tauri projects/personal-productivity-app/src-tauri/data.db" backup_$(date +%Y%m%d_%H%M%S).db

# Restore from backup
cp backup_20250121_143000.db "/Users/abelathur/Learn/tauri projects/personal-productivity-app/src-tauri/data.db"
```

## Performance Testing

```bash
# Check database size
ls -lh "/Users/abelathur/Learn/tauri projects/personal-productivity-app/src-tauri/data.db"

# Analyze query performance
sqlite3 "/Users/abelathur/Learn/tauri projects/personal-productivity-app/src-tauri/data.db" "EXPLAIN QUERY PLAN SELECT * FROM personas WHERE is_active = 1;"
```
