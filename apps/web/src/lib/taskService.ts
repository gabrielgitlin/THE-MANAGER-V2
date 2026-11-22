import { supabase } from './supabase';

export interface Task {
  id: string;
  user_id: string;
  artist_id?: string;
  show_id?: string;
  title: string;
  description: string;
  due_date?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'In Progress' | 'Done';
  completed: boolean;
  completed_at?: string;
  assigned_to?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  content: string;
  author_id: string;
  created_at: string;
  author?: {
    email: string;
    full_name?: string;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'Low' | 'Medium' | 'High';
  assigned_to?: string;
  notes?: string;
  artist_id?: string;
  show_id?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: 'Low' | 'Medium' | 'High';
  status?: 'Todo' | 'In Progress' | 'Done';
  completed?: boolean;
  completed_at?: string;
  assigned_to?: string;
  notes?: string;
}

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  return data || [];
}

export async function getTask(id: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching task:', error);
    throw error;
  }

  return data;
}

export async function createTask(taskData: CreateTaskData): Promise<Task> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      user_id: userId,
      created_by: userId,
      priority: taskData.priority || 'Medium',
      status: 'Todo',
      completed: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }

  return data;
}

export async function updateTask(id: string, updates: UpdateTaskData): Promise<Task> {
  const updateData: UpdateTaskData & { updated_at: string } = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (updates.completed === true && !updates.completed_at) {
    updateData.completed_at = new Date().toISOString();
    updateData.status = 'Done';
  } else if (updates.completed === false) {
    updateData.completed_at = undefined;
    if (updates.status === undefined) {
      updateData.status = 'Todo';
    }
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }

  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

export async function toggleTaskComplete(id: string, completed: boolean): Promise<Task> {
  return updateTask(id, {
    completed,
    completed_at: completed ? new Date().toISOString() : undefined,
    status: completed ? 'Done' : 'Todo',
  });
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from('task_comments')
    .select(`
      *,
      author:auth.users(email)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching task comments:', error);
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (fallbackError) throw fallbackError;
    return fallbackData || [];
  }

  return data || [];
}

export async function addTaskComment(taskId: string, content: string): Promise<TaskComment> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      content,
      author_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding task comment:', error);
    throw error;
  }

  return data;
}

export async function deleteTaskComment(id: string): Promise<void> {
  const { error } = await supabase
    .from('task_comments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting task comment:', error);
    throw error;
  }
}
