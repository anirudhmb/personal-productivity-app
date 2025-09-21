import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  // Mock data for now - will be replaced with real data later
  const personas = [
    { id: 1, name: 'Work', color: 'var(--color-work)', progress: 75, activeWorkstreams: 3 },
    { id: 2, name: 'Fitness', color: 'var(--color-fitness)', progress: 60, activeWorkstreams: 2 },
    { id: 3, name: 'Learning', color: 'var(--color-learning)', progress: 40, activeWorkstreams: 1 },
  ];

  const recentActivity = [
    { id: 1, type: 'task', description: 'Completed "Design database schema"', time: '2 hours ago' },
    { id: 2, type: 'habit', description: 'Logged morning workout', time: '4 hours ago' },
    { id: 3, type: 'journal', description: 'Added journal entry to Q4 Goals', time: '1 day ago' },
  ];

  const upcomingDeadlines = [
    { id: 1, title: 'API Documentation', dueDate: 'Tomorrow', priority: 'high' },
    { id: 2, title: 'Fitness Assessment', dueDate: 'In 3 days', priority: 'medium' },
    { id: 3, title: 'Learning Project Demo', dueDate: 'Next week', priority: 'low' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back! Here's your productivity overview.</p>
      </div>

      <div className="dashboard-content">
        {/* Persona Overview Cards */}
        <section className="dashboard-section">
          <h2 className="section-title">Your Personas</h2>
          <div className="persona-cards grid grid-3">
            {personas.map((persona) => (
              <div key={persona.id} className="persona-card card">
                <div className="persona-header">
                  <h3 className="persona-name">{persona.name}</h3>
                  <div 
                    className="persona-color-indicator"
                    style={{ backgroundColor: persona.color }}
                  />
                </div>
                <div className="persona-stats">
                  <div className="stat">
                    <span className="stat-value">{persona.activeWorkstreams}</span>
                    <span className="stat-label">Active Workstreams</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{persona.progress}%</span>
                    <span className="stat-label">Overall Progress</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${persona.progress}%`,
                      backgroundColor: persona.color 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="dashboard-grid grid grid-2">
          {/* Recent Activity */}
          <section className="dashboard-section">
            <h2 className="section-title">Recent Activity</h2>
            <div className="activity-list card">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'task' && '✅'}
                    {activity.type === 'habit' && '🏃‍♂️'}
                    {activity.type === 'journal' && '📝'}
                  </div>
                  <div className="activity-content">
                    <p className="activity-description">{activity.description}</p>
                    <span className="activity-time text-muted">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Deadlines */}
          <section className="dashboard-section">
            <h2 className="section-title">Upcoming Deadlines</h2>
            <div className="deadlines-list card">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="deadline-item">
                  <div className="deadline-content">
                    <h4 className="deadline-title">{deadline.title}</h4>
                    <span className="deadline-date text-muted">{deadline.dueDate}</span>
                  </div>
                  <span className={`priority-badge priority-${deadline.priority}`}>
                    {deadline.priority}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
