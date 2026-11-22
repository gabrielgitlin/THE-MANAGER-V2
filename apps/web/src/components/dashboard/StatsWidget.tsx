import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Stat {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

export default function StatsWidget() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch real counts from Supabase
      const [
        { count: trackCount },
        { count: showCount },
        { count: taskCount },
        { count: noteCount },
      ] = await Promise.all([
        supabase.from('tracks').select('*', { count: 'exact', head: true }),
        supabase.from('shows').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('completed', false),
        supabase.from('notes').select('*', { count: 'exact', head: true }),
      ]);

      // Get next upcoming show
      const { data: nextShow } = await supabase
        .from('shows')
        .select('name, date, venue')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(1)
        .maybeSingle();

      const nextShowText = nextShow
        ? `${nextShow.venue || nextShow.name} · ${new Date(nextShow.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
        : 'None scheduled';

      setStats([
        { label: 'Tracks', value: String(trackCount || 0), sub: 'In catalog' },
        { label: 'Open Tasks', value: String(taskCount || 0), sub: 'Pending', color: (taskCount || 0) > 0 ? 'var(--status-yellow)' : undefined },
        { label: 'Next Show', value: nextShow ? new Date(nextShow.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—', sub: nextShowText },
        { label: 'Notes', value: String(noteCount || 0), sub: 'Active notes' },
      ]);
    } catch (e) {
      console.error('Stats error:', e);
      setStats([
        { label: 'Tracks', value: '—' },
        { label: 'Open Tasks', value: '—' },
        { label: 'Next Show', value: '—' },
        { label: 'Notes', value: '—' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="metric-grid" style={{ gridTemplateColumns: `repeat(${stats.length || 4}, 1fr)` }}>
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="metric-card animate-pulse">
            <div style={{ width: 48, height: 22, background: 'var(--surface-3)', borderRadius: 4, marginBottom: 6 }} />
            <div style={{ width: 64, height: 10, background: 'var(--surface-3)', borderRadius: 3 }} />
          </div>
        ))
      ) : (
        stats.map((s) => (
          <div key={s.label} className="metric-card">
            <div className="val" style={{ color: s.color || 'var(--t1)' }}>{s.value}</div>
            <div className="lbl">{s.label}</div>
            {s.sub && <div className="sub">{s.sub}</div>}
          </div>
        ))
      )}
    </div>
  );
}
