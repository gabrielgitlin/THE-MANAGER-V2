import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Show {
  id: string;
  name: string;
  date: string;
  venue?: string;
  city?: string;
  status?: string;
}

export default function UpcomingShowsWidget() {
  const navigate = useNavigate();
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('shows')
        .select('id, name, date, venue, city, status')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(5);
      setShows(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      month: d.toLocaleDateString('en', { month: 'short' }).toUpperCase(),
      day: d.getDate(),
      weekday: d.toLocaleDateString('en', { weekday: 'short' }),
    };
  };

  const daysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff}d`;
  };

  return (
    <div className="tm-card">
      <div className="tm-card-header">
        <div className="flex items-center gap-2">
          <img src="/TM-Maletin-negro.png" alt="" style={{ width: 16, height: 16, filter: 'invert(1)', opacity: 0.4 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Upcoming Shows
          </span>
        </div>
        <button
          onClick={() => navigate('/live')}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: 11, color: 'var(--brand-1)' }}
        >
          View All
        </button>
      </div>

      <div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--t3)' }} />
          </div>
        ) : shows.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 16px' }}>
            <img src="/TM-Maletin-negro.png" alt="" className="empty-state-icon" style={{ width: 36, height: 36 }} />
            <div className="empty-state-title">No upcoming shows</div>
          </div>
        ) : (
          shows.map((show) => {
            const dt = formatDate(show.date);
            return (
              <div
                key={show.id}
                onClick={() => navigate(`/live/show/${show.id}`)}
                className="flex items-center gap-3"
                style={{
                  padding: '10px 20px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Date block */}
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-3)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 9, color: 'var(--brand-1)', fontWeight: 700, letterSpacing: '0.05em' }}>{dt.month}</span>
                  <span style={{ fontSize: 16, color: 'var(--t1)', fontWeight: 600, lineHeight: 1 }}>{dt.day}</span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {show.name}
                  </div>
                  <div className="flex items-center gap-1" style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                    {show.venue && <><MapPin size={10} /> {show.venue}</>}
                    {show.city && show.venue && ' · '}
                    {show.city}
                  </div>
                </div>

                {/* Countdown */}
                <span style={{ fontSize: 11, color: 'var(--t3)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {daysUntil(show.date)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
