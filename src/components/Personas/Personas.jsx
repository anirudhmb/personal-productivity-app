import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './Personas.css';

const Personas = () => {
  const [personas, setPersonas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPersona, setEditingPersona] = useState(null);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  // Predefined color palette
  const colorPalette = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Emerald', value: '#059669' }
  ];

  // Load personas on component mount
  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await invoke('get_all_personas');
      setPersonas(result);
    } catch (error) {
      setError(`Failed to load personas: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePersona = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Persona name is required');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await invoke('create_persona', {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color
      });
      
      setPersonas(prev => [result, ...prev]);
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      setError(`Failed to create persona: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePersona = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Persona name is required');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await invoke('update_persona', {
        id: editingPersona.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color
      });
      
      setPersonas(prev => prev.map(p => p.id === editingPersona.id ? result : p));
      setEditingPersona(null);
      resetForm();
    } catch (error) {
      setError(`Failed to update persona: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePersona = async (personaId, personaName) => {
    if (!confirm(`Are you sure you want to delete "${personaName}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await invoke('delete_persona', { id: personaId });
      setPersonas(prev => prev.filter(p => p.id !== personaId));
    } catch (error) {
      setError(`Failed to delete persona: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (persona) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await invoke('update_persona', {
        id: persona.id,
        is_active: !persona.is_active
      });
      
      setPersonas(prev => prev.map(p => p.id === persona.id ? result : p));
    } catch (error) {
      setError(`Failed to update persona: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (persona) => {
    setEditingPersona(persona);
    setFormData({
      name: persona.name,
      description: persona.description || '',
      color: persona.color
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6'
    });
    setEditingPersona(null);
    setError('');
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    resetForm();
  };

  return (
    <div className="personas">
      <div className="personas-header">
        <div className="personas-title-section">
          <h1 className="personas-title">Personas</h1>
          <p className="personas-subtitle">Manage your different life contexts and roles</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
          disabled={isLoading}
        >
          ➕ Add Persona
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="persona-form-overlay">
          <div className="persona-form card">
            <div className="form-header">
              <h2 className="form-title">
                {editingPersona ? 'Edit Persona' : 'Create New Persona'}
              </h2>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={cancelForm}
                disabled={isLoading}
              >
                ✕ Cancel
              </button>
            </div>

            <form onSubmit={editingPersona ? handleUpdatePersona : handleCreatePersona}>
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Work, Fitness, Learning"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this persona..."
                  disabled={isLoading}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Color</label>
                <div className="color-palette">
                  {colorPalette.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`color-option ${formData.color === color.value ? 'selected' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      disabled={isLoading}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelForm}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || !formData.name.trim()}
                >
                  {isLoading ? '⏳ Saving...' : (editingPersona ? '💾 Update Persona' : '➕ Create Persona')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Personas List */}
      <div className="personas-content">
        {isLoading && personas.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <p>Loading personas...</p>
          </div>
        ) : personas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3 className="empty-title">No Personas Yet</h3>
            <p className="empty-message">
              Create your first persona to start organizing your productivity goals.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              ➕ Create Your First Persona
            </button>
          </div>
        ) : (
          <div className="personas-grid">
            {personas.map((persona) => (
              <div key={persona.id} className={`persona-card card ${!persona.is_active ? 'inactive' : ''}`}>
                <div className="persona-card-header">
                  <div className="persona-color" style={{ backgroundColor: persona.color }} />
                  <div className="persona-info">
                    <h3 className="persona-name">{persona.name}</h3>
                    {persona.description && (
                      <p className="persona-description">{persona.description}</p>
                    )}
                  </div>
                  <div className="persona-status">
                    <button
                      className={`status-toggle ${persona.is_active ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleActive(persona)}
                      disabled={isLoading}
                      title={persona.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {persona.is_active ? '🟢' : '⚪'}
                    </button>
                  </div>
                </div>

                <div className="persona-card-footer">
                  <div className="persona-meta">
                    <span className="meta-item">
                      Created: {new Date(persona.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="persona-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => startEdit(persona)}
                      disabled={isLoading}
                      title="Edit persona"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeletePersona(persona.id, persona.name)}
                      disabled={isLoading}
                      title="Delete persona"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Personas;