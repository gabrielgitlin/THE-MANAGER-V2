// Enhanced Venue types

export interface VenueContact {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface EnhancedVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  capacity: number;
  website?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  google_place_id?: string;
  contacts: VenueContact[];
  technical_rider_url?: string;
  hospitality_rider_url?: string;
  stage_plot_url?: string;
  notes?: string;
  tags?: string[];
  parking_info?: string;
  load_in_info?: string;
  wifi_info?: string;
  is_verified?: boolean;
  usage_count?: number;
  last_played?: string;
  created_at: string;
  updated_at: string;
}

export interface VenueFormData {
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  capacity?: number;
  website?: string;
  phone?: string;
  email?: string;
  contacts?: VenueContact[];
  technical_rider_url?: string;
  hospitality_rider_url?: string;
  stage_plot_url?: string;
  notes?: string;
  tags?: string[];
  parking_info?: string;
  load_in_info?: string;
  wifi_info?: string;
}
