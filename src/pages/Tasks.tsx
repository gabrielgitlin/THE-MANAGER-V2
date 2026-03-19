import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Filter, Calendar, Tag, ChevronDown, ChevronUp, Plus, X, Check, Loader2, User } from 'lucide-react';
import { formatDate } from '../lib/utils';
import * as taskService from '../lib/taskService';
import { supabase } from '../lib/supabase';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  completedAt?: Date;
  notes?: string;
  assignedTo?: string;
  comments: { id: string; content: string; author: string; createdAt: Date }[];
}

export default function Tasks() {
  const navigate = useNavigate();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; email: string; name?: string }>>([]);

  useEffect(() => {
    fetchTasks();
    fetchTeamMembers();
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const tasks = await taskService.getTasks();
      const mappedTodos: Todo[] = tasks.map(task => ({
        id: task.id,
        title: task.title,
        completed: task.completed,
        dueDate: task.due_date || undefined,
        priority: (task.priority?.toLowerCase() || 'medium') as 'low' | 'medium' | 'high',
        createdAt: new Date(task.created_at),
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        notes: task.notes || undefined,
        assignedTo: task.assigned_to || undefined,
        comments: [],
      }));
      setTodos(mappedTodos);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_team_members');
      if (error) {
        console.error('Error fetching team members:', error);
        return;
      }
      if (data) {
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      setIsSaving(true);
      const task = await taskService.createTask({
        title: newTaskTitle.trim(),
        due_date: newTaskDueDate || undefined,
        priority: (newTaskPriority.charAt(0).toUpperCase() + newTaskPriority.slice(1)) as 'Low' | 'Medium' | 'High',
        assigned_to: newTaskAssignee || undefined,
      });

      const newTodo: Todo = {
        id: task.id,
        title: task.title,
        completed: task.completed,
        dueDate: task.due_date || undefined,
        priority: (task.priority?.toLowerCase() || 'medium') as 'low' | 'medium' | 'high',
        createdAt: new Date(task.created_at),
        notes: task.notes || undefined,
        assignedTo: task.assigned_to || undefined,
        comments: [],
      };

      setTodos([newTodo, ...todos]);
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setNewTaskPriority('medium');
      setNewTaskAssignee('');
      setIsAddingTask(false);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTask = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const updatedTask = await taskService.toggleTaskComplete(id, !todo.completed);
      setTodos(todos.map(t => {
        if (t.id === id) {
          return {
            ...t,
            completed: updatedTask.completed,
            completedAt: updatedTask.completed_at ? new Date(updatedTask.completed_at) : undefined,
          };
        }
        return t;
      }));
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await taskService.deleteTask(id);
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const assignees = Array.from(new Set(todos.map(todo => todo.assignedTo).filter(Boolean)));

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = selectedPriority === 'all' || todo.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' ||
      (selectedStatus === 'completed' ? todo.completed : !todo.completed);
    const matchesAssignee = selectedAssignee === 'all' || todo.assignedTo === selectedAssignee;

    return matchesSearch && matchesPriority && matchesStatus && matchesAssignee;
  }).sort((a, b) => {
    if (sortBy === 'dueDate') {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return sortOrder === 'asc'
        ? priorityOrder[a.priority] - priorityOrder[b.priority]
        : priorityOrder[b.priority] - priorityOrder[a.priority];
    } else {
      return sortOrder === 'asc'
        ? a.createdAt.getTime() - b.createdAt.getTime()
        : b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  const getPriorityColor = (priority: Todo['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-beige text-black';
      case 'low':
        return 'bg-green-100 text-green-800';
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900 font-title">Tasks</h1>
        </div>
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-gray-500">Loading tasks...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900 font-title">Tasks</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and track all tasks
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="block rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="block rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="all">All Assignees</option>
                {assignees.map((assignee) => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
              <button
                onClick={() => setIsAddingTask(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </div>
        </div>

        {isAddingTask && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="space-y-4">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                autoFocus
              />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assign To</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.name || member.email}>{member.name || member.email}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsAddingTask(false);
                    setNewTaskTitle('');
                    setNewTaskDueDate('');
                    setNewTaskPriority('medium');
                    setNewTaskAssignee('');
                  }}
                  className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim() || isSaving}
                  className="px-3 py-2 text-sm text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Task
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Sort by:</span>
            <button
              onClick={() => {
                if (sortBy === 'dueDate') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('dueDate');
                  setSortOrder('asc');
                }
              }}
              className={`flex items-center gap-1 ${sortBy === 'dueDate' ? 'text-primary' : ''}`}
            >
              <Calendar className="w-4 h-4" />
              Due Date
              {sortBy === 'dueDate' && (
                sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'priority') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('priority');
                  setSortOrder('asc');
                }
              }}
              className={`flex items-center gap-1 ${sortBy === 'priority' ? 'text-primary' : ''}`}
            >
              <Tag className="w-4 h-4" />
              Priority
              {sortBy === 'priority' && (
                sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'createdAt') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('createdAt');
                  setSortOrder('desc');
                }
              }}
              className={`flex items-center gap-1 ${sortBy === 'createdAt' ? 'text-primary' : ''}`}
            >
              <Filter className="w-4 h-4" />
              Created
              {sortBy === 'createdAt' && (
                sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredTodos.map((todo) => (
            <div key={todo.id} className={`p-6 ${todo.completed ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
              <div className="flex items-start gap-4">
                <button
                  onClick={() => handleToggleTask(todo.id)}
                  className={`mt-1 flex items-center justify-center transition-colors ${
                    todo.completed
                      ? ''
                      : 'w-5 h-5 rounded border border-gray-300 hover:border-primary'
                  }`}
                >
                  {todo.completed ? (
                    <img
                      src="/The Manager_Iconografia-11.svg"
                      alt="Completed"
                      className="w-10 h-10"
                      style={{ filter: 'brightness(0) saturate(100%) invert(38%) sepia(93%) saturate(1352%) hue-rotate(130deg) brightness(92%) contrast(102%)' }}
                    />
                  ) : null}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-sm ${todo.completed ? 'text-green-600 line-through' : 'text-gray-900'}`}>
                        {todo.title}
                      </p>
                      <div className="mt-1 flex items-center gap-4 flex-wrap">
                        {todo.dueDate && (
                          <div className={`flex items-center gap-1 text-xs ${todo.completed ? 'text-green-600' : 'text-gray-500'}`}>
                            <Calendar className="w-3 h-3" />
                            <span>Due {formatDate(todo.dueDate)}</span>
                          </div>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${todo.completed ? 'bg-green-100 text-green-800' : getPriorityColor(todo.priority)}`}>
                          {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                        </span>
                        {todo.assignedTo && (
                          <div className={`flex items-center gap-1 text-xs ${todo.completed ? 'text-green-600' : 'text-gray-500'}`}>
                            <User className="w-3 h-3" />
                            <span>{todo.assignedTo}</span>
                          </div>
                        )}
                        {todo.completed && todo.completedAt && (
                          <span className="text-xs text-green-600">
                            Completed {formatDate(todo.completedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(todo.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {todo.notes && (
                    <div className="mt-2">
                      <p className={`text-sm ${todo.completed ? 'text-green-600' : 'text-gray-600'}`}>{todo.notes}</p>
                    </div>
                  )}

                  {todo.comments && todo.comments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {todo.comments.map((comment) => (
                        <div key={comment.id} className={`text-sm p-2 rounded-md ${todo.completed ? 'bg-green-100' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-medium ${todo.completed ? 'text-green-700' : 'text-gray-900'}`}>{comment.author}</span>
                            <span className={`text-xs ${todo.completed ? 'text-green-600' : 'text-gray-500'}`}>
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className={todo.completed ? 'text-green-600' : 'text-gray-600'}>{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredTodos.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No tasks found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
