import React from 'react';
import './Sidebar.css';

const Sidebar = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'personas', label: 'Personas', icon: '👤' },
    { id: 'workstreams', label: 'Workstreams', icon: '🎯' },
    { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'journal', label: 'Journal', icon: '📝' },
    { id: 'habits', label: 'Habits', icon: '🏃‍♂️' },
    { id: 'database-test', label: 'Database Test', icon: '🗄️' },
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Productivity</h1>
        <p className="sidebar-subtitle">Personal Tracker</p>
      </div>
      
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.id} className="sidebar-item">
            <button
              className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      
      <div className="sidebar-footer">
        <button className="btn btn-secondary btn-sm">
          ⚙️ Settings
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
