import { supabase } from './supabase';

export interface Artist {
  id: string;
  name: string;
  genre?: string;
  artworkUrl?: string;
}

export async function getArtist(id: string): Promise<Artist | null> {
  const { data, error } = await supabase
    .from('artists')
    .select('id, name, genre')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id as string,
    name: data.name as string,
    genre: (data.genre as string) ?? undefined,
    artworkUrl: undefined,
  };
}

export async function getArtists(): Promise<Artist[]> {
  const { data, error } = await supabase
    .from('artists')
    .select('id, name, genre')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    genre: (row.genre as string) ?? undefined,
    artworkUrl: undefined,
  }));
}
