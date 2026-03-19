import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, X, Calendar, Clock, Users, Info, MessageSquare, User, Pencil, ArrowRight, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { hasPermission } from '../../lib/permissions';
import { formatDate } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import * as taskService from '../../lib/taskService';

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
  comments: Comment[];
}

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}

export default function TodoList() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const canEdit = hasPermission(user, 'edit_dashboard');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<Todo['priority']>('medium');
  const [isAdding, setIsAdding] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [newNotes, setNewNotes] = useState('');
  const [newComment, setNewComment] = useState('');
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [newAssignee, setNewAssignee] = useState('');
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set());
  const [editingTodo, setEditingTodo] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<Todo['priority']>('medium');
  const [editAssignee, setEditAssignee] = useState('');
  const [editingField, setEditingField] = useState<{ todoId: string; field: 'title' | 'date' | 'priority' | 'assignee' } | null>(null);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; email: string; name?: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'assignee'>('priority');

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

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;

    try {
      setIsSaving(true);
      const task = await taskService.createTask({
        title: newTodo.trim(),
        due_date: newDueDate || undefined,
        priority: (newPriority.charAt(0).toUpperCase() + newPriority.slice(1)) as 'Low' | 'Medium' | 'High',
        assigned_to: newAssignee || undefined,
      });

      const newTodoItem: Todo = {
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

      setTodos([newTodoItem, ...todos]);
      setNewTodo('');
      setNewDueDate('');
      setNewPriority('medium');
      setNewAssignee('');
      setIsAdding(false);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTodo = async (id: string) => {
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

  const handleDeleteTodo = async (id: string) => {
    try {
      await taskService.deleteTask(id);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo.id);
    setEditTitle(todo.title);
    setEditDueDate(todo.dueDate || '');
    setEditPriority(todo.priority);
    setEditAssignee(todo.assignedTo || '');
  };

  const handleSaveEdit = async (id: string) => {
    try {
      setIsSaving(true);
      const updatedTask = await taskService.updateTask(id, {
        title: editTitle.trim(),
        due_date: editDueDate || undefined,
        priority: (editPriority.charAt(0).toUpperCase() + editPriority.slice(1)) as 'Low' | 'Medium' | 'High',
        assigned_to: editAssignee || undefined,
      });

      setTodos(todos.map(todo => {
        if (todo.id === id) {
          return {
            ...todo,
            title: updatedTask.title,
            dueDate: updatedTask.due_date || undefined,
            priority: (updatedTask.priority?.toLowerCase() || 'medium') as 'low' | 'medium' | 'high',
            assignedTo: updatedTask.assigned_to || undefined,
          };
        }
        return todo;
      }));
      setEditingTodo(null);
      setEditTitle('');
      setEditDueDate('');
      setEditPriority('medium');
      setEditAssignee('');
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTodo(null);
    setEditTitle('');
    setEditDueDate('');
    setEditPriority('medium');
    setEditAssignee('');
  };

  const handleDoubleClick = (todo: Todo, field: 'title' | 'date' | 'priority' | 'assignee') => {
    if (!canEdit || todo.completed || editingTodo === todo.id) return;

    setEditingField({ todoId: todo.id, field });

    switch (field) {
      case 'title':
        setEditTitle(todo.title);
        break;
      case 'date':
        setEditDueDate(todo.dueDate || '');
        break;
      case 'priority':
        setEditPriority(todo.priority);
        break;
      case 'assignee':
        setEditAssignee(todo.assignedTo || '');
        break;
    }
  };

  const handleInlineUpdate = async (todoId: string, field: 'title' | 'date' | 'priority' | 'assignee') => {
    try {
      let updates: taskService.UpdateTaskData = {};

      switch (field) {
        case 'title':
          if (editTitle.trim()) {
            updates.title = editTitle.trim();
          }
          break;
        case 'date':
          updates.due_date = editDueDate || undefined;
          break;
        case 'priority':
          updates.priority = (editPriority.charAt(0).toUpperCase() + editPriority.slice(1)) as 'Low' | 'Medium' | 'High';
          break;
        case 'assignee':
          updates.assigned_to = editAssignee || undefined;
          break;
      }

      const updatedTask = await taskService.updateTask(todoId, updates);

      setTodos(todos.map(todo => {
        if (todo.id === todoId) {
          switch (field) {
            case 'title':
              if (editTitle.trim()) {
                return { ...todo, title: updatedTask.title };
              }
              break;
            case 'date':
              return { ...todo, dueDate: updatedTask.due_date || undefined };
            case 'priority':
              return { ...todo, priority: (updatedTask.priority?.toLowerCase() || 'medium') as 'low' | 'medium' | 'high' };
            case 'assignee':
              return { ...todo, assignedTo: updatedTask.assigned_to || undefined };
          }
        }
        return todo;
      }));
    } catch (error) {
      console.error('Error updating task:', error);
    }

    setEditingField(null);
    setEditTitle('');
    setEditDueDate('');
    setEditPriority('medium');
    setEditAssignee('');
  };

  const handleCancelInlineEdit = () => {
    setEditingField(null);
    setEditTitle('');
    setEditDueDate('');
    setEditPriority('medium');
    setEditAssignee('');
  };

  const handleUpdateNotes = async (id: string) => {
    try {
      await taskService.updateTask(id, { notes: newNotes.trim() || undefined });
      setTodos(todos.map(todo => {
        if (todo.id === id) {
          return {
            ...todo,
            notes: newNotes.trim() || undefined
          };
        }
        return todo;
      }));
      setEditingNotes(null);
      setNewNotes('');
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const handleAddComment = async (id: string) => {
    if (!newComment.trim()) return;

    try {
      const comment = await taskService.addTaskComment(id, newComment.trim());
      setTodos(todos.map(todo => {
        if (todo.id === id) {
          const newCommentObj: Comment = {
            id: comment.id,
            content: comment.content,
            author: user?.full_name || user?.email || 'Unknown',
            createdAt: new Date(comment.created_at)
          };
          return {
            ...todo,
            comments: [...todo.comments, newCommentObj]
          };
        }
        return todo;
      }));
      setCommentingOn(null);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedTodos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

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

  const getAssigneeName = (assigneeId: string) => {
    const member = teamMembers.find(m => m.id === assigneeId);
    return member?.name || member?.email || assigneeId;
  };

  const sortedTodos = [...todos].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    switch (sortBy) {
      case 'priority': {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      case 'date': {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      case 'assignee': {
        const aName = a.assignedTo ? getAssigneeName(a.assignedTo).toLowerCase() : '';
        const bName = b.assignedTo ? getAssigneeName(b.assignedTo).toLowerCase() : '';
        if (!aName && !bName) return 0;
        if (!aName) return 1;
        if (!bName) return -1;
        return aName.localeCompare(bName);
      }
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-gray-500">Loading tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg">
      <div className="p-4 md:p-6 border-b border-gray-200 scroll-row">
        <div className="flex justify-between items-center gap-3 min-w-fit">
          <h2 className="text-lg font-medium text-charcoal uppercase whitespace-nowrap">To-Do List</h2>
          <div className="flex items-center gap-2">
            {todos.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'priority' | 'date' | 'assignee')}
                  className="px-3 py-1.5 text-sm border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                >
                  <option value="priority">Priority</option>
                  <option value="date">Date</option>
                  <option value="assignee">Assignee</option>
                </select>
              </div>
            )}
            {canEdit && todos.length > 0 && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 text-sm text-primary hover:text-black whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            )}
            <button
              onClick={() => navigate('/tasks')}
              className="flex items-center gap-2 text-sm text-primary hover:text-black whitespace-nowrap"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {(isAdding || (canEdit && todos.length === 0)) && (
          <div className="p-4 bg-gray-50">
            <div className="space-y-4">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="What needs to be done?"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                autoFocus
              />
              <div className="scroll-row"><div className="grid grid-cols-3 gap-4 min-w-[500px]">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Todo['priority'])}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Assign To
                  </label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name || member.email}</option>
                    ))}
                  </select>
                </div>
              </div></div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewTodo('');
                    setNewDueDate('');
                    setNewPriority('medium');
                    setNewAssignee('');
                  }}
                  className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTodo}
                  disabled={!newTodo.trim() || isSaving}
                  className="px-3 py-2 text-sm text-white bg-primary rounded-md hover:bg-primary disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Task
                </button>
              </div>
            </div>
          </div>
        )}

        {sortedTodos.map((todo) => (
          <div
            key={todo.id}
            className={`p-4 ${
              todo.completed ? 'bg-green-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <button
                onClick={() => handleToggleTodo(todo.id)}
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
                {editingTodo === todo.id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      autoFocus
                    />
                    <div className="scroll-row"><div className="grid grid-cols-3 gap-4 min-w-[500px]">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Priority
                        </label>
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as Todo['priority'])}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Assign To
                        </label>
                        <select
                          value={editAssignee}
                          onChange={(e) => setEditAssignee(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map(member => (
                            <option key={member.id} value={member.id}>{member.name || member.email}</option>
                          ))}
                        </select>
                      </div>
                    </div></div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(todo.id)}
                        disabled={!editTitle.trim() || isSaving}
                        className="px-3 py-2 text-sm text-white bg-primary rounded-md hover:bg-primary disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingField?.todoId === todo.id && editingField.field === 'title' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleInlineUpdate(todo.id, 'title')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleInlineUpdate(todo.id, 'title');
                              } else if (e.key === 'Escape') {
                                handleCancelInlineEdit();
                              }
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-lg"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <p
                          className={`text-lg ${todo.completed ? 'text-green-600 line-through' : 'text-charcoal cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1'}`}
                          onDoubleClick={() => handleDoubleClick(todo, 'title')}
                          title={canEdit && !todo.completed ? "Double-click to edit" : ""}
                        >
                          {todo.title}
                        </p>
                      )}
                    <div className="mt-1 flex items-center gap-4 flex-wrap">
                      {editingField?.todoId === todo.id && editingField.field === 'date' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            onBlur={() => handleInlineUpdate(todo.id, 'date')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleInlineUpdate(todo.id, 'date');
                              } else if (e.key === 'Escape') {
                                handleCancelInlineEdit();
                              }
                            }}
                            className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                            autoFocus
                          />
                        </div>
                      ) : todo.dueDate ? (
                        <div
                          className={`flex items-center gap-1 text-sm ${todo.completed ? 'text-green-600' : 'text-gray-500 cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1'}`}
                          onDoubleClick={() => handleDoubleClick(todo, 'date')}
                          title={canEdit && !todo.completed ? "Double-click to edit" : ""}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Due {formatDate(todo.dueDate)}</span>
                        </div>
                      ) : canEdit && !todo.completed && (
                        <div
                          className="flex items-center gap-1 text-sm text-gray-400 cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1"
                          onDoubleClick={() => handleDoubleClick(todo, 'date')}
                          title="Double-click to add due date"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Add due date</span>
                        </div>
                      )}
                      {editingField?.todoId === todo.id && editingField.field === 'priority' ? (
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as Todo['priority'])}
                          onBlur={() => handleInlineUpdate(todo.id, 'priority')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleInlineUpdate(todo.id, 'priority');
                            } else if (e.key === 'Escape') {
                              handleCancelInlineEdit();
                            }
                          }}
                          className="rounded-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm font-medium px-2 py-0.5"
                          autoFocus
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-0.5 text-sm font-medium rounded-full ${todo.completed ? 'bg-green-100 text-green-800' : getPriorityColor(todo.priority)} ${canEdit && !todo.completed ? 'cursor-pointer hover:opacity-80' : ''}`}
                          onDoubleClick={() => handleDoubleClick(todo, 'priority')}
                          title={canEdit && !todo.completed ? "Double-click to edit" : ""}
                        >
                          {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                        </span>
                      )}
                      {editingField?.todoId === todo.id && editingField.field === 'assignee' ? (
                        <select
                          value={editAssignee}
                          onChange={(e) => setEditAssignee(e.target.value)}
                          onBlur={() => handleInlineUpdate(todo.id, 'assignee')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleInlineUpdate(todo.id, 'assignee');
                            } else if (e.key === 'Escape') {
                              handleCancelInlineEdit();
                            }
                          }}
                          className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                          autoFocus
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map(member => (
                            <option key={member.id} value={member.id}>{member.name || member.email}</option>
                          ))}
                        </select>
                      ) : todo.assignedTo ? (
                        <div
                          className={`flex items-center gap-1 text-sm ${todo.completed ? 'text-green-600' : 'text-gray-500 cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1'}`}
                          onDoubleClick={() => handleDoubleClick(todo, 'assignee')}
                          title={canEdit && !todo.completed ? "Double-click to edit" : ""}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>{getAssigneeName(todo.assignedTo)}</span>
                        </div>
                      ) : canEdit && !todo.completed && (
                        <div
                          className="flex items-center gap-1 text-sm text-gray-400 cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1"
                          onDoubleClick={() => handleDoubleClick(todo, 'assignee')}
                          title="Double-click to assign"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Assign to...</span>
                        </div>
                      )}
                      {todo.completed && todo.completedAt && (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Completed {formatDate(todo.completedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    {canEdit && (
                      <button
                        onClick={() => handleEditTodo(todo)}
                        className="p-1 hover:opacity-70 transition-opacity"
                      >
                        <img
                          src="/TM-Pluma-negro.png"
                          alt="Edit"
                          className="w-4 h-4"
                        />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                )}

                {(todo.notes || todo.comments.length > 0) && (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleExpanded(todo.id)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
                    >
                      {expandedTodos.has(todo.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      <span className="font-medium">
                        {todo.notes && todo.comments.length > 0
                          ? `Notes & ${todo.comments.length} comment${todo.comments.length === 1 ? '' : 's'}`
                          : todo.notes
                          ? 'Notes'
                          : `${todo.comments.length} comment${todo.comments.length === 1 ? '' : 's'}`
                        }
                      </span>
                    </button>
                  </div>
                )}

                {expandedTodos.has(todo.id) && (
                  <>
                    <div className="mt-3">
                      {editingNotes === todo.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={newNotes}
                            onChange={(e) => setNewNotes(e.target.value)}
                            placeholder="Add notes..."
                            rows={3}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingNotes(null);
                                setNewNotes('');
                              }}
                              className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdateNotes(todo.id)}
                              className="px-2 py-1 text-xs text-white bg-primary rounded hover:bg-primary"
                            >
                              Save Notes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative">
                          {todo.notes ? (
                            <div className={`text-base p-2 rounded-md ${todo.completed ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <Info className={`w-3.5 h-3.5 ${todo.completed ? 'text-green-500' : 'text-gray-400'}`} />
                                <span className={`text-sm font-medium ${todo.completed ? 'text-green-700' : 'text-gray-700'}`}>Notes</span>
                              </div>
                              {todo.notes}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingNotes(todo.id);
                                setNewNotes(todo.notes || '');
                              }}
                              className="text-xs text-gray-500 hover:text-primary flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Add Notes
                            </button>
                          )}
                          {todo.notes && (
                            <button
                              onClick={() => {
                                setEditingNotes(todo.id);
                                setNewNotes(todo.notes || '');
                              }}
                              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="space-y-2">
                        {todo.comments.map((comment) => (
                          <div key={comment.id} className={`text-base p-2 rounded-md ${todo.completed ? 'bg-green-50' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`font-medium ${todo.completed ? 'text-green-700' : 'text-charcoal'}`}>{comment.author}</span>
                              <span className={`text-sm ${todo.completed ? 'text-green-600' : 'text-gray-500'}`}>
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className={todo.completed ? 'text-green-600' : 'text-gray-600'}>{comment.content}</p>
                          </div>
                        ))}
                        {commentingOn === todo.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..."
                              rows={2}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setCommentingOn(null);
                                  setNewComment('');
                                }}
                                className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAddComment(todo.id)}
                                className="px-2 py-1 text-xs text-white bg-primary rounded hover:bg-primary"
                              >
                                Add Comment
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCommentingOn(todo.id)}
                            className="text-xs text-gray-500 hover:text-primary flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            {todo.comments.length > 0
                              ? `${todo.comments.length} comment${todo.comments.length === 1 ? '' : 's'}`
                              : 'Add comment'
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
