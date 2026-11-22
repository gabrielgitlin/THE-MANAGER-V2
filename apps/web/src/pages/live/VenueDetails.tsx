import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Users, Globe, Mail, Music } from 'lucide-react';
import VenueModal from '../../components/live/VenueModal';
import { getVenue, updateVenue, deleteVenue } from '../../lib/venueService';
import { supabase } from '../../lib/supabase';
import type { EnhancedVenue, VenueFormData } from '../../types/venue';
import { formatDate } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function VenueDetails() {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<EnhancedVenue | null>(null);
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (venueId) loadVenueData();
  }, [venueId]);

  const loadVenueData = async () => {
    try {
      setLoading(true);
      const venueData = await getVenue(venueId!);
      setVenue(venueData);

      // Load shows at this venue
      const { data: showsData } = await supabase
        .from('shows')
        .select('id, title, date, show_time, status, venue_name')
        .eq('venue_id', venueId)
        .order('date', { ascending: false });
      setShows(showsData || []);
    } catch (err) {
      console.error('Error loading venue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (formData: VenueFormData) => {
    if (!venueId) return;
    const updated = await updateVenue(venueId, formData);
    setVenue(updated);
  };

  const handleDelete = async () => {
    if (!venueId || !confirm('Delete this venue?')) return;
    await deleteVenue(venueId);
    navigate('/live/venues');
  };

  if (loading) return <LoadingSpinner />;
  if (!venue) return <div style={{ color: 'var(--t2)' }}>Venue not found</div>;

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate('/live/venues')} className="flex items-center gap-1 text-sm mb-4 hover:underline" style={{ color: 'var(--t3)' }}>
        <img src="/TM-ArrowLeft-negro.svg" className="pxi-md icon-muted" alt="" /> Back to Venues
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--t1)' }}>{venue.name}</h1>
          <div className="flex items-center gap-1 text-sm mt-1" style={{ color: 'var(--t2)' }}>
            <MapPin size={14} />
            {venue.address && `${venue.address}, `}{venue.city}{venue.state ? `, ${venue.state}` : ''}, {venue.country}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2" style={{ color: 'var(--t3)' }}>
            {venue.capacity > 0 && <span className="flex items-center gap-1"><Users size={12} />{venue.capacity.toLocaleString()} capacity</span>}
            {venue.phone && <span className="flex items-center gap-1"><img src="/TM-Phone-negro.svg" className="pxi-sm icon-muted" alt="" />{venue.phone}</span>}
            {venue.email && <span className="flex items-center gap-1"><Mail size={12} />{venue.email}</span>}
          </div>
          {venue.tags && venue.tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {venue.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-white/5" style={{ color: 'var(--t3)' }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {venue.website && (
            <a href={venue.website} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-white/10" style={{ border: '1px solid var(--border-2)' }}>
              <Globe size={16} style={{ color: 'var(--t2)' }} />
            </a>
          )}
          <button onClick={() => setIsEditOpen(true)} className="p-2 rounded-lg hover:bg-white/10" style={{ border: '1px solid var(--border-2)' }}>
            <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="Edit" />
          </button>
          <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-red-500/20" style={{ border: '1px solid var(--border-2)' }}>
            <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="Delete" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Contacts */}
        {venue.contacts.length > 0 && (
          <div>
            <div className="folder-label">Contacts</div>
            <div className="folder-body p-4">
              <div className="space-y-3">
                {venue.contacts.map(contact => (
                  <div key={contact.id}>
                    <div className="font-medium text-sm" style={{ color: 'var(--t1)' }}>{contact.name}</div>
                    <div className="text-xs" style={{ color: 'var(--t3)' }}>{contact.role}</div>
                    {contact.email && <div className="text-xs" style={{ color: 'var(--t3)' }}>{contact.email}</div>}
                    {contact.phone && <div className="text-xs" style={{ color: 'var(--t3)' }}>{contact.phone}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Documents */}
        {(venue.technical_rider_url || venue.hospitality_rider_url || venue.stage_plot_url) && (
          <div>
            <div className="folder-label">
              <img src="/TM-File-negro.svg" className="pxi-sm icon-muted" alt="" />
              Documents
            </div>
            <div className="folder-body p-4">
              <div className="space-y-2">
                {venue.technical_rider_url && (
                  <a href={venue.technical_rider_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--t1)' }}>
                    <img src="/TM-File-negro.svg" className="pxi-sm icon-muted" alt="" /> Technical Rider <img src="/TM-ExternalLink-negro.svg" className="pxi-sm icon-muted" alt="" />
                  </a>
                )}
                {venue.hospitality_rider_url && (
                  <a href={venue.hospitality_rider_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--t1)' }}>
                    <img src="/TM-File-negro.svg" className="pxi-sm icon-muted" alt="" /> Hospitality Rider <img src="/TM-ExternalLink-negro.svg" className="pxi-sm icon-muted" alt="" />
                  </a>
                )}
                {venue.stage_plot_url && (
                  <a href={venue.stage_plot_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--t1)' }}>
                    <img src="/TM-File-negro.svg" className="pxi-sm icon-muted" alt="" /> Stage Plot <img src="/TM-ExternalLink-negro.svg" className="pxi-sm icon-muted" alt="" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        {(venue.parking_info || venue.load_in_info || venue.wifi_info) && (
          <div>
            <div className="folder-label">Venue Info</div>
            <div className="folder-body p-4">
              <div className="space-y-2 text-sm">
                {venue.parking_info && <div><span className="font-medium" style={{ color: 'var(--t2)' }}>Parking:</span> <span style={{ color: 'var(--t3)' }}>{venue.parking_info}</span></div>}
                {venue.load_in_info && <div><span className="font-medium" style={{ color: 'var(--t2)' }}>Load-In:</span> <span style={{ color: 'var(--t3)' }}>{venue.load_in_info}</span></div>}
                {venue.wifi_info && <div><span className="font-medium" style={{ color: 'var(--t2)' }}>WiFi:</span> <span style={{ color: 'var(--t3)' }}>{venue.wifi_info}</span></div>}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {venue.notes && (
          <div>
            <div className="folder-label">Notes</div>
            <div className="folder-body p-4">
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--t3)' }}>{venue.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Show history */}
      {shows.length > 0 && (
        <div className="mt-6">
          <div className="folder-label">
            <img src="/TM-File-negro.svg" className="pxi-sm icon-muted" alt="" />
            Show History ({shows.length})
          </div>
          <div className="folder-body">
          <div className="grid gap-2 p-3">
            {shows.map(show => (
              <button
                key={show.id}
                onClick={() => navigate(`/live/show/${show.id}`)}
                className="flex items-center gap-3 p-3 rounded-lg text-left hover:bg-white/5 transition-colors"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-2)' }}
              >
                <Music size={14} style={{ color: 'var(--t3)' }} />
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--t1)' }}>{show.title}</div>
                  <div className="text-xs" style={{ color: 'var(--t3)' }}>{formatDate(show.date)}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  show.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                  show.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {show.status}
                </span>
              </button>
            ))}
          </div>
          </div>
        </div>
      )}

      <VenueModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSave={handleUpdate} venue={venue} />
    </div>
  );
}
