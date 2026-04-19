import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, Music, ListOrdered } from 'lucide-react';
import TourDayRow from '../../components/live/TourDayRow';
import TourDayModal from '../../components/live/TourDayModal';
import TourModal from '../../components/live/TourModal';
import TicketShareModal from '../../components/live/TicketShareModal';
import { getTour, getTourDays, updateTour, addTourDay, updateTourDay, deleteTourDay, deleteTour } from '../../lib/tourService';
import type { Tour, TourDay, TourFormData, TourDayFormData } from '../../types/tour';
import type { VintageTicketData } from '../../components/live/VintageTicket';
import { formatDate } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';

const statusColors: Record<string, string> = {
  planning: 'status-badge badge-yellow',
  confirmed: 'status-badge badge-green',
  in_progress: 'status-badge badge-brand',
  completed: 'status-badge badge-neutral',
  cancelled: 'status-badge badge-neutral',
};

const statusLabels: Record<string, string> = {
  planning: 'Planning',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function TourDetails() {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const [tour, setTour] = useState<Tour | null>(null);
  const [days, setDays] = useState<TourDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditTourOpen, setIsEditTourOpen] = useState(false);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<TourDay | undefined>();
  const [ticketDay, setTicketDay] = useState<TourDay | null>(null);

  useEffect(() => {
    if (tourId) loadTourData();
  }, [tourId]);

  const loadTourData = async () => {
    try {
      setLoading(true);
      const [tourData, daysData] = await Promise.all([
        getTour(tourId!),
        getTourDays(tourId!),
      ]);
      setTour(tourData);
      setDays(daysData);
    } catch (err) {
      console.error('Error loading tour:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTour = async (formData: TourFormData) => {
    if (!tourId) return;
    const updated = await updateTour(tourId, formData);
    setTour(prev => prev ? { ...prev, ...updated } : null);
  };

  const handleSaveDay = async (formData: TourDayFormData) => {
    if (!tourId) return;
    if (editingDay) {
      await updateTourDay(editingDay.id, formData);
    } else {
      await addTourDay(tourId, formData);
    }
    await loadTourData();
  };

  const handleDeleteDay = async (day: TourDay) => {
    if (!confirm(`Delete this ${day.day_type} day?`)) return;
    await deleteTourDay(day.id);
    setDays(prev => prev.filter(d => d.id !== day.id));
  };

  const handleDeleteTour = async () => {
    if (!tourId || !confirm('Delete this entire tour? All tour days will be removed.')) return;
    await deleteTour(tourId);
    navigate('/live');
  };

  if (loading) return <LoadingSpinner />;
  if (!tour) return <div style={{ color: 'var(--t2)' }}>Tour not found</div>;

  const showDays = days.filter(d => d.day_type === 'show');
  const travelDays = days.filter(d => d.day_type === 'travel');
  const offDays = days.filter(d => d.day_type === 'off');
  const rehearsalDays = days.filter(d => d.day_type === 'rehearsal');

  const ticketData: VintageTicketData | null = ticketDay?.show ? {
    artistName: tour.artist_name || '',
    date: ticketDay.date,
    time: ticketDay.show.show_time,
    venueName: ticketDay.show.venue_name,
    city: ticketDay.show.venue_city,
    country: ticketDay.show.venue_country,
    tourName: tour.name,
  } : null;

  return (
    <div>
      {/* Back nav */}
      <button onClick={() => navigate('/live')} className="flex items-center gap-1 text-sm mb-4 hover:underline" style={{ color: 'var(--t3)' }}>
        <img src="/TM-ArrowLeft-negro.svg" className="pxi-md icon-muted" alt="" /> Back to Tours
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--t1)' }}>{tour.name}</h1>
            <span className={statusColors[tour.status]}>
              {statusLabels[tour.status]}
            </span>
          </div>
          {tour.artist_name && <p className="text-sm" style={{ color: 'var(--t2)' }}>{tour.artist_name}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2" style={{ color: 'var(--t3)' }}>
            {tour.start_date && tour.end_date && (
              <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(tour.start_date)} — {formatDate(tour.end_date)}</span>
            )}
            <span className="flex items-center gap-1"><Music size={12} />{showDays.length} shows</span>
            {travelDays.length > 0 && <span>{travelDays.length} travel</span>}
            {offDays.length > 0 && <span>{offDays.length} off</span>}
            {rehearsalDays.length > 0 && <span>{rehearsalDays.length} rehearsal</span>}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => navigate(`/live/tour/${tourId}/itinerary`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}
          >
            <ListOrdered size={14} /> Itinerary
          </button>
          <button onClick={() => setIsEditTourOpen(true)} className="p-2 rounded-lg hover:bg-white/10" style={{ border: '1px solid var(--border-2)' }}>
            <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="Edit" />
          </button>
          <button onClick={handleDeleteTour} className="p-2 rounded-lg hover:bg-red-500/20" style={{ border: '1px solid var(--border-2)' }}>
            <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="Delete" />
          </button>
        </div>
      </div>

      {tour.description && (
        <p className="text-sm mb-6 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)' }}>
          {tour.description}
        </p>
      )}

      {/* Days list */}
      <div>
        <div className="flex items-center justify-between">
          <div className="folder-label">
            <img src="/TM-File-negro.svg" className="pxi-sm icon-muted" alt="" />
            Tour Days ({days.length})
          </div>
          <button
            onClick={() => { setEditingDay(undefined); setIsDayModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-brand-1 text-white"
          >
            <Plus size={14} /> Add Day
          </button>
        </div>
        <div className="folder-body">
          {days.length === 0 ? (
            <div className="text-center py-12">
              <p className="mb-1" style={{ color: 'var(--t2)' }}>No days added yet</p>
              <p className="text-xs" style={{ color: 'var(--t3)' }}>Add show days, travel days, days off, and rehearsal days to build your tour schedule.</p>
            </div>
          ) : (
            <div className="grid gap-2 p-3">
              {days.map(day => (
                <TourDayRow
                  key={day.id}
                  day={day}
                  onEdit={(d) => { setEditingDay(d); setIsDayModalOpen(true); }}
                  onDelete={handleDeleteDay}
                  onTicket={(d) => setTicketDay(d)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TourModal isOpen={isEditTourOpen} onClose={() => setIsEditTourOpen(false)} onSave={handleUpdateTour} tour={tour} />

      <TourDayModal
        isOpen={isDayModalOpen}
        onClose={() => { setIsDayModalOpen(false); setEditingDay(undefined); }}
        onSave={handleSaveDay}
        tourId={tourId!}
        existingDay={editingDay}
      />

      {ticketData && (
        <TicketShareModal
          isOpen={!!ticketDay}
          onClose={() => setTicketDay(null)}
          ticketData={ticketData}
        />
      )}
    </div>
  );
}
