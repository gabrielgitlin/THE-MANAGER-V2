import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import VenueCard from '../../components/live/VenueCard';
import VenueModal from '../../components/live/VenueModal';
import { getVenues, createVenue } from '../../lib/venueService';
import type { EnhancedVenue, VenueFormData } from '../../types/venue';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Venues() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<EnhancedVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('all');

  useEffect(() => { loadVenues(); }, []);

  const loadVenues = async () => {
    try {
      setLoading(true);
      const data = await getVenues();
      setVenues(data);
    } catch (err) {
      console.error('Error loading venues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVenue = async (formData: VenueFormData) => {
    await createVenue(formData);
    await loadVenues();
  };

  // Get unique tags from all venues
  const allTags = [...new Set(venues.flatMap(v => v.tags || []))].sort();

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = tagFilter === 'all' || (venue.tags || []).includes(tagFilter);
    return matchesSearch && matchesTag;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <img src="/TM-Search-negro.svg" className="pxi-md icon-muted absolute left-3 top-1/2 -translate-y-1/2" alt="" />
          <input
            type="text"
            placeholder="Search venues..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
          />
        </div>

        <div className="flex items-center gap-2">
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}
            >
              <option value="all">All Types</option>
              {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-1 text-white"
          >
            <Plus size={16} /> New Venue
          </button>
        </div>
      </div>

      {/* Venue count */}
      <div className="text-xs mb-4" style={{ color: 'var(--t3)' }}>
        {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''}
      </div>

      {/* Venue list */}
      {filteredVenues.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--t3)' }}>
          {venues.length === 0 ? (
            <>
              <p className="text-lg mb-2" style={{ color: 'var(--t2)' }}>No venues yet</p>
              <p className="text-sm">Add venues to build your venue database.</p>
            </>
          ) : (
            <p className="text-sm">No venues match your search.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredVenues.map(venue => (
            <VenueCard
              key={venue.id}
              venue={venue}
              onClick={() => navigate(`/live/venue/${venue.id}`)}
            />
          ))}
        </div>
      )}

      <VenueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateVenue}
      />
    </div>
  );
}
