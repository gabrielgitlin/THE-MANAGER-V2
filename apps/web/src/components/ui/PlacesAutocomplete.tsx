// src/components/ui/PlacesAutocomplete.tsx
// Reusable Google Places autocomplete input.
// Searches venues/addresses via the existing venueSearch lib (Supabase edge function).
// Calls onPlaceSelect with full address data when user clicks a result.
// Parent controls the input value via `value` + `onChange`, and populates other
// fields via `onPlaceSelect`.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { searchVenues, getPlaceDetails, debounceSearch } from '../../lib/venueSearch';
import type { VenueSearchResult } from '../../types';

export interface PlaceResult {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  phone?: string;
  website?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export default function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  required,
  className,
  style,
  id,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<VenueSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  // Suppress the next search cycle after the user selects a result
  const suppressRef = useRef(false);

  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await searchVenues(query);
      if (!suppressRef.current) {
        setResults(res);
        setShowResults(res.length > 0);
      }
    } catch (err) {
      console.error('PlacesAutocomplete search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounceSearch((q: string) => performSearch(q), 350),
    [performSearch]
  );

  // Trigger search when value changes (unless we just selected a result)
  useEffect(() => {
    if (suppressRef.current) {
      suppressRef.current = false;
      return;
    }
    debouncedSearch(value);
  }, [value, debouncedSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (venue: VenueSearchResult) => {
    suppressRef.current = true;
    setShowResults(false);
    setResults([]);

    if (venue.source === 'google' && venue.google_place_id) {
      const details = await getPlaceDetails(venue.google_place_id);
      if (details) {
        onPlaceSelect({
          name: details.name,
          address: details.address,
          city: details.city,
          state: details.state ?? '',
          country: details.country,
          postalCode: details.postalCode ?? '',
          latitude: details.latitude,
          longitude: details.longitude,
          placeId: details.placeId,
          phone: details.phone,
          website: details.website,
        });
        return;
      }
    }

    // Local DB or Nominatim result — all address data already present.
    // Nominatim encodes postal code as "osm:<id>:<postalCode>" in the id field.
    const postalCode =
      venue.id?.startsWith('osm:')
        ? (venue.id.split(':')[2] ?? '')
        : '';

    onPlaceSelect({
      name: venue.name,
      address: venue.address ?? '',
      city: venue.city,
      state: venue.state ?? '',
      country: venue.country,
      postalCode,
      latitude: venue.latitude,
      longitude: venue.longitude,
      placeId: venue.google_place_id,
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setShowResults(true); }}
          placeholder={placeholder}
          required={required}
          className={className}
          style={style}
          autoComplete="off"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--t3)' }} />
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div
          className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {results.map((venue, i) => (
            <button
              key={venue.google_place_id || venue.id || i}
              type="button"
              onClick={() => handleSelect(venue)}
              className="w-full text-left px-4 py-3 transition-colors"
              style={{
                borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                background: 'transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="text-sm font-medium" style={{ color: 'var(--t1)' }}>
                {venue.name}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>
                {[venue.address, venue.city, venue.state, venue.country]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
