import React, { useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Personas from './components/Personas/Personas';
import Workstreams from './components/Workstreams/Workstreams';
import Tasks from './components/Tasks/Tasks';
import Journal from './components/Journal/Journal';
import Habits from './components/Habits/Habits';
import DatabaseTest from './components/DatabaseTest/DatabaseTest';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'personas':
        return <Personas />;
      case 'workstreams':
        return <Workstreams />;
      case 'tasks':
        return <Tasks />;
      case 'journal':
        return <Journal />;
      case 'habits':
        return <Habits />;
      case 'database-test':
        return <DatabaseTest />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;
