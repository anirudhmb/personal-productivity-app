import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './Workstreams.css';

const Workstreams = () => {
  const [workstreams, setWorkstreams] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWorkstream, setEditingWorkstream] = useState(null);
  const [error, setError] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    persona_id: '',
    name: '',
    description: '',
    status: 'planning'
  });

  // Status options
  const statusOptions = [
    { value: 'planning', label: 'Planning', icon: '📋', color: '#6b7280' },
    { value: 'active', label: 'Active', icon: '🚀', color: '#10b981' },
    { value: 'paused', label: 'Paused', icon: '⏸️', color: '#f59e0b' },
    { value: 'completed', label: 'Completed', icon: '✅', color: '#059669' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌', color: '#dc2626' }
  ];

  // Load data on component mount
  useEffect(() => {
    loadPersonas();
    loadWorkstreams();
  }, []);

  const loadPersonas = async () => {
    try {
      const result = await invoke('get_all_personas');
      setPersonas(result.filter(p => p.is_active));
    } catch (error) {
      console.error('Error loading personas:', error);
    }
  };

  const loadWorkstreams = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await invoke('get_all_workstreams');
      setWorkstreams(result);
    } catch (error) {
      setError(`Failed to load workstreams: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkstream = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Workstream name is required');
      return;
    }
    if (!formData.persona_id) {
      setError('Please select a persona');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await invoke('create_workstream', {
        personaId: formData.persona_id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status
      });
      
      setWorkstreams(prev => [result, ...prev]);
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      setError(`Failed to create workstream: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWorkstream = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Workstream name is required');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await invoke('update_workstream', {
        id: editingWorkstream.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status
      });
      
      setWorkstreams(prev => prev.map(w => w.id === editingWorkstream.id ? result : w));
      setEditingWorkstream(null);
      resetForm();
    } catch (error) {
      setError(`Failed to update workstream: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkstream = async (workstreamId, workstreamName) => {
    if (!confirm(`Are you sure you want to delete "${workstreamName}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await invoke('delete_workstream', { id: workstreamId });
      setWorkstreams(prev => prev.filter(w => w.id !== workstreamId));
    } catch (error) {
      setError(`Failed to delete workstream: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (workstream) => {
    setEditingWorkstream(workstream);
    setFormData({
      persona_id: workstream.persona_id,
      name: workstream.name,
      description: workstream.description || '',
      status: workstream.status.toLowerCase()
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      persona_id: '',
      name: '',
      description: '',
      status: 'planning'
    });
    setEditingWorkstream(null);
    setError('');
    setShowCreateForm(false);
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    resetForm();
  };

  const getStatusInfo = (status) => {
    // Handle both lowercase and capitalized status values for backward compatibility
    const normalizedStatus = status.toLowerCase();
    return statusOptions.find(s => s.value === normalizedStatus) || statusOptions[0];
  };

  const filteredWorkstreams = selectedPersona === 'all' 
    ? workstreams 
    : workstreams.filter(w => w.persona_id === selectedPersona);

  return (
    <div className="workstreams">
      <div className="workstreams-header">
        <div className="workstreams-title-section">
          <h1 className="workstreams-title">Workstreams</h1>
          <p className="workstreams-subtitle">Manage your projects and goals within each persona</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
          disabled={isLoading || personas.length === 0}
        >
          ➕ Add Workstream
        </button>
      </div>

      {personas.length === 0 && (
        <div className="warning-message">
          <span className="warning-icon">⚠️</span>
          You need to create at least one persona before adding workstreams.
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Filter */}
      {workstreams.length > 0 && (
        <div className="workstreams-filter">
          <label htmlFor="persona-filter" className="filter-label">Filter by Persona:</label>
          <select
            id="persona-filter"
            className="filter-select"
            value={selectedPersona}
            onChange={(e) => setSelectedPersona(e.target.value)}
          >
            <option value="all">All Personas</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="workstream-form-overlay">
          <div className="workstream-form card">
            <div className="form-header">
              <h2 className="form-title">
                {editingWorkstream ? 'Edit Workstream' : 'Create New Workstream'}
              </h2>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={cancelForm}
                disabled={isLoading}
              >
                ✕ Cancel
              </button>
            </div>

            <form onSubmit={editingWorkstream ? handleUpdateWorkstream : handleCreateWorkstream}>
              <div className="form-group">
                <label htmlFor="persona_id" className="form-label">
                  Persona *
                </label>
                <select
                  id="persona_id"
                  className="form-select"
                  value={formData.persona_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, persona_id: e.target.value }))}
                  disabled={isLoading || editingWorkstream}
                  required
                >
                  <option value="">Select a persona</option>
                  {personas.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.name}
                    </option>
                  ))}
                </select>
              </div>

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
                  placeholder="e.g., Q4 Product Launch, Fitness Goals"
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
                  placeholder="Brief description of this workstream..."
                  disabled={isLoading}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <select
                  id="status"
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  disabled={isLoading}
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.icon} {status.label}
                    </option>
                  ))}
                </select>
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
                  disabled={isLoading || !formData.name.trim() || !formData.persona_id}
                >
                  {isLoading ? '⏳ Saving...' : (editingWorkstream ? '💾 Update Workstream' : '➕ Create Workstream')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workstreams List */}
      <div className="workstreams-content">
        {isLoading && workstreams.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <p>Loading workstreams...</p>
          </div>
        ) : filteredWorkstreams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3 className="empty-title">
              {selectedPersona === 'all' ? 'No Workstreams Yet' : 'No Workstreams for Selected Persona'}
            </h3>
            <p className="empty-message">
              {selectedPersona === 'all' 
                ? 'Create your first workstream to start organizing your projects and goals.'
                : 'Create a workstream for this persona to get started.'
              }
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
              disabled={personas.length === 0}
            >
              ➕ Create Your First Workstream
            </button>
          </div>
        ) : (
          <div className="workstreams-grid">
            {filteredWorkstreams.map((workstream) => {
              const statusInfo = getStatusInfo(workstream.status);
              return (
                <div key={workstream.id} className="workstream-card card">
                  <div className="workstream-card-header">
                    <div className="workstream-persona">
                      <div 
                        className="persona-color-dot" 
                        style={{ backgroundColor: workstream.persona_color }}
                      />
                      <span className="persona-name">{workstream.persona_name}</span>
                    </div>
                    <div className="workstream-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: statusInfo.color }}
                      >
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="workstream-info">
                    <h3 className="workstream-name">{workstream.name}</h3>
                    {workstream.description && (
                      <p className="workstream-description">{workstream.description}</p>
                    )}
                  </div>

                  <div className="workstream-card-footer">
                    <div className="workstream-meta">
                      <span className="meta-item">
                        Created: {new Date(workstream.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="workstream-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => startEdit(workstream)}
                        disabled={isLoading}
                        title="Edit workstream"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteWorkstream(workstream.id, workstream.name)}
                        disabled={isLoading}
                        title="Delete workstream"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Workstreams;