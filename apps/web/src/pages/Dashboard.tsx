import StatsWidget from '../components/dashboard/StatsWidget';
import TasksWidget from '../components/dashboard/TasksWidget';
import NotesWidget from '../components/dashboard/NotesWidget';
import UpcomingShowsWidget from '../components/dashboard/UpcomingShowsWidget';
import ActivityWidget from '../components/dashboard/ActivityWidget';
import QuickActionsWidget from '../components/dashboard/QuickActionsWidget';

export default function Dashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap, 24px)' }}>
      {/* KPI Stats — full width row */}
      <StatsWidget />

      {/* Main 2-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          gap: 'var(--section-gap, 24px)',
          alignItems: 'start',
        }}
      >
        {/* Left column — 60% */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap, 24px)' }}>
          <TasksWidget />
          <NotesWidget />
        </div>

        {/* Right column — 40% */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap, 24px)' }}>
          <QuickActionsWidget />
          <UpcomingShowsWidget />
          <ActivityWidget />
        </div>
      </div>
    </div>
  );
}
