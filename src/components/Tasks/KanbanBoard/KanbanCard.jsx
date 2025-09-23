import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './KanbanBoard.css';

const KanbanCard = ({ task, workstreams }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityInfo = (priority) => {
    // Clean the priority string (same logic as Tasks component)
    let cleanPriority = priority;
    if (cleanPriority.startsWith('"') && cleanPriority.endsWith('"')) {
      cleanPriority = cleanPriority.slice(1, -1);
    }
    cleanPriority = cleanPriority.replace(/\\"/g, '');
    
    const normalizedPriority = cleanPriority.toLowerCase().replace(/\s+/g, '');
    
    const priorityOptions = [
      { value: 'low', label: 'Low', color: '#10b981' },
      { value: 'medium', label: 'Medium', color: '#f59e0b' },
      { value: 'high', label: 'High', color: '#f97316' },
      { value: 'critical', label: 'Critical', color: '#ef4444' }
    ];
    return priorityOptions.find(p => p.value === normalizedPriority) || priorityOptions[1];
  };

  const priorityInfo = getPriorityInfo(task.priority);

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusInfo = (status) => {
    // Clean the status string (same logic as Tasks component)
    let cleanStatus = status;
    if (cleanStatus.startsWith('"') && cleanStatus.endsWith('"')) {
      cleanStatus = cleanStatus.slice(1, -1);
    }
    cleanStatus = cleanStatus.replace(/\\"/g, '');
    
    const normalizedStatus = cleanStatus.toLowerCase().replace(/\s+/g, '');
    
    const statusOptions = [
      { value: 'backlog', label: 'Backlog', color: '#6b7280' },
      { value: 'todo', label: 'To Do', color: '#3b82f6' },
      { value: 'inprogress', label: 'In Progress', color: '#f59e0b' },
      { value: 'review', label: 'Review', color: '#8b5cf6' },
      { value: 'done', label: 'Done', color: '#10b981' }
    ];
    return statusOptions.find(s => s.value === normalizedStatus) || statusOptions[0];
  };

  const getStatusLabel = (status) => {
    return getStatusInfo(status).label;
  };

  const getStatusColor = (status) => {
    return getStatusInfo(status).color;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`kanban-card ${isDragging ? 'kanban-card-dragging' : ''}`}
    >
      <div className="kanban-card-header">
        <div className="kanban-card-workstream">
          <span className="workstream-name">{task.workstream_name}</span>
        </div>
      </div>
      
      <div className="kanban-card-content">
        <h4 className="kanban-card-title">{task.title}</h4>
      </div>
      
      <div className="kanban-card-details">
        <div className="kanban-card-detail-row">
          <div className="kanban-card-detail-item">
            <span className="detail-label">Priority:</span>
            <span className="detail-value priority-text" style={{ color: priorityInfo.color }}>
              {priorityInfo.label}
            </span>
          </div>
        </div>
        
        {task.due_date && (
          <div className="kanban-card-detail-row">
            <div className="kanban-card-detail-item">
              <span className="detail-label">Due:</span>
              <span className="detail-value due-date">{formatDate(task.due_date)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
