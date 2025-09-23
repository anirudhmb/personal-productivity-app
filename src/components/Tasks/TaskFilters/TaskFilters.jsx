import React, { useState } from 'react';
import './TaskFilters.css';

const TaskFilters = ({
  workstreams,
  selectedWorkstream,
  onWorkstreamChange,
  selectedStatuses,
  onStatusChange,
  viewMode,
  onViewModeChange,
  personas,
  selectedPersona,
  onPersonaChange
}) => {
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showWorkstreamSettings, setShowWorkstreamSettings] = useState(false);
  const [showPersonaSettings, setShowPersonaSettings] = useState(false);
  const statusOptions = [
    { id: 'backlog', label: 'Backlog', icon: '📚' },
    { id: 'todo', label: 'To Do', icon: '📝' },
    { id: 'inprogress', label: 'In Progress', icon: '🚀' },
    { id: 'review', label: 'Review', icon: '🔍' },
    { id: 'done', label: 'Done', icon: '✅' }
  ];

  const handleStatusToggle = (statusId) => {
    const newStatuses = selectedStatuses.includes(statusId)
      ? selectedStatuses.filter(s => s !== statusId)
      : [...selectedStatuses, statusId];
    onStatusChange(newStatuses);
  };

  const handleSelectAllStatuses = () => {
    if (selectedStatuses.length === statusOptions.length) {
      onStatusChange([]);
    } else {
      onStatusChange(statusOptions.map(s => s.id));
    }
  };

  const handleColumnToggle = (statusId) => {
    handleStatusToggle(statusId);
  };

  const handleSelectionToggle = (type) => {
    // Close all other panels first
    setShowPersonaSettings(false);
    setShowWorkstreamSettings(false);
    setShowColumnSettings(false);
    
    // Then open the selected panel if it wasn't already open
    if (type === 'persona' && !showPersonaSettings) {
      setShowPersonaSettings(true);
    } else if (type === 'workstream' && !showWorkstreamSettings) {
      setShowWorkstreamSettings(true);
    } else if (type === 'column' && !showColumnSettings) {
      setShowColumnSettings(true);
    }
  };

  return (
    <div className="task-filters">
      <div className="filters-header">
        <div className="filters-left">
          <div className="selection-buttons">
            <button
              className={`selection-btn ${showPersonaSettings ? 'active' : ''}`}
              onClick={() => handleSelectionToggle('persona')}
              title="Persona selection"
            >
              👤 Persona Selection
            </button>
            <button
              className={`selection-btn ${showWorkstreamSettings ? 'active' : ''}`}
              onClick={() => handleSelectionToggle('workstream')}
              title="Workstream selection"
            >
              🎯 Workstream Selection
            </button>
            {viewMode === 'board' && (
              <button
                className={`selection-btn ${showColumnSettings ? 'active' : ''}`}
                onClick={() => handleSelectionToggle('column')}
                title="Column selection"
              >
                ⚙️ Column Selection
              </button>
            )}
          </div>
        </div>

        <div className="filters-right">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => onViewModeChange('list')}
              title="List view"
            >
              📋 List
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => onViewModeChange('board')}
              title="Board view"
            >
              📊 Board
            </button>
          </div>
        </div>
      </div>

      <div className="selection-sections">
        {(showPersonaSettings || showWorkstreamSettings || showColumnSettings) && (
          <div className="selection-panels">
            {showPersonaSettings && (
              <div className="selection-panel">
                <div className="selection-header">
                  <h4 className="selection-title">Persona Selection</h4>
                  <button
                    className="close-settings-btn"
                    onClick={() => setShowPersonaSettings(false)}
                    title="Close persona selection"
                  >
                    ✖️
                  </button>
                </div>
                <div className="selection-options">
                  <button
                    className={`selection-option-btn ${selectedPersona === 'all' ? 'active' : ''}`}
                    onClick={() => onPersonaChange('all')}
                    title="Show all personas"
                  >
                    👥 All Personas
                  </button>
                  {personas.map((persona) => (
                    <button
                      key={persona.id}
                      className={`selection-option-btn ${selectedPersona === persona.id ? 'active' : ''}`}
                      onClick={() => onPersonaChange(persona.id)}
                      title={`Show ${persona.name} persona`}
                    >
                      <div
                        className="persona-color-dot"
                        style={{ backgroundColor: persona.color }}
                      />
                      {persona.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showWorkstreamSettings && (
              <div className="selection-panel">
                <div className="selection-header">
                  <h4 className="selection-title">Workstream Selection</h4>
                  <button
                    className="close-settings-btn"
                    onClick={() => setShowWorkstreamSettings(false)}
                    title="Close workstream selection"
                  >
                    ✖️
                  </button>
                </div>
                <div className="selection-options">
                  <button
                    className={`selection-option-btn ${selectedWorkstream === 'all' ? 'active' : ''}`}
                    onClick={() => onWorkstreamChange('all')}
                    title="Show all workstreams"
                  >
                    🎯 All Workstreams
                  </button>
                  {workstreams.map((workstream) => (
                    <button
                      key={workstream.id}
                      className={`selection-option-btn ${selectedWorkstream === workstream.id ? 'active' : ''}`}
                      onClick={() => onWorkstreamChange(workstream.id)}
                      title={`Show ${workstream.name} workstream`}
                    >
                      <div
                        className="workstream-color-dot"
                        style={{ backgroundColor: workstream.persona_color }}
                      />
                      {workstream.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showColumnSettings && viewMode === 'board' && (
              <div className="selection-panel">
                <div className="selection-header">
                  <h4 className="selection-title">Column Selection</h4>
                  <button
                    className="close-settings-btn"
                    onClick={() => setShowColumnSettings(false)}
                    title="Close column selection"
                  >
                    ✖️
                  </button>
                </div>
                <div className="column-toggles">
                  <button
                    className={`column-toggle-btn ${selectedStatuses.length === statusOptions.length ? 'active' : ''}`}
                    onClick={handleSelectAllStatuses}
                    title={selectedStatuses.length === statusOptions.length ? 'Hide all columns' : 'Show all columns'}
                  >
                    {selectedStatuses.length === statusOptions.length ? '👁️' : '👁️‍🗨️'} All Columns
                  </button>
                  {statusOptions.map((status) => (
                    <button
                      key={status.id}
                      className={`column-toggle-btn ${selectedStatuses.includes(status.id) ? 'active' : 'inactive'}`}
                      onClick={() => handleColumnToggle(status.id)}
                      title={selectedStatuses.includes(status.id) ? `Hide ${status.label} column` : `Show ${status.label} column`}
                    >
                      <span className="column-icon">{status.icon}</span>
                      <span className="column-label">{status.label}</span>
                      <span className="column-indicator">
                        {selectedStatuses.includes(status.id) ? '👁️' : '🚫'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default TaskFilters;
