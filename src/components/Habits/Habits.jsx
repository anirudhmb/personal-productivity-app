import React from 'react';
import './Habits.css';

const Habits = () => {
  return (
    <div className="habits">
      <div className="habits-header">
        <h1 className="habits-title">Habits</h1>
        <p className="habits-subtitle">Track your daily routines and build consistency.</p>
        <button className="btn btn-primary">
          + Add Habit
        </button>
      </div>
      
      <div className="habits-content">
        <div className="card">
          <p className="text-center text-muted">
            Habit tracking interface coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Habits;
