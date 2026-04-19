import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { formatDateTime } from '../../../lib/utils';
import type { Show, MarketingTask } from '../../../types';

interface MarketingChecklistProps {
  show: Show;
  onUpdate: (tasks: MarketingTask[]) => void;
}

const DEFAULT_TASKS: Omit<MarketingTask, 'completed' | 'completedAt' | 'completedBy'>[] = [
  { id: 'announcement_email', label: 'Announcement Email Sent' },
  { id: 'marketing_email', label: 'Marketing Email Sent' },
  { id: 'marketing_plan', label: 'Marketing Plan Received' },
  { id: 'facebook_event', label: 'Event added on Facebook' },
  { id: 'songkick_event', label: 'Event added on Song Kick' },
  { id: 'bandsintown_event', label: 'Event added on BandsInTown' },
];

export default function MarketingChecklist({ show, onUpdate }: MarketingChecklistProps) {
  const [tasks, setTasks] = useState<MarketingTask[]>(() => 
    DEFAULT_TASKS.map(task => ({
      ...task,
      completed: false,
    }))
  );

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          completed: !task.completed,
          completedAt: !task.completed ? new Date() : undefined,
          completedBy: !task.completed ? 'Peter Grant' : undefined,
        };
      }
      return task;
    });
    setTasks(updatedTasks);
    onUpdate(updatedTasks);
  };

  const handleAddTask = () => {
    if (!newTaskLabel.trim()) return;

    const newTask: MarketingTask = {
      id: `custom_${Date.now()}`,
      label: newTaskLabel.trim(),
      completed: false,
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    onUpdate(updatedTasks);
    setNewTaskLabel('');
    setIsAddingTask(false);
  };

  const handleEditTask = (taskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          label: newTaskLabel.trim(),
        };
      }
      return task;
    });
    setTasks(updatedTasks);
    onUpdate(updatedTasks);
    setNewTaskLabel('');
    setEditingTaskId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    onUpdate(updatedTasks);
    setShowDeleteConfirm(null);
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2" style={{ color: 'var(--t3)' }}>
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--surface-2)' }}>
          <div
            className="rounded-full h-2 transition-all duration-300"
            style={{ backgroundColor: 'var(--brand-1)', width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-3 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--surface-2)' }}
          >
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => handleToggleTask(task.id)}
                className={`w-5 h-5 rounded flex items-center justify-center border`}
                style={{
                  backgroundColor: task.completed ? 'var(--brand-1)' : 'transparent',
                  borderColor: task.completed ? 'var(--brand-1)' : 'var(--border)',
                  color: 'var(--t1)'
                }}
              >
                {task.completed && <img src="/The Manager_Iconografia-11.svg" className="pxi-sm icon-white" alt="" />}
              </button>
              {editingTaskId === task.id ? (
                <input
                  type="text"
                  value={newTaskLabel}
                  onChange={(e) => setNewTaskLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditTask(task.id);
                    if (e.key === 'Escape') {
                      setEditingTaskId(null);
                      setNewTaskLabel('');
                    }
                  }}
                  className="flex-1 rounded text-sm focus:ring-primary"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                  autoFocus
                />
              ) : (
                <span className={`text-sm flex-1`} style={{ color: task.completed ? 'var(--t3)' : 'var(--t1)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                  {task.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {task.completed && task.completedAt && (
                <div className="flex items-center gap-4 mr-4">
                  <span className="text-xs" style={{ color: 'var(--t3)' }}>
                    {formatDateTime(task.completedAt)}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--t3)' }}>{task.completedBy}</span>
                </div>
              )}
              {editingTaskId === task.id ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditTask(task.id)}
                    className="p-1 hover:opacity-80"
                    style={{ color: 'var(--brand-1)' }}
                  >
                    <img src="/The Manager_Iconografia-11.svg" className="pxi-md icon-green" alt="" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingTaskId(null);
                      setNewTaskLabel('');
                    }}
                    className="p-1 hover:opacity-80"
                    style={{ color: 'var(--t3)' }}
                  >
                    <img src="/TM-Close-negro.svg" className="pxi-md icon-muted" alt="" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingTaskId(task.id);
                      setNewTaskLabel(task.label);
                    }}
                    className="p-1 hover:opacity-80"
                    style={{ color: 'var(--t3)' }}
                  >
                    <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="" />
                  </button>
                  {showDeleteConfirm === task.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="px-2 py-1 text-xs rounded hover:opacity-80"
                        style={{ backgroundColor: 'var(--status-red)', color: 'var(--t1)' }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-2 py-1 text-xs rounded hover:opacity-80"
                        style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(task.id)}
                      className="p-1 hover:opacity-80"
                      style={{ color: 'var(--t3)' }}
                    >
                      <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isAddingTask ? (
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-2)' }}>
            <input
              type="text"
              value={newTaskLabel}
              onChange={(e) => setNewTaskLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
                if (e.key === 'Escape') {
                  setIsAddingTask(false);
                  setNewTaskLabel('');
                }
              }}
              placeholder="Enter task name..."
              className="flex-1 rounded text-sm focus:ring-primary"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddTask}
                className="px-3 py-1 text-sm rounded hover:opacity-80"
                style={{ backgroundColor: 'var(--brand-1)', color: 'var(--t1)' }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskLabel('');
                }}
                className="px-3 py-1 text-sm rounded hover:opacity-80"
                style={{ backgroundColor: 'var(--surface-3)', color: 'var(--t1)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="flex items-center gap-2 text-sm hover:opacity-80"
            style={{ color: 'var(--brand-1)' }}
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        )}
      </div>
    </div>
  );
}