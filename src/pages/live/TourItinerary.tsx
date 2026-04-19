import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, MapPin, Clock, Hotel, Plane, Music, Coffee } from 'lucide-react';
import { getTour, getTourDays } from '../../lib/tourService';
import { supabase } from '../../lib/supabase';
import type { Tour, TourDay, DayType } from '../../types/tour';
import { formatDate, formatTime } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';

const dayIcon: Record<DayType, React.ElementType | null> = {
  show: Music,
  travel: Plane,
  off: Coffee,
  rehearsal: null,
};

const dayIconSrc: Record<DayType, string | null> = {
  show: null,
  travel: null,
  off: null,
  rehearsal: '/TM-Mic-negro.svg',
};

const dayColors: Record<DayType, string> = {
  show: 'text-green-400',
  travel: 'text-blue-400',
  off: 'text-gray-400',
  rehearsal: 'text-purple-400',
};

export default function TourItinerary() {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const [tour, setTour] = useState<Tour | null>(null);
  const [days, setDays] = useState<TourDay[]>([]);
  const [advances, setAdvances] = useState<Record<string, any>>({});
  const [transport, setTransport] = useState<Record<string, any[]>>({});
  const [hotels, setHotels] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tourId) loadItineraryData();
  }, [tourId]);

  const loadItineraryData = async () => {
    try {
      setLoading(true);
      const [tourData, daysData] = await Promise.all([
        getTour(tourId!),
        getTourDays(tourId!),
      ]);
      setTour(tourData);
      setDays(daysData);

      const showIds = daysData.filter(d => d.show_id).map(d => d.show_id!);
      if (showIds.length > 0) {
        const [advRes, transRes, hotelRes] = await Promise.all([
          supabase.from('show_advances').select('*').in('show_id', showIds),
          supabase.from('transportation').select('*').in('show_id', showIds),
          supabase.from('accommodations').select('*').in('show_id', showIds),
        ]);

        const advMap: Record<string, any> = {};
        (advRes.data || []).forEach(a => { advMap[a.show_id] = a; });
        setAdvances(advMap);

        const transMap: Record<string, any[]> = {};
        (transRes.data || []).forEach(t => {
          if (!transMap[t.show_id]) transMap[t.show_id] = [];
          transMap[t.show_id].push(t);
        });
        setTransport(transMap);

        const hotelMap: Record<string, any[]> = {};
        (hotelRes.data || []).forEach(h => {
          if (!hotelMap[h.show_id]) hotelMap[h.show_id] = [];
          hotelMap[h.show_id].push(h);
        });
        setHotels(hotelMap);
      }
    } catch (err) {
      console.error('Error loading itinerary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!tour) return <div style={{ color: 'var(--t2)' }}>Tour not found</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/live/tour/${tourId}`)} className="p-1.5 rounded hover:bg-white/10">
            <img src="/TM-ArrowLeft-negro.svg" className="pxi-md icon-muted" alt="" />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--t1)' }}>{tour.name} — Itinerary</h1>
            {tour.artist_name && <p className="text-sm" style={{ color: 'var(--t2)' }}>{tour.artist_name}</p>}
          </div>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}>
          <Printer size={14} /> Print
        </button>
      </div>

      {/* Days */}
      <div className="space-y-3 print:space-y-2">
        {days.map(day => {
          const Icon = dayIcon[day.day_type];
          const iconSrc = dayIconSrc[day.day_type];
          const colorClass = dayColors[day.day_type];
          const adv = day.show_id ? advances[day.show_id] : null;
          const trans = day.show_id ? transport[day.show_id] || [] : [];
          const hotel = day.show_id ? hotels[day.show_id] || [] : [];
          const schedule = adv?.schedule;

          return (
            <div key={day.id} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-2)' }}>
              {/* Day header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="text-center min-w-[45px]">
                  <div className="text-xs font-medium uppercase" style={{ color: 'var(--t3)' }}>
                    {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold" style={{ color: 'var(--t1)' }}>
                    {new Date(day.date + 'T00:00:00').getDate()}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--t3)' }}>
                    {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
                {iconSrc
                  ? <img src={iconSrc} className={`pxi-md icon-muted`} alt="" />
                  : Icon && <Icon size={16} className={colorClass} />
                }
                <div className="flex-1">
                  <div className="font-semibold" style={{ color: 'var(--t1)' }}>
                    {day.day_type === 'show' && day.show ? day.show.title : day.title || day.day_type}
                  </div>
                  {day.day_type === 'show' && day.show && (
                    <div className="text-xs" style={{ color: 'var(--t3)' }}>
                      <MapPin size={11} className="inline mr-1" />
                      {day.show.venue_name} — {day.show.venue_city}, {day.show.venue_country}
                    </div>
                  )}
                  {day.day_type !== 'show' && day.city && (
                    <div className="text-xs" style={{ color: 'var(--t3)' }}>
                      <MapPin size={11} className="inline mr-1" />
                      {day.city}{day.country ? `, ${day.country}` : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule grid for show days */}
              {schedule && (
                <div className="grid grid-cols-5 gap-2 text-xs mb-3 p-2 rounded" style={{ backgroundColor: 'var(--bg)' }}>
                  {['loadIn', 'soundcheck', 'doors', 'showtime', 'curfew'].map(key => (
                    <div key={key} className="text-center">
                      <div className="font-medium capitalize" style={{ color: 'var(--t2)' }}>
                        {key === 'loadIn' ? 'Load In' : key}
                      </div>
                      <div style={{ color: 'var(--t1)' }}>
                        {schedule[key] ? formatTime(schedule[key]) : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Transport */}
              {trans.length > 0 && (
                <div className="text-xs mb-2 flex items-center gap-1" style={{ color: 'var(--t3)' }}>
                  <Plane size={11} />
                  {trans.map((t, i) => (
                    <span key={i}>{t.type}: {t.departure_location} → {t.arrival_location}{i < trans.length - 1 ? ' | ' : ''}</span>
                  ))}
                </div>
              )}

              {/* Hotel */}
              {hotel.length > 0 && (
                <div className="text-xs flex items-center gap-1" style={{ color: 'var(--t3)' }}>
                  <Hotel size={11} />
                  {hotel.map(h => h.hotel_name || h.name).join(', ')}
                </div>
              )}

              {day.notes && (
                <div className="text-xs mt-2 italic" style={{ color: 'var(--t3)' }}>{day.notes}</div>
              )}
            </div>
          );
        })}

        {days.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--t3)' }}>
            <p>No days in this tour yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
