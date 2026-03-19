import { supabase } from './supabase';

export interface ShowDeal {
  id: string;
  show_id: string;
  deal_type: 'guarantee' | 'percentage' | 'guarantee_vs_percentage' | 'flat_fee';
  guarantee?: number;
  percentage?: number;
  expenses: {
    production?: number;
    marketing?: number;
    staffing?: number;
    transportation?: number;
    [key: string]: number | undefined;
  };
  settlement: {
    gross: number;
    expenses: number;
    net: number;
  };
  notes?: string;
}

export interface ShowAdvances {
  id: string;
  show_id: string;
  production_manager: {
    name: string;
    email: string;
    phone: string;
  };
  venue_contact: {
    name: string;
    email: string;
    phone: string;
  };
  schedule: {
    loadIn: string;
    soundcheck: string;
    doors: string;
    showtime: string;
    curfew: string;
  };
  catering: {
    mealTimes: {
      lunch: string;
      dinner: string;
    };
    requirements: string;
  };
  parking: {
    trucks: string;
    buses: string;
    cars: string;
    location: string;
  };
  technical_requirements?: string;
  hospitality_requirements?: string;
  notes?: string;
}

export interface SetlistSong {
  id: string;
  position: number;
  song_title: string;
  duration: string;
  key: string;
  is_encore: boolean;
  notes?: string;
}

export interface Setlist {
  id: string;
  show_id: string;
  status: 'draft' | 'proposed' | 'final' | 'archived';
  notes: string;
  last_updated: string;
  updated_by: string;
  songs: SetlistSong[];
}

export interface GuestListEntry {
  id: string;
  show_id: string;
  name: string;
  type: 'vip' | 'industry' | 'friends_family' | 'media' | 'other';
  quantity: number;
  requested_by: string;
  status: 'pending' | 'approved' | 'declined';
  contact_info?: string;
  notes?: string;
  tickets_sent: boolean;
}

export interface MarketingTask {
  id: string;
  show_id: string;
  task_key: string;
  label: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
}

export interface ProductionFile {
  id: string;
  show_id: string;
  name: string;
  type: 'tech_rider' | 'hospitality_rider' | 'stage_plot' | 'input_list' | 'backline' | 'contract' | 'other';
  file_url: string;
  version: string;
  uploaded_at: string;
  uploaded_by: string;
  notes?: string;
}

export interface ShowWithDetails {
  id: string;
  artist_id: string;
  title: string;
  venue_name: string;
  venue_city: string;
  venue_country: string;
  venue_address?: string;
  venue_state?: string;
  date: string;
  doors_time?: string;
  show_time?: string;
  capacity?: number;
  ticket_price?: number;
  guarantee?: number;
  status: string;
  notes?: string;
  deal?: ShowDeal;
  advances?: ShowAdvances;
  setlist?: Setlist;
  guestList?: GuestListEntry[];
  marketingTasks?: MarketingTask[];
  productionFiles?: ProductionFile[];
  transportation?: any[];
  accommodation?: any[];
}

export async function getShowDetails(showId: string): Promise<ShowWithDetails | null> {
  console.log('Fetching show details for ID:', showId);

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('*')
    .eq('id', showId)
    .maybeSingle();

  if (showError || !show) {
    console.error('Error fetching show:', showError);
    return null;
  }

  console.log('Show fetched:', show);

  const { data: deal } = await supabase
    .from('show_deals')
    .select('*')
    .eq('show_id', showId)
    .maybeSingle();

  const { data: advances } = await supabase
    .from('show_advances')
    .select('*')
    .eq('show_id', showId)
    .maybeSingle();

  const { data: setlistData } = await supabase
    .from('setlists')
    .select('*')
    .eq('show_id', showId)
    .maybeSingle();

  let setlist = null;
  if (setlistData) {
    const { data: songs } = await supabase
      .from('setlist_songs')
      .select('*')
      .eq('setlist_id', setlistData.id)
      .order('position');

    setlist = {
      ...setlistData,
      songs: songs || []
    };
  }

  const { data: guestList } = await supabase
    .from('guest_list')
    .select('*')
    .eq('show_id', showId)
    .order('created_at');

  const { data: marketingTasks } = await supabase
    .from('marketing_tasks')
    .select('*')
    .eq('show_id', showId)
    .order('created_at');

  const { data: productionFiles } = await supabase
    .from('production_files')
    .select('*')
    .eq('show_id', showId)
    .order('uploaded_at', { ascending: false });

  const { data: transportation } = await supabase
    .from('transportation')
    .select('*')
    .eq('show_id', showId)
    .order('departure_time');

  const { data: accommodation } = await supabase
    .from('accommodations')
    .select('*')
    .eq('show_id', showId)
    .order('check_in_date');

  const result = {
    ...show,
    deal: deal || undefined,
    advances: advances || undefined,
    setlist: setlist || undefined,
    guestList: guestList || [],
    marketingTasks: marketingTasks || [],
    productionFiles: productionFiles || [],
    transportation: transportation || [],
    accommodation: accommodation || []
  };

  console.log('Complete show details:', result);
  return result;
}

export async function updateShowDeal(showId: string, deal: Partial<ShowDeal>) {
  const { data: existing } = await supabase
    .from('show_deals')
    .select('id')
    .eq('show_id', showId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('show_deals')
      .update({ ...deal, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    return { data, error };
  } else {
    const { data, error } = await supabase
      .from('show_deals')
      .insert({ ...deal, show_id: showId })
      .select()
      .single();
    return { data, error };
  }
}

export async function updateShowAdvances(showId: string, advances: Partial<ShowAdvances>) {
  const { data: existing } = await supabase
    .from('show_advances')
    .select('id')
    .eq('show_id', showId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('show_advances')
      .update({ ...advances, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    return { data, error };
  } else {
    const { data, error } = await supabase
      .from('show_advances')
      .insert({ ...advances, show_id: showId })
      .select()
      .single();
    return { data, error };
  }
}

export async function toggleMarketingTask(taskId: string, completed: boolean) {
  const { data, error } = await supabase
    .from('marketing_tasks')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      completed_by: completed ? 'Current User' : '',
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single();

  return { data, error };
}

export async function addGuestListEntry(showId: string, guest: Omit<GuestListEntry, 'id' | 'show_id' | 'tickets_sent'>) {
  const { data, error } = await supabase
    .from('guest_list')
    .insert({
      show_id: showId,
      ...guest,
      tickets_sent: false
    })
    .select()
    .single();

  return { data, error };
}

export async function updateGuestStatus(guestId: string, status: 'pending' | 'approved' | 'declined') {
  const { data, error } = await supabase
    .from('guest_list')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', guestId)
    .select()
    .single();

  return { data, error };
}

export async function markTicketsSent(guestId: string) {
  const { data, error } = await supabase
    .from('guest_list')
    .update({ tickets_sent: true, updated_at: new Date().toISOString() })
    .eq('id', guestId)
    .select()
    .single();

  return { data, error };
}
