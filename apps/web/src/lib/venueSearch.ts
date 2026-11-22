import { supabase } from './supabase';
import type {
  Venue,
  VenueSearchResult,
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
      const nominatimResults = await searchNominatim(query);
      results.push(...nominatimResults);
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

// Nominatim (OpenStreetMap) — free, no API key, global venue/address coverage.
// Called directly from the browser; full address data comes back in one call
// so no separate "details" fetch is needed when the user clicks a result.
async function searchNominatim(query: string): Promise<VenueSearchResult[]> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '8');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'TheManager/1.0 (music management platform)',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();

    return (data as NominatimResult[])
      .map((item) => {
        const addr = item.address ?? {};

        // Best name: use the POI name field, then amenity/attraction tags, then first part of display_name
        const name =
          item.name ||
          addr.amenity ||
          addr.attraction ||
          addr.leisure ||
          addr.tourism ||
          addr.shop ||
          item.display_name.split(',')[0].trim();

        const streetNumber = addr.house_number ?? '';
        const street = addr.road ?? '';
        const address =
          streetNumber && street
            ? `${streetNumber} ${street}`
            : street || '';

        const city =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.municipality ||
          addr.county ||
          '';

        const state = addr.state ?? '';
        const country = addr.country ?? '';
        const postalCode = addr.postcode ?? '';

        return {
          name,
          address,
          city,
          state,
          country,
          // Encode postal code in the id field so handleVenueSelect can pass it through
          id: postalCode ? `osm:${item.place_id}:${postalCode}` : `osm:${item.place_id}`,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          source: 'database' as const, // treated as "already has full data, no extra fetch needed"
        } satisfies VenueSearchResult;
      })
      .filter((v) => v.name && (v.city || v.address));
  } catch (error) {
    console.error('Nominatim search error:', error);
    return [];
  }
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    amenity?: string;
    attraction?: string;
    leisure?: string;
    tourism?: string;
    shop?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

// getPlaceDetails kept for future use if Google billing is ever enabled.
export async function getPlaceDetails(
  placeId: string
): Promise<GooglePlaceDetails | null> {
  // Nominatim results already include full address in the search response,
  // so source:'database' results never call this. Only source:'google' would.
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

    if (!response.ok) return null;

    const data = await response.json();
    return data.placeDetails ?? null;
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

      if (existing) return existing;
    }

    const { data, error } = await supabase
      .from('venues')
      .insert([{ ...venue, is_verified: !!venue.google_place_id, usage_count: 0 }])
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

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function debounceSearch<T extends unknown[]>(
  func: (...args: T) => void,
  delay: number
): (...args: T) => void {
  return (...args: T) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func(...args), delay);
  };
}
