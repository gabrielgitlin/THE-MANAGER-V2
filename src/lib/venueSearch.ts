import { supabase } from './supabase';
import type {
  Venue,
  VenueSearchResult,
  GooglePlacePrediction,
  GooglePlaceDetails,
} from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function searchVenues(
  query: string
): Promise<VenueSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const results: VenueSearchResult[] = [];

  try {
    const localResults = await searchLocalVenues(query);
    results.push(...localResults);

    if (localResults.length < 5) {
      const googleResults = await searchGooglePlaces(query);
      results.push(...googleResults);
    }
  } catch (error) {
    console.error('Error searching venues:', error);
  }

  return results.slice(0, 10);
}

async function searchLocalVenues(query: string): Promise<VenueSearchResult[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
    .order('usage_count', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error searching local venues:', error);
    return [];
  }

  return (data || []).map((venue: Venue) => ({
    id: venue.id,
    name: venue.name,
    address: venue.address,
    city: venue.city,
    state: venue.state,
    country: venue.country,
    latitude: venue.latitude,
    longitude: venue.longitude,
    google_place_id: venue.google_place_id,
    capacity: venue.capacity,
    website: venue.website,
    phone: venue.phone,
    is_verified: venue.is_verified,
    usage_count: venue.usage_count,
    source: 'database' as const,
  }));
}

async function searchGooglePlaces(
  query: string
): Promise<VenueSearchResult[]> {
  try {
    const url = `${SUPABASE_URL}/functions/v1/google-places-search?input=${encodeURIComponent(
      query
    )}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Google Places search failed:', response.statusText);
      return [];
    }

    const data = await response.json();
    const predictions: GooglePlacePrediction[] = data.predictions || [];

    return predictions.map((prediction) => {
      const addressParts = prediction.address.split(', ');
      const city = addressParts[0] || '';
      const country = addressParts[addressParts.length - 1] || '';

      return {
        name: prediction.name,
        address: prediction.address,
        city,
        country,
        google_place_id: prediction.placeId,
        source: 'google' as const,
      };
    });
  } catch (error) {
    console.error('Error searching Google Places:', error);
    return [];
  }
}

export async function getPlaceDetails(
  placeId: string
): Promise<GooglePlaceDetails | null> {
  try {
    const url = `${SUPABASE_URL}/functions/v1/google-place-details?place_id=${encodeURIComponent(
      placeId
    )}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Google Place Details fetch failed:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.placeDetails;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

export async function saveVenue(
  venue: Omit<Venue, 'id' | 'created_at' | 'updated_at'>
): Promise<Venue | null> {
  try {
    if (venue.google_place_id) {
      const { data: existing } = await supabase
        .from('venues')
        .select('*')
        .eq('google_place_id', venue.google_place_id)
        .maybeSingle();

      if (existing) {
        return existing;
      }
    }

    const { data, error } = await supabase
      .from('venues')
      .insert([
        {
          ...venue,
          is_verified: !!venue.google_place_id,
          usage_count: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving venue:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error saving venue:', error);
    return null;
  }
}

export async function saveVenueFromGooglePlace(
  placeDetails: GooglePlaceDetails
): Promise<Venue | null> {
  return saveVenue({
    name: placeDetails.name,
    address: placeDetails.address,
    city: placeDetails.city,
    state: placeDetails.state,
    country: placeDetails.country,
    postal_code: placeDetails.postalCode,
    latitude: placeDetails.latitude,
    longitude: placeDetails.longitude,
    google_place_id: placeDetails.placeId,
    phone: placeDetails.phone,
    website: placeDetails.website,
    capacity: 0,
  });
}

let debounceTimer: NodeJS.Timeout | null = null;

export function debounceSearch<T extends unknown[]>(
  func: (...args: T) => void,
  delay: number
): (...args: T) => void {
  return (...args: T) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      func(...args);
    }, delay);
  };
}
