import { supabase } from './supabase';

export interface Note {
  id: string;
  user_id: string;
  artist_id?: string;
  show_id?: string;
  title: string;
  content: string;
  category: 'todo' | 'meeting' | 'idea' | 'other';
  color: string;
  grid_x: number;
  grid_y: number;
  grid_width: number;
  grid_height: number;
  minimized: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteData {
  title?: string;
  content: string;
  category?: 'todo' | 'meeting' | 'idea' | 'other';
  color?: string;
  grid_x?: number;
  grid_y?: number;
  grid_width?: number;
  grid_height?: number;
  artist_id?: string;
  show_id?: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  category?: 'todo' | 'meeting' | 'idea' | 'other';
  color?: string;
  grid_x?: number;
  grid_y?: number;
  grid_width?: number;
  grid_height?: number;
  minimized?: boolean;
}

export async function getUserNotes(): Promise<Note[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }

  return data || [];
}

export async function getNote(id: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching note:', error);
    throw error;
  }

  return data;
}

export async function createNote(noteData: CreateNoteData): Promise<Note> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({
      ...noteData,
      user_id: userId,
      title: noteData.title || '',
      category: noteData.category || 'other',
      color: noteData.color || 'bg-beige',
      grid_x: noteData.grid_x || 0,
      grid_y: noteData.grid_y || 0,
      grid_width: noteData.grid_width || 1,
      grid_height: noteData.grid_height || 1,
      minimized: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    throw error;
  }

  return data;
}

export async function updateNote(id: string, updates: UpdateNoteData): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating note:', error);
    throw error;
  }

  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}

export async function updateNotePosition(id: string, gridX: number, gridY: number): Promise<Note> {
  return updateNote(id, { grid_x: gridX, grid_y: gridY });
}

export async function updateNoteSize(id: string, gridWidth: number, gridHeight: number): Promise<Note> {
  return updateNote(id, { grid_width: gridWidth, grid_height: gridHeight });
}

export async function toggleNoteMinimized(id: string, minimized: boolean): Promise<Note> {
  return updateNote(id, { minimized });
}
