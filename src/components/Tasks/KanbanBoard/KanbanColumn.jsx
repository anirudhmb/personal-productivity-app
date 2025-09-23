import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import './KanbanBoard.css';

const KanbanColumn = ({ column, tasks, taskCount, workstreams }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'kanban-column-over' : ''}`}
      style={{ borderColor: column.color }}
    >
      <div className="kanban-column-header">
        <div className="kanban-column-title">
          <span className="kanban-column-icon">{column.icon}</span>
          <span className="kanban-column-name">{column.title}</span>
        </div>
        <div className="kanban-column-count">
          {taskCount}
        </div>
      </div>
      
      <div className="kanban-column-content">
        <SortableContext 
          items={tasks.map(task => task.id)} 
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="kanban-column-empty">
              <span className="empty-text">No tasks</span>
            </div>
          ) : (
            tasks.map((task) => (
              <KanbanCard 
                key={task.id} 
                task={task} 
                workstreams={workstreams}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;
