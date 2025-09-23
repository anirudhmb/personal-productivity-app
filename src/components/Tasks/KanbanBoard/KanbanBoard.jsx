import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import './KanbanBoard.css';

const KanbanBoard = ({ 
  workstreams, 
  selectedWorkstream, 
  selectedStatuses, 
  onTaskUpdate 
}) => {
  const [tasks, setTasks] = useState([]);
  const [taskCounts, setTaskCounts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const statusColumns = [
    { id: 'backlog', title: 'Backlog', icon: '📚', color: '#6b7280' },
    { id: 'todo', title: 'To Do', icon: '📝', color: '#3b82f6' },
    { id: 'inprogress', title: 'In Progress', icon: '🚀', color: '#f59e0b' },
    { id: 'review', title: 'Review', icon: '🔍', color: '#f97316' },
    { id: 'done', title: 'Done', icon: '✅', color: '#059669' }
  ];

  useEffect(() => {
    loadKanbanData();
  }, [selectedWorkstream, selectedStatuses]);

  const loadKanbanData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const [tasksResult, countsResult] = await Promise.all([
        invoke('get_tasks_for_kanban', {
          workstreamFilter: selectedWorkstream,
          statusFilter: 'all'
        }),
        invoke('get_task_counts_by_status', {
          workstreamFilter: selectedWorkstream
        })
      ]);
      
      setTasks(tasksResult);
      setTaskCounts(countsResult);
    } catch (err) {
      setError(`Failed to load Kanban data: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeTask = tasks.find(t => t.id === active.id);
    const newStatus = over.id;

    if (activeTask.status === newStatus) {
      return;
    }

    // Optimistic update
    setTasks(prev => prev.map(task => 
      task.id === active.id ? { ...task, status: newStatus } : task
    ));

    try {
      const updatedTask = await invoke('update_task_status', {
        taskId: active.id,
        newStatus: newStatus
      });
      
      // Update with server response
      setTasks(prev => prev.map(task => 
        task.id === active.id ? updatedTask : task
      ));
      
      // Reload counts
      const countsResult = await invoke('get_task_counts_by_status', {
        workstreamFilter: selectedWorkstream
      });
      setTaskCounts(countsResult);
      
      // Notify parent component
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }
    } catch (err) {
      // Revert optimistic update on error
      setTasks(prev => prev.map(task => 
        task.id === active.id ? { ...task, status: activeTask.status } : task
      ));
      setError(`Failed to update task status: ${err}`);
    }
  };

  const getTasksForStatus = (status) => {
    return tasks.filter(task => 
      task.status.toLowerCase() === status && 
      selectedStatuses.includes(status)
    );
  };

  const visibleColumns = statusColumns.filter(column => 
    selectedStatuses.includes(column.id)
  );

  if (isLoading) {
    return (
      <div className="kanban-loading">
        <div className="spinner"></div>
        <span>Loading Kanban board...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kanban-error">
        <span className="error-icon">⚠️</span>
        {error}
      </div>
    );
  }

  return (
    <div className="kanban-board">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-columns">
          {visibleColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={getTasksForStatus(column.id)}
              taskCount={taskCounts[column.id] || 0}
              workstreams={workstreams}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeTask ? (
            <div className="kanban-card-dragging">
              <div className="kanban-card-header">
                <div className="kanban-card-workstream">
                  <div
                    className="workstream-color-dot"
                    style={{ backgroundColor: activeTask.persona_color }}
                  />
                  <span className="workstream-name">{activeTask.workstream_name}</span>
                </div>
              </div>
              <div className="kanban-card-content">
                <h4 className="kanban-card-title">{activeTask.title}</h4>
                {activeTask.description && (
                  <p className="kanban-card-description">{activeTask.description}</p>
                )}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
