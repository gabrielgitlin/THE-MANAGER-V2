import { supabase } from './supabase';
import type { EnhancedVenue, VenueFormData } from '../types/venue';

export async function getVenues(): Promise<EnhancedVenue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []).map(v => ({
    ...v,
    contacts: v.contacts || [],
    tags: v.tags || [],
  }));
}

export async function getVenue(id: string): Promise<EnhancedVenue | null> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data ? { ...data, contacts: data.contacts || [], tags: data.tags || [] } : null;
}

export async function createVenue(formData: VenueFormData): Promise<EnhancedVenue> {
  const { data, error } = await supabase
    .from('venues')
    .insert(formData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVenue(id: string, formData: Partial<VenueFormData>): Promise<EnhancedVenue> {
  const { data, error } = await supabase
    .from('venues')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVenue(id: string): Promise<void> {
  const { error } = await supabase.from('venues').delete().eq('id', id);
  if (error) throw error;
}

export async function searchVenues(query: string): Promise<EnhancedVenue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .or(`name.ilike.%${query}%,city.ilike.%${query}%,country.ilike.%${query}%`)
    .order('usage_count', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data || []).map(v => ({
    ...v,
    contacts: v.contacts || [],
    tags: v.tags || [],
  }));
}
