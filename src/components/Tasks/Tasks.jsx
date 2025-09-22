import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './Tasks.css';

const statusOptions = [
  { value: 'backlog', label: 'Backlog', icon: '📋', color: '#6b7280' },
  { value: 'todo', label: 'To Do', icon: '📝', color: '#3b82f6' },
  { value: 'inprogress', label: 'In Progress', icon: '🚀', color: '#f59e0b' },
  { value: 'review', label: 'Review', icon: '👀', color: '#8b5cf6' },
  { value: 'done', label: 'Done', icon: '✅', color: '#10b981' }
];

const priorityOptions = [
  { value: 'low', label: 'Low', icon: '🟢', color: '#10b981' },
  { value: 'medium', label: 'Medium', icon: '🟡', color: '#f59e0b' },
  { value: 'high', label: 'High', icon: '🟠', color: '#f97316' },
  { value: 'critical', label: 'Critical', icon: '🔴', color: '#ef4444' }
];

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [workstreams, setWorkstreams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Filter state
  const [selectedWorkstream, setSelectedWorkstream] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    workstream_id: '',
    title: '',
    description: '',
    status: 'todo', // Default status
    priority: 'medium' // Default priority
  });

  // Load data on component mount
  useEffect(() => {
    loadWorkstreams();
    loadTasks();
  }, []);

  const loadWorkstreams = async () => {
    try {
      const result = await invoke('get_all_workstreams');
      setWorkstreams(result);
      if (result.length > 0 && formData.workstream_id === '') {
        setFormData(prev => ({ ...prev, workstream_id: result[0].id }));
      }
    } catch (err) {
      console.error('Failed to load workstreams:', err);
      setError(`Failed to load workstreams: ${err}`);
    }
  };

  const loadTasks = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await invoke('get_all_project_tasks');
      setTasks(result);
    } catch (err) {
      setError(`Failed to load tasks: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      workstream_id: workstreams.length > 0 ? workstreams[0].id : '',
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium'
    });
    setEditingTask(null);
    setError('');
    setShowCreateForm(false);
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    resetForm();
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setFormData({
      workstream_id: task.workstream_id,
      title: task.title,
      description: task.description || '',
      status: task.status.toLowerCase(),
      priority: task.priority.toLowerCase()
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await invoke('delete_project_task', { id });
      alert(result);
      loadTasks();
    } catch (err) {
      setError(`Failed to delete task: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.workstream_id) {
      setError('Task title and workstream are required.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let result;
      if (editingTask) {
        // Update existing task
        result = await invoke('update_project_task', {
          id: editingTask.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
          priority: formData.priority
        });
        setTasks(prev => prev.map(t => t.id === editingTask.id ? result : t));
      } else {
        // Create new task
        result = await invoke('create_project_task', {
          workstreamId: formData.workstream_id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
          priority: formData.priority
        });
        setTasks(prev => [result, ...prev]);
      }
      resetForm();
    } catch (err) {
      setError(`Failed to ${editingTask ? 'update' : 'create'} task: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const normalizedStatus = status.toLowerCase();
    return statusOptions.find(s => s.value === normalizedStatus) || statusOptions[0];
  };

  const getPriorityInfo = (priority) => {
    const normalizedPriority = priority.toLowerCase();
    return priorityOptions.find(p => p.value === normalizedPriority) || priorityOptions[1];
  };

  const filteredTasks = tasks.filter(task => {
    const workstreamMatch = selectedWorkstream === 'all' || task.workstream_id === selectedWorkstream;
    const statusMatch = selectedStatus === 'all' || task.status.toLowerCase() === selectedStatus;
    return workstreamMatch && statusMatch;
  });

  return (
    <div className="tasks">
      <div className="tasks-header">
        <div className="tasks-title-section">
          <h1 className="tasks-title">Project Tasks</h1>
          <p className="tasks-subtitle">Manage individual tasks within your workstreams.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditingTask(null); setShowCreateForm(true); }}
          disabled={workstreams.length === 0}
        >
          + Add New Task
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="tasks-filters">
          <div className="filter-group">
            <label htmlFor="workstream-filter" className="filter-label">Filter by Workstream:</label>
            <select
              id="workstream-filter"
              className="filter-select"
              value={selectedWorkstream}
              onChange={(e) => setSelectedWorkstream(e.target.value)}
            >
              <option value="all">All Workstreams</option>
              {workstreams.map((workstream) => (
                <option key={workstream.id} value={workstream.id}>
                  {workstream.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="status-filter" className="filter-label">Filter by Status:</label>
            <select
              id="status-filter"
              className="filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.icon} {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {filteredTasks.length === 0 && !isLoading ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3 className="empty-title">
            {selectedWorkstream === 'all' && selectedStatus === 'all' 
              ? 'No Tasks Yet' 
              : 'No Tasks Match Filters'}
          </h3>
          <p className="empty-message">
            {selectedWorkstream === 'all' && selectedStatus === 'all'
              ? 'Create your first task to start organizing your work.'
              : 'Try adjusting your filters or create a new task.'
            }
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
            disabled={workstreams.length === 0}
          >
            ➕ Create Your First Task
          </button>
        </div>
      ) : (
        <div className="task-grid">
          {filteredTasks.map((task) => {
            const workstream = workstreams.find(w => w.id === task.workstream_id);
            const statusInfo = getStatusInfo(task.status);
            const priorityInfo = getPriorityInfo(task.priority);
            return (
              <div key={task.id} className="task-card card">
                <div className="task-card-header">
                  <div className="task-workstream">
                    {workstream && (
                      <>
                        <div 
                          className="workstream-color-dot" 
                          style={{ backgroundColor: workstream.persona_color }}
                        />
                        <span className="workstream-name">{workstream.name}</span>
                      </>
                    )}
                  </div>
                  <div className="task-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: statusInfo.color }}
                    >
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>
                </div>

                <div className="task-info">
                  <h3 className="task-title">{task.title}</h3>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  <div className="task-priority">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: priorityInfo.color }}
                    >
                      {priorityInfo.icon} {priorityInfo.label}
                    </span>
                  </div>
                </div>

                <div className="task-card-footer">
                  <div className="task-meta">
                    <span className="meta-item">
                      Created: {new Date(task.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="task-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => startEdit(task)}
                      disabled={isLoading}
                      title="Edit task"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(task.id)}
                      disabled={isLoading}
                      title="Delete task"
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

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content task-form">
            <div className="form-header">
              <h2 className="form-title">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
              <button onClick={cancelForm} className="btn btn-icon">✖️</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="workstream_id" className="form-label">Workstream</label>
                <select
                  id="workstream_id"
                  name="workstream_id"
                  className="form-select"
                  value={formData.workstream_id}
                  onChange={handleFormChange}
                  required
                  disabled={editingTask !== null} // Cannot change workstream for existing task
                >
                  <option value="">Select a Workstream</option>
                  {workstreams.map((workstream) => (
                    <option key={workstream.id} value={workstream.id}>
                      {workstream.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="title" className="form-label">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="form-input"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="e.g., Design user interface, Write documentation"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="A brief description of this task"
                ></textarea>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    id="status"
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={handleFormChange}
                    required
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.icon} {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="priority" className="form-label">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    className="form-select"
                    value={formData.priority}
                    onChange={handleFormChange}
                    required
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.icon} {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={cancelForm} className="btn btn-secondary" disabled={isLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : (editingTask ? 'Update Task' : 'Create Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
