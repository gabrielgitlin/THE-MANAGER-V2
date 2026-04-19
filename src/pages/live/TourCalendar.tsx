import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Music, Plane, Coffee, Mic } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import type { DayType } from '../../types/tour';

const dayTypeConfig: Record<DayType, { color: string; icon: React.ElementType; label: string }> = {
  show: { color: 'bg-green-500', icon: Music, label: 'Show' },
  travel: { color: 'bg-blue-500', icon: Plane, label: 'Travel' },
  off: { color: 'bg-gray-500', icon: Coffee, label: 'Off' },
  rehearsal: { color: 'bg-purple-500', icon: Mic, label: 'Rehearsal' },
};

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  events: {
    id: string;
    tour_id: string;
    tour_name: string;
    day_type: DayType;
    title: string;
    show_id?: string;
  }[];
}

export default function TourCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tourDays, setTourDays] = useState<any[]>([]);
  const [tours, setTours] = useState<{ id: string; name: string }[]>([]);
  const [tourFilter, setTourFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => { loadData(); }, [year, month]);

  const loadData = async () => {
    try {
      setLoading(true);
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const [toursRes, daysRes] = await Promise.all([
        supabase.from('tours').select('id, name').order('name'),
        supabase.from('tour_days')
          .select('*, tours(name), shows(id, title, venue_name, venue_city)')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date'),
      ]);

      setTours(toursRes.data || []);
      setTourDays(daysRes.data || []);
    } catch (err) {
      console.error('Error loading calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay();
    const days: CalendarDay[] = [];

    // Previous month padding
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false, events: [] });
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

      const events = tourDays
        .filter(td => td.date === dateStr && (tourFilter === 'all' || td.tour_id === tourFilter))
        .map(td => ({
          id: td.id,
          tour_id: td.tour_id,
          tour_name: td.tours?.name || '',
          day_type: td.day_type as DayType,
          title: td.day_type === 'show' && td.shows ? td.shows.title : td.title || td.day_type,
          show_id: td.show_id,
        }));

      days.push({ date: d, isCurrentMonth: true, events });
    }

    // Next month padding
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false, events: [] });
      }
    }

    return days;
  }, [year, month, tourDays, tourFilter]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const isToday = (d: Date) => {
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 rounded hover:bg-white/10">
            <ChevronLeft size={18} style={{ color: 'var(--t2)' }} />
          </button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center" style={{ color: 'var(--t1)' }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={nextMonth} className="p-1.5 rounded hover:bg-white/10">
            <ChevronRight size={18} style={{ color: 'var(--t2)' }} />
          </button>
          <button onClick={today} className="px-3 py-1 rounded text-xs font-medium"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}>
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select value={tourFilter} onChange={e => setTourFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}>
            <option value="all">All Tours</option>
            {tours.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4">
        {Object.entries(dayTypeConfig).map(([type, config]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--t3)' }}>
            <div className={`w-2 h-2 rounded-full ${config.color}`} />
            {config.label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-2)' }}>
        {/* Day headers */}
        <div className="grid grid-cols-7">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="px-2 py-2 text-xs font-medium text-center uppercase"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t3)', borderBottom: '1px solid var(--border-2)' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => (
            <div
              key={idx}
              className="min-h-[80px] md:min-h-[100px] p-1.5"
              style={{
                backgroundColor: day.isCurrentMonth ? 'var(--bg)' : 'var(--surface)',
                borderBottom: '1px solid var(--border-2)',
                borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--border-2)' : undefined,
              }}
            >
              <div className={`text-xs font-medium mb-1 ${isToday(day.date) ? 'text-brand-1' : ''}`}
                style={!isToday(day.date) ? { color: day.isCurrentMonth ? 'var(--t2)' : 'var(--t3)' } : {}}>
                {day.date.getDate()}
              </div>

              <div className="space-y-0.5">
                {day.events.map(evt => {
                  const config = dayTypeConfig[evt.day_type];
                  return (
                    <button
                      key={evt.id}
                      onClick={() => {
                        if (evt.show_id) navigate(`/live/show/${evt.show_id}`);
                        else navigate(`/live/tour/${evt.tour_id}`);
                      }}
                      className="w-full flex items-center gap-1 px-1 py-0.5 rounded text-left hover:bg-white/10 transition-colors"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.color}`} />
                      <span className="text-[10px] truncate" style={{ color: 'var(--t1)' }}>
                        {evt.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
