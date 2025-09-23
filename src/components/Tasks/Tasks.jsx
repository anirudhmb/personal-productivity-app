import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import DeleteConfirmationModal from '../DeleteConfirmationModal/DeleteConfirmationModal';
import SuccessModal from '../SuccessModal/SuccessModal';
import KanbanBoard from './KanbanBoard/KanbanBoard';
import TaskFilters from './TaskFilters/TaskFilters';
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
  const [personas, setPersonas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successModalType, setSuccessModalType] = useState('success');

  // Filter state
  const [selectedWorkstream, setSelectedWorkstream] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStatuses, setSelectedStatuses] = useState(['backlog', 'todo', 'inprogress', 'review', 'done']);
  const [viewMode, setViewMode] = useState('list');
  const [selectedPersona, setSelectedPersona] = useState('all');

  // Sorting state
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

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
    loadPersonas();
    loadWorkstreams();
    loadTasks();
  }, []);

  const loadPersonas = async () => {
    try {
      const result = await invoke('get_all_personas');
      setPersonas(result);
    } catch (err) {
      console.error('Failed to load personas:', err);
      setError(`Failed to load personas: ${err}`);
    }
  };

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
      console.error('Failed to load tasks:', err);
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

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    
    setIsLoading(true);
    setError('');
    setShowDeleteModal(false);
    
    try {
      const result = await invoke('delete_project_task', { id: taskToDelete.id });
      setSuccessMessage(`Successfully deleted task: ${taskToDelete.title}`);
      setSuccessModalType('success');
      setShowSuccessModal(true);
      loadTasks();
    } catch (err) {
      setError(`Failed to delete task: ${err}`);
      setSuccessMessage(`Failed to delete task: ${err}`);
      setSuccessModalType('error');
      setShowSuccessModal(true);
    } finally {
      setIsLoading(false);
      setTaskToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const handleWorkstreamChange = (workstreamId) => {
    setSelectedWorkstream(workstreamId);
  };

  const handleStatusChange = (statuses) => {
    setSelectedStatuses(statuses);
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handlePersonaChange = (personaId) => {
    setSelectedPersona(personaId);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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
        console.log('Updating task with priority:', formData.priority);
        result = await invoke('update_project_task', {
          id: editingTask.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
          priority: formData.priority
        });
        console.log('Updated task result:', result);
        setTasks(prev => prev.map(t => t.id === editingTask.id ? result : t));
      } else {
        // Create new task
        console.log('Creating task with priority:', formData.priority);
        result = await invoke('create_project_task', {
          workstreamId: formData.workstream_id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
          priority: formData.priority
        });
        console.log('Created task result:', result);
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
    // Clean the status string (same logic as filtering)
    let cleanStatus = status;
    if (cleanStatus.startsWith('"') && cleanStatus.endsWith('"')) {
      cleanStatus = cleanStatus.slice(1, -1);
    }
    cleanStatus = cleanStatus.replace(/\\"/g, '');
    
    const normalizedStatus = cleanStatus.toLowerCase().replace(/\s+/g, '');
    return statusOptions.find(s => s.value === normalizedStatus) || statusOptions[0];
  };

  const getPriorityInfo = (priority) => {
    // Clean the priority string (same logic as status)
    let cleanPriority = priority;
    if (cleanPriority.startsWith('"') && cleanPriority.endsWith('"')) {
      cleanPriority = cleanPriority.slice(1, -1);
    }
    cleanPriority = cleanPriority.replace(/\\"/g, '');
    
    const normalizedPriority = cleanPriority.toLowerCase().replace(/\s+/g, '');
    
    return priorityOptions.find(p => p.value === normalizedPriority) || priorityOptions[1];
  };

  const filteredTasks = tasks.filter(task => {
    const workstreamMatch = selectedWorkstream === 'all' || task.workstream_id === selectedWorkstream;
    
    // More flexible status matching - handle JSON string formatting
    let cleanTaskStatus = task.status;
    // Remove JSON quotes if present
    if (cleanTaskStatus.startsWith('"') && cleanTaskStatus.endsWith('"')) {
      cleanTaskStatus = cleanTaskStatus.slice(1, -1);
    }
    // Remove escaped quotes if present
    cleanTaskStatus = cleanTaskStatus.replace(/\\"/g, '');
    
    const normalizedTaskStatus = cleanTaskStatus.toLowerCase().replace(/\s+/g, '');
    const statusMatch = selectedStatuses.some(status => {
      const normalizedSelectedStatus = status.toLowerCase().replace(/\s+/g, '');
      return normalizedTaskStatus === normalizedSelectedStatus;
    });
    
    // Filter by persona if selected
    let personaMatch = true;
    if (selectedPersona !== 'all') {
      const workstream = workstreams.find(w => w.id === task.workstream_id);
      personaMatch = workstream && workstream.persona_id === selectedPersona;
    }
    
    const matches = workstreamMatch && statusMatch && personaMatch;
    
    return matches;
  });

  // Sort the filtered tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'status':
        aValue = a.status.toLowerCase();
        bValue = b.status.toLowerCase();
        break;
      case 'priority':
        aValue = a.priority.toLowerCase();
        bValue = b.priority.toLowerCase();
        break;
      case 'workstream':
        const aWorkstream = workstreams.find(w => w.id === a.workstream_id);
        const bWorkstream = workstreams.find(w => w.id === b.workstream_id);
        aValue = aWorkstream ? aWorkstream.name.toLowerCase() : '';
        bValue = bWorkstream ? bWorkstream.name.toLowerCase() : '';
        break;
      case 'created_at':
      case 'updated_at':
        aValue = new Date(a[sortField]);
        bValue = new Date(b[sortField]);
        break;
      default:
        aValue = a[sortField] || '';
        bValue = b[sortField] || '';
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="tasks">
      <div className="tasks-header">
        <div className="tasks-title-section">
          <h1 className="tasks-title">Project Tasks</h1>
          <p className="tasks-subtitle">Manage individual tasks within your workstreams.</p>
        </div>
        <div className="tasks-header-actions">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              📋 List
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
              title="Board view"
            >
              📊 Board
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      )}

        <TaskFilters
          workstreams={workstreams}
          selectedWorkstream={selectedWorkstream}
          onWorkstreamChange={handleWorkstreamChange}
          selectedStatuses={selectedStatuses}
          onStatusChange={handleStatusChange}
          personas={personas}
          selectedPersona={selectedPersona}
          onPersonaChange={handlePersonaChange}
        />

        <div className="tasks-actions">
          <button
            className="btn btn-primary"
            onClick={() => { setEditingTask(null); setShowCreateForm(true); }}
            disabled={workstreams.length === 0}
          >
            + Add New Task
          </button>
        </div>

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
        <>
          {viewMode === 'list' ? (
            <div className="task-table-container">
              <table className="task-table">
                <thead>
                  <tr>
                    <th 
                      className={`sortable ${sortField === 'title' ? `sorted-${sortDirection}` : ''}`}
                      onClick={() => handleSort('title')}
                    >
                      Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className={`sortable ${sortField === 'workstream' ? `sorted-${sortDirection}` : ''}`}
                      onClick={() => handleSort('workstream')}
                    >
                      Workstream {sortField === 'workstream' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className={`sortable ${sortField === 'status' ? `sorted-${sortDirection}` : ''}`}
                      onClick={() => handleSort('status')}
                    >
                      Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className={`sortable ${sortField === 'priority' ? `sorted-${sortDirection}` : ''}`}
                      onClick={() => handleSort('priority')}
                    >
                      Priority {sortField === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className={`sortable ${sortField === 'created_at' ? `sorted-${sortDirection}` : ''}`}
                      onClick={() => handleSort('created_at')}
                    >
                      Created {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTasks.map((task) => {
                    const workstream = workstreams.find(w => w.id === task.workstream_id);
                    const statusInfo = getStatusInfo(task.status);
                    const priorityInfo = getPriorityInfo(task.priority);
                    return (
                      <tr key={task.id} className="task-row">
                        <td className="task-title-cell">
                          <div className="task-title-content">
                            <span className="task-title">{task.title}</span>
                            {task.description && (
                              <span className="task-description">{task.description}</span>
                            )}
                          </div>
                        </td>
                        <td className="task-workstream-cell">
                          {workstream && (
                            <span className="workstream-name">{workstream.name}</span>
                          )}
                        </td>
                        <td className="task-status-cell">
                          <span
                            className="status-text"
                            style={{ color: statusInfo.color }}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="task-priority-cell">
                          <span
                            className="priority-text"
                            style={{ color: priorityInfo.color }}
                          >
                            {priorityInfo.label}
                          </span>
                        </td>
                        <td className="task-date-cell">
                          {new Date(task.created_at).toLocaleDateString()}
                        </td>
                        <td className="task-actions-cell">
                          <div className="task-actions">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => startEdit(task)}
                              disabled={isLoading}
                              title="Edit task"
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteClick(task)}
                              disabled={isLoading}
                              title="Delete task"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <KanbanBoard
              workstreams={workstreams}
              selectedWorkstream={selectedWorkstream}
              selectedStatuses={selectedStatuses}
              filteredTasks={filteredTasks}
              onTaskUpdate={handleTaskUpdate}
            />
          )}
        </>
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

             {/* Delete Confirmation Modal */}
             <DeleteConfirmationModal
               isOpen={showDeleteModal}
               onClose={handleDeleteCancel}
               onConfirm={handleDeleteConfirm}
               isLoading={isLoading}
               itemType="task"
               itemName={taskToDelete?.title}
               itemDescription={taskToDelete?.description}
               itemId={taskToDelete?.id}
               confirmButtonText="Delete Task"
             />

             {/* Success/Error Modal */}
             <SuccessModal
               isOpen={showSuccessModal}
               onClose={() => setShowSuccessModal(false)}
               message={successMessage}
               type={successModalType}
             />
           </div>
         );
       };

       export default Tasks;
