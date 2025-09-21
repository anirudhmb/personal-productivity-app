# Personal Productivity App - Product Design

## 🎯 Vision
A comprehensive personal productivity system that combines goal tracking, task management, and journaling across multiple life personas with flexible organization and powerful filtering capabilities.

## 📊 Data Model

### Core Entities

#### 1. Persona
```rust
struct Persona {
    id: String,
    name: String,
    description: Option<String>,
    color: String, // Hex color code
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    is_active: bool,
}
```

#### 2. Workstream/Project
```rust
struct Workstream {
    id: String,
    persona_id: String,
    name: String,
    description: Option<String>,
    status: WorkstreamStatus, // Active, Paused, Completed, Cancelled
    priority: Priority, // Low, Medium, High, Critical
    start_date: Option<DateTime<Utc>>,
    target_date: Option<DateTime<Utc>>,
    completed_date: Option<DateTime<Utc>>,
    progress_percentage: u8, // 0-100
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}
```

#### 3. Project Task
```rust
struct ProjectTask {
    id: String,
    workstream_id: String,
    title: String,
    description: Option<String>,
    status: TaskStatus, // Backlog, ToDo, InProgress, Review, Done
    priority: Priority,
    due_date: Option<DateTime<Utc>>,
    completed_date: Option<DateTime<Utc>>,
    estimated_hours: Option<f32>,
    actual_hours: Option<f32>,
    tags: Vec<String>,
    dependencies: Vec<String>, // IDs of other tasks that must be completed first
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}
```

#### 4. Habit Tracker
```rust
struct HabitTracker {
    id: String,
    workstream_id: String,
    name: String,
    description: Option<String>,
    target_frequency: HabitFrequency,
    target_quantity: Option<u32>, // e.g., 50 pages, 2 workouts
    unit: Option<String>, // "pages", "workouts", "meals", "minutes"
    is_active: bool,
    color: String, // For visual distinction
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

enum HabitFrequency {
    Daily,
    Weekly { target_days: u8 }, // e.g., 5 days per week
    Custom { pattern: String }, // e.g., "Mon,Wed,Fri"
}

struct HabitCompletion {
    id: String,
    habit_tracker_id: String,
    date: Date<Utc>,
    completed: bool,
    quantity_completed: Option<u32>, // Actual quantity achieved
    notes: Option<String>,
    completed_at: Option<DateTime<Utc>>,
}
```

#### 4. Journal Entry
```rust
struct JournalEntry {
    id: String,
    workstream_id: Option<String>, // None for global entries
    persona_id: Option<String>, // None for global entries
    title: String,
    content: String, // Rich text/HTML
    entry_type: JournalEntryType, // Note, Update, Reflection, Meeting
    tags: Vec<String>,
    attachments: Vec<Attachment>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

struct Attachment {
    id: String,
    filename: String,
    file_path: String,
    file_size: u64,
    mime_type: String,
    uploaded_at: DateTime<Utc>,
}
```

## 🎨 User Interface Design

### Navigation Structure
```
Main App
├── Dashboard (Overview of all personas)
├── Personas
│   ├── Persona List View
│   └── Persona Detail View
│       ├── Workstreams Tab
│       ├── Project Tasks Tab (Kanban Board)
│       ├── Habit Trackers Tab (Daily Check-ins)
│       └── Journal Tab
├── Global Journal
│   ├── Timeline View
│   ├── Filter Panel
│   └── Search
├── Habit Dashboard (Cross-persona habit overview)
└── Settings
    ├── Persona Management
    ├── App Preferences
    └── Data Export/Import
```

### Key UI Components

#### 1. Dashboard
- **Persona Cards**: Quick overview of each persona
- **Recent Activity**: Latest tasks completed, journal entries
- **Upcoming Deadlines**: Tasks due soon across all personas
- **Progress Overview**: Visual progress bars for active workstreams

#### 2. Project Tasks (Kanban Board)
- **Columns**: Backlog, To Do, In Progress, Review, Done
- **Task Cards**: Title, priority indicator, due date, estimated hours
- **Drag & Drop**: Move tasks between columns
- **Quick Actions**: Edit, duplicate, delete, add dependencies

#### 3. Habit Trackers (Daily Check-ins)
- **Calendar View**: Monthly grid showing completion status
- **Daily View**: List of habits with checkboxes and quantity inputs
- **Streak Counter**: Visual streak indicators for each habit
- **Progress Bars**: Show daily/weekly progress toward targets
- **Quick Log**: Fast entry for common habits (one-click completion)

#### 3. Journal Interface
- **Rich Text Editor**: Bold, italic, lists, links, images
- **Date/Time Picker**: Automatic timestamp with manual override
- **Tag System**: Autocomplete with existing tags
- **Attachment Support**: Drag & drop files, images

#### 4. Habit Dashboard (Cross-Persona View)
- **Today's Habits**: All active habits across all personas
- **Weekly Overview**: Calendar showing habit completion patterns
- **Streak Leaderboard**: Habits with longest current streaks
- **Progress Charts**: Visual representation of habit consistency
- **Quick Actions**: Bulk complete habits, skip habits, add notes

#### 5. Filter System
- **Persona Filter**: Multi-select dropdown
- **Workstream Filter**: Cascading from persona selection
- **Date Range**: Calendar picker with presets (Today, This Week, This Month)
- **Tag Filter**: Multi-select with autocomplete
- **Entry Type Filter**: Note, Update, Reflection, Meeting
- **Habit Filter**: Filter journal entries by associated habits

## 🚀 Feature Prioritization

### MVP (Minimum Viable Product)
1. **Persona Management**: Create, edit, delete personas
2. **Workstream Management**: Basic CRUD operations
3. **Project Tasks**: Simple task creation and completion
4. **Basic Habit Tracking**: Daily habit check-ins with quantity tracking
5. **Basic Journaling**: Text entries with timestamps
6. **Simple Filtering**: Filter journal by persona and date

### Phase 2
1. **Kanban Board**: Drag & drop project task management
2. **Habit Calendar**: Monthly view of habit completion
3. **Streak Tracking**: Visual streak indicators for habits
4. **Rich Text Journal**: Formatting, links, basic attachments
5. **Advanced Filtering**: Tags, entry types, complex queries
6. **Progress Tracking**: Visual progress indicators for workstreams

### Phase 3
1. **File Attachments**: Images, documents in journal
2. **Export/Import**: Data portability
3. **Analytics Dashboard**: Charts, productivity metrics
4. **Mobile Responsiveness**: Touch-friendly interface
5. **Offline Support**: Local storage with sync

## 🛠 Technical Considerations

### Frontend (Tauri)
- **Framework**: Vanilla HTML/CSS/JavaScript (as per current setup)
- **UI Library**: Consider adding a lightweight framework like Alpine.js
- **Styling**: CSS Grid/Flexbox for layouts, CSS custom properties for theming
- **State Management**: Simple custom state manager or localStorage

### Backend (Rust)
- **Database**: SQLite for local storage (embedded, no external dependencies)
- **ORM**: Consider `diesel` or `sqlx` for database operations
- **Serialization**: `serde` for JSON handling
- **Date/Time**: `chrono` for date handling

### Data Storage
- **Local SQLite Database**: 
  - `personas` table
  - `workstreams` table
  - `tasks` table
  - `journal_entries` table
  - `attachments` table
  - `tags` table (many-to-many relationships)

### Security & Privacy
- **Local Storage**: All data stays on user's machine
- **No Cloud Sync**: Privacy-first approach
- **Data Export**: JSON/CSV export for backup
- **Encryption**: Optional database encryption for sensitive data

## 🏃‍♂️ Habit Tracking Examples

### Fitness Persona - Daily Habits
```
🏋️ Morning Workout
   - Frequency: Daily
   - Target: 1 workout
   - Unit: "workout"
   - Quick Log: ✅ Complete / ⏭️ Skip

🏋️ Evening Workout  
   - Frequency: Daily
   - Target: 1 workout
   - Unit: "workout"
   - Quick Log: ✅ Complete / ⏭️ Skip

🍳 Morning Meal
   - Frequency: Daily
   - Target: 1 meal
   - Unit: "meal"
   - Quick Log: ✅ Complete / ⏭️ Skip

🍽️ Evening Meal
   - Frequency: Daily
   - Target: 1 meal
   - Unit: "meal"
   - Quick Log: ✅ Complete / ⏭️ Skip

📚 Read Pages
   - Frequency: Daily
   - Target: 50 pages
   - Unit: "pages"
   - Quantity Input: [____] pages read today
```

### Work Persona - Project Tasks
```
📋 Q4 Goals Workstream
   ├── 🎯 Project Tasks (Kanban)
   │   ├── Design database schema
   │   ├── Implement API endpoints
   │   └── Write documentation
   └── 📝 Journal Entries
       ├── "Made progress on API design today"
       └── "Blocked on authentication implementation"
```

### Learning Persona - Mixed Approach
```
📚 Learning Workstream
   ├── 🎯 Project Tasks
   │   ├── Complete Rust tutorial
   │   ├── Build sample project
   │   └── Write blog post
   └── 🏃‍♂️ Daily Habits
       ├── Read 30 minutes daily
       ├── Practice coding 1 hour daily
       └── Review flashcards daily
```

## 📱 User Experience Flow

### Onboarding
1. Welcome screen with app overview
2. Create first persona (e.g., "Work")
3. Create first workstream (e.g., "Q4 Goals")
4. Add first task
5. Write first journal entry

### Daily Usage
1. Open dashboard to see overview
2. Navigate to specific persona
3. Check kanban board for today's tasks
4. Update task statuses
5. Add journal entry for workstream updates
6. Review global journal for insights

### Weekly Review
1. Filter journal by date range (past week)
2. Review completed tasks across all personas
3. Update workstream progress
4. Plan upcoming tasks
5. Reflect on productivity patterns

## 🎯 Success Metrics

### User Engagement
- Daily active usage
- Tasks completed per day
- Journal entries per week
- Personas actively used

### Productivity Impact
- Goal completion rate
- Task completion time
- Workstream progress velocity
- Journal reflection frequency

## 🔄 Future Enhancements

### Advanced Features
- **Time Tracking**: Pomodoro timer integration
- **Habit Tracking**: Daily/weekly habit monitoring
- **Goal Templates**: Pre-defined workstream templates
- **Collaboration**: Share workstreams with others
- **Integrations**: Calendar sync, email integration
- **AI Insights**: Productivity pattern analysis
- **Themes**: Dark/light mode, custom color schemes

### Platform Expansion
- **Mobile App**: React Native or Flutter companion
- **Web Version**: Progressive Web App
- **Desktop Sync**: Multiple device synchronization
- **Cloud Backup**: Optional cloud storage integration

---

This design provides a solid foundation for building a comprehensive personal productivity system that grows with the user's needs while maintaining simplicity and privacy.
