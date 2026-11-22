// Tour & Tour Day types

export type TourStatus = 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type DayType = 'show' | 'travel' | 'off' | 'rehearsal';

export interface Tour {
  id: string;
  artist_id: string;
  artist_name?: string;
  name: string;
  description?: string;
  status: TourStatus;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Computed/joined
  total_shows?: number;
  total_days?: number;
  cities?: string[];
}

export interface TourDay {
  id: string;
  tour_id: string;
  date: string;
  day_type: DayType;
  show_id?: string;
  title?: string;
  notes?: string;
  city?: string;
  country?: string;
  // Joined show data (when day_type === 'show')
  show?: {
    id: string;
    title: string;
    venue_name: string;
    venue_city: string;
    venue_country: string;
    show_time?: string;
    status: string;
    capacity?: number;
  };
}

export interface TourFormData {
  name: string;
  description?: string;
  status: TourStatus;
  start_date?: string;
  end_date?: string;
  artist_id: string;
}

export interface TourDayFormData {
  date: string;
  day_type: DayType;
  show_id?: string;
  title?: string;
  notes?: string;
  city?: string;
  country?: string;
}
