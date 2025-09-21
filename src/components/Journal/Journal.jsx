import React from 'react';
import './Journal.css';

const Journal = () => {
  return (
    <div className="journal">
      <div className="journal-header">
        <h1 className="journal-title">Journal</h1>
        <p className="journal-subtitle">Reflect on your progress and capture insights.</p>
        <button className="btn btn-primary">
          + New Entry
        </button>
      </div>
      
      <div className="journal-content">
        <div className="card">
          <p className="text-center text-muted">
            Journal interface coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Journal;
