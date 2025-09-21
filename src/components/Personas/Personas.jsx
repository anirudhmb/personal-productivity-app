import React from 'react';
import './Personas.css';

const Personas = () => {
  return (
    <div className="personas">
      <div className="personas-header">
        <h1 className="personas-title">Personas</h1>
        <p className="personas-subtitle">Manage your different life areas and roles.</p>
        <button className="btn btn-primary">
          + Add New Persona
        </button>
      </div>
      
      <div className="personas-content">
        <div className="card">
          <p className="text-center text-muted">
            Persona management interface coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Personas;
