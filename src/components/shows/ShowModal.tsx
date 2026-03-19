import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../Modal';
import VenueMapPreview from '../VenueMapPreview';
import type { Show, VenueSearchResult, GooglePlaceDetails } from '../../types';
import {
  searchVenues,
  getPlaceDetails,
  saveVenueFromGooglePlace,
  debounceSearch,
} from '../../lib/venueSearch';

interface ShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (show: Omit<Show, 'id'>) => void;
  show?: Show;
}

export default function ShowModal({ isOpen, onClose, onSubmit, show }: ShowModalProps) {
  const venueSearchRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    venue: '',
    venue_address: '',
    city: '',
    venue_state: '',
    country: '',
    venue_latitude: undefined as number | undefined,
    venue_longitude: undefined as number | undefined,
    google_place_id: '',
    venue_id: undefined as number | undefined,
    status: 'confirmed' as string,
    capacity: 0,
  });

  const [venueSearchResults, setVenueSearchResults] = useState<VenueSearchResult[]>([]);
  const [showVenueResults, setShowVenueResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: show?.title || '',
        date: show?.date || '',
        time: show?.time || '',
        venue: show?.venue || '',
        venue_address: show?.venue_address || '',
        city: show?.city || '',
        venue_state: show?.venue_state || '',
        country: show?.country || '',
        venue_latitude: show?.venue_latitude,
        venue_longitude: show?.venue_longitude,
        google_place_id: show?.google_place_id || '',
        venue_id: show?.venue_id,
        status: show?.status || 'confirmed',
        capacity: show?.capacity || 0,
      });
      setShowMapPreview(!!(show?.venue_latitude && show?.venue_longitude));
      setVenueSearchResults([]);
      setShowVenueResults(false);
    }
  }, [isOpen, show]);

  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setVenueSearchResults([]);
      setShowVenueResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchVenues(query);
      setVenueSearchResults(results);
      setShowVenueResults(true);
    } catch (error) {
      console.error('Error searching venues:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounceSearch((query: string) => performSearch(query), 300),
    [performSearch]
  );

  useEffect(() => {
    debouncedSearch(formData.venue);
  }, [formData.venue, debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (venueSearchRef.current && !venueSearchRef.current.contains(event.target as Node)) {
        setShowVenueResults(false);
      }
    };

    if (showVenueResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVenueResults]);

  const handleVenueSelect = async (venue: VenueSearchResult) => {
    if (venue.source === 'google' && venue.google_place_id) {
      const details = await getPlaceDetails(venue.google_place_id);
      if (details) {
        await handleGooglePlaceSelect(details);
        return;
      }
    }

    setFormData({
      ...formData,
      venue: venue.name,
      venue_address: venue.address || '',
      city: venue.city,
      venue_state: venue.state || '',
      country: venue.country,
      venue_latitude: venue.latitude,
      venue_longitude: venue.longitude,
      google_place_id: venue.google_place_id || '',
      venue_id: venue.id ? parseInt(venue.id) : undefined,
      capacity: venue.capacity || formData.capacity,
    });
    setShowVenueResults(false);
    setShowMapPreview(
      !!(venue.latitude && venue.longitude)
    );
  };

  const handleGooglePlaceSelect = async (placeDetails: GooglePlaceDetails) => {
    const savedVenue = await saveVenueFromGooglePlace(placeDetails);

    setFormData({
      ...formData,
      venue: placeDetails.name,
      venue_address: placeDetails.address,
      city: placeDetails.city,
      venue_state: placeDetails.state,
      country: placeDetails.country,
      venue_latitude: placeDetails.latitude,
      venue_longitude: placeDetails.longitude,
      google_place_id: placeDetails.placeId,
      venue_id: savedVenue ? parseInt(savedVenue.id) : undefined,
      capacity: formData.capacity || 0,
    });
    setShowVenueResults(false);
    setShowMapPreview(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, title: formData.venue });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={show ? 'Edit Show' : 'Add New Show'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="mt-1 block w-full rounded-none border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            style={{ color: '#000000' }}
            required
          />
        </div>

        <div className="relative" ref={venueSearchRef}>
          <label htmlFor="venue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Venue
          </label>
          <div className="relative">
            <input
              type="text"
              id="venue"
              value={formData.venue}
              onChange={(e) => {
                setFormData({ ...formData, venue: e.target.value });
                setShowMapPreview(false);
              }}
              onFocus={() => {
                if (venueSearchResults.length > 0) {
                  setShowVenueResults(true);
                }
              }}
              className="mt-1 block w-full rounded-none border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm pr-10"
              style={{ color: '#000000' }}
              required
              autoComplete="off"
              placeholder="Search for a venue..."
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
          {showVenueResults && venueSearchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto">
              {venueSearchResults.map((venue, index) => (
                <button
                  key={venue.google_place_id || venue.id || index}
                  type="button"
                  onClick={() => handleVenueSelect(venue)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-base text-gray-900 dark:text-gray-100">
                      {venue.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {venue.address}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      {venue.city}
                      {venue.state && `, ${venue.state}`}
                      {venue.country && ` • ${venue.country}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="venue_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Address
          </label>
          <input
            type="text"
            id="venue_address"
            value={formData.venue_address}
            onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
            className="mt-1 block w-full rounded-none border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            style={{ color: '#000000' }}
            placeholder="Optional"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              City
            </label>
            <input
              type="text"
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="mt-1 block w-full rounded-none border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              style={{ color: '#000000' }}
              required
            />
          </div>

          <div>
            <label htmlFor="venue_state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              State/Province
            </label>
            <input
              type="text"
              id="venue_state"
              value={formData.venue_state}
              onChange={(e) => setFormData({ ...formData, venue_state: e.target.value })}
              className="mt-1 block w-full rounded-none border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              style={{ color: '#000000' }}
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Country
          </label>
          <input
            type="text"
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="mt-1 block w-full rounded-none border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            style={{ color: '#000000' }}
            required
          />
        </div>

        {showMapPreview &&
          formData.venue_latitude &&
          formData.venue_longitude && (
            <VenueMapPreview
              latitude={formData.venue_latitude}
              longitude={formData.venue_longitude}
              name={formData.venue}
              address={`${formData.venue_address}, ${formData.city}${
                formData.venue_state ? `, ${formData.venue_state}` : ''
              }, ${formData.country}`}
            />
          )}

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Show['status'] })}
            className="mt-1 block w-full rounded-none border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            style={{ color: '#000000' }}
          >
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
          >
            {show ? 'Save Changes' : 'Add Show'}
          </button>
        </div>
      </form>
    </Modal>
  );
}