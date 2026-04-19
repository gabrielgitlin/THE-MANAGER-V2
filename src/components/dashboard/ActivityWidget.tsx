import { useState, useEffect } from 'react';
import { CheckCircle, FileText, Music, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ActivityItem {
  id: string;
  type: 'task' | 'note' | 'show' | 'track';
  title: string;
  timestamp: string;
  icon: typeof CheckCircle;
  color: string;
}

export default function ActivityWidget() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      // Fetch recent activity from multiple tables
      const [
        { data: recentTasks },
        { data: recentNotes },
        { data: recentShows },
      ] = await Promise.all([
        supabase.from('tasks').select('id, title, updated_at, completed').order('updated_at', { ascending: false }).limit(5),
        supabase.from('notes').select('id, title, content, updated_at').order('updated_at', { ascending: false }).limit(3),
        supabase.from('shows').select('id, name, created_at').order('created_at', { ascending: false }).limit(3),
      ]);

      const activities: ActivityItem[] = [];

      (recentTasks || []).forEach(t => {
        activities.push({
          id: `task-${t.id}`,
          type: 'task',
          title: t.completed ? `Completed "${t.title}"` : `Updated "${t.title}"`,
          timestamp: t.updated_at,
          icon: CheckCircle,
          color: t.completed ? 'var(--status-green)' : 'var(--status-yellow)',
        });
      });

      (recentNotes || []).forEach(n => {
        activities.push({
          id: `note-${n.id}`,
          type: 'note',
          title: `Note: ${n.title || n.content?.substring(0, 40) || 'Untitled'}`,
          timestamp: n.updated_at,
          icon: FileText,
          color: 'var(--brand-1)',
        });
      });

      (recentShows || []).forEach(s => {
        activities.push({
          id: `show-${s.id}`,
          type: 'show',
          title: `Show: ${s.name}`,
          timestamp: s.created_at,
          icon: Calendar,
          color: 'var(--status-orange)',
        });
      });

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setItems(activities.slice(0, 8));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString('en', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="tm-card">
      <div className="tm-card-header">
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Recent Activity
        </span>
      </div>

      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--t3)' }} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--t3)' }}>No recent activity</span>
          </div>
        ) : (
          items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-start gap-3"
                style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)' }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: `${item.color}15`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1,
                }}>
                  <Icon size={12} style={{ color: item.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, color: 'var(--t2)', lineHeight: 1.4,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {item.title}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {timeAgo(item.timestamp)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
