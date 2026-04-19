import { supabase } from './supabase';
import type { Tour, TourDay, TourFormData, TourDayFormData } from '../types/tour';

// ── Tours ──

export async function getTours(): Promise<Tour[]> {
  const { data, error } = await supabase
    .from('tours')
    .select(`
      *,
      artists(name),
      tour_days(id, day_type, date)
    `)
    .order('start_date', { ascending: false });

  if (error) throw error;

  return (data || []).map(tour => ({
    ...tour,
    artist_name: tour.artists?.name,
    total_days: tour.tour_days?.length || 0,
    total_shows: tour.tour_days?.filter((d: any) => d.day_type === 'show').length || 0,
  }));
}

export async function getTour(id: string): Promise<Tour | null> {
  const { data, error } = await supabase
    .from('tours')
    .select(`
      *,
      artists(name)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    artist_name: data.artists?.name,
  };
}

export async function createTour(formData: TourFormData): Promise<Tour> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tours')
    .insert({
      ...formData,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTour(id: string, formData: Partial<TourFormData>): Promise<Tour> {
  const { data, error } = await supabase
    .from('tours')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTour(id: string): Promise<void> {
  const { error } = await supabase
    .from('tours')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Tour Days ──

export async function getTourDays(tourId: string): Promise<TourDay[]> {
  const { data, error } = await supabase
    .from('tour_days')
    .select(`
      *,
      shows(id, title, venue_name, venue_city, venue_country, show_time, status, capacity)
    `)
    .eq('tour_id', tourId)
    .order('date', { ascending: true });

  if (error) throw error;

  return (data || []).map(day => ({
    ...day,
    show: day.shows || undefined,
  }));
}

export async function addTourDay(tourId: string, formData: TourDayFormData): Promise<TourDay> {
  const { data, error } = await supabase
    .from('tour_days')
    .insert({ ...formData, tour_id: tourId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTourDay(id: string, formData: Partial<TourDayFormData>): Promise<TourDay> {
  const { data, error } = await supabase
    .from('tour_days')
    .update(formData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTourDay(id: string): Promise<void> {
  const { error } = await supabase
    .from('tour_days')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Helpers ──

export async function addShowToTour(tourId: string, showId: string, date: string): Promise<void> {
  await supabase.from('shows').update({ tour_id: tourId }).eq('id', showId);
  await addTourDay(tourId, {
    date,
    day_type: 'show',
    show_id: showId,
  });
}

export async function removeShowFromTour(showId: string, tourDayId: string): Promise<void> {
  await supabase.from('shows').update({ tour_id: null }).eq('id', showId);
  await deleteTourDay(tourDayId);
}
