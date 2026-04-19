import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Calendar, Music, Users } from 'lucide-react';

interface QuickAction {
  label: string;
  icon: typeof Plus;
  path: string;
  color: string;
}

const ACTIONS: QuickAction[] = [
  { label: 'New Task', icon: Plus, path: '/tasks', color: 'var(--brand-1)' },
  { label: 'Add Show', icon: Calendar, path: '/live', color: 'var(--status-orange)' },
  { label: 'Catalog', icon: Music, path: '/catalog', color: 'var(--status-blue, #6496ff)' },
  { label: 'Notes', icon: FileText, path: '/notes', color: 'var(--brand-1)' },
  { label: 'Team', icon: Users, path: '/team', color: 'var(--t2)' },
];

export default function QuickActionsWidget() {
  const navigate = useNavigate();

  return (
    <div className="tm-card">
      <div className="tm-card-header">
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quick Actions
        </span>
      </div>
      <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '12px 8px', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--surface-3)';
                e.currentTarget.style.borderColor = action.color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--surface-2)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `${action.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={15} style={{ color: action.color }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 500 }}>
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
