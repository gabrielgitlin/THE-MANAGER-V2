import { Link, useLocation } from 'react-router-dom';
import { StickyNote, CheckSquare, type LucideIcon } from 'lucide-react';

type Tab =
  | { type: 'pixel'; icon: string; label: string; path: string }
  | { type: 'lucide'; LucideIcon: LucideIcon; label: string; path: string };

const tabs: Tab[] = [
  { type: 'pixel', icon: '/TM-Pin-negro.png', label: 'Home', path: '/dashboard' },
  { type: 'pixel', icon: '/TM-Calendario-negro.png', label: 'Cal', path: '/calendar' },
  { type: 'pixel', icon: '/TM-Maletin-negro.png', label: 'Live', path: '/live' },
  // { type: 'pixel', icon: '/TM-Monedas-negro.png', label: 'Finance', path: '/finance' }, // v2
  { type: 'pixel', icon: '/TM-Vinil-negro.png', label: 'Catalog', path: '/catalog' },
  { type: 'pixel', icon: '/TM-Contrato-negro.png', label: 'Legal', path: '/legal' },
  { type: 'pixel', icon: '/TM-Ajedrez Caballo-negro.png', label: 'Mktg', path: '/marketing' },
  { type: 'pixel', icon: '/TM-Sello-negro.png', label: 'Team', path: '/team' },
  { type: 'pixel', icon: '/TM-Icono-negro.png', label: 'Artist', path: '/artist' },
  { type: 'lucide', LucideIcon: StickyNote, label: 'Notes', path: '/notes' },
  { type: 'lucide', LucideIcon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { type: 'pixel', icon: '/TM-Settings-negro.svg', label: 'Settings', path: '/settings' },
];

/* CSS filter to turn black pixel icon into The Manager green #009C55 */
const activeFilter = 'brightness(0) saturate(100%) invert(40%) sepia(85%) saturate(600%) hue-rotate(118deg) brightness(95%) contrast(101%)';

export default function MobileTabBar() {
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path ||
    (location.pathname.startsWith(path) && path !== '/');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: '#111111',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'var(--sab)',
      }}
    >
      <div
        className="flex items-stretch overflow-x-auto scrollbar-hide"
        style={{ height: 'var(--tab-bar-height)' }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center justify-center flex-shrink-0 w-14 active:opacity-70 transition-opacity gap-0.5"
            >
              <div className="relative">
                {active && (
                  <div
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: 'var(--brand-1)' }}
                  />
                )}
                {tab.type === 'pixel' ? (
                  <img
                    src={tab.icon}
                    alt=""
                    className="w-6 h-6 object-contain transition-all duration-200"
                    style={{
                      filter: active ? activeFilter : 'invert(1)',
                      opacity: active ? 1 : 0.4,
                    }}
                  />
                ) : (
                  <tab.LucideIcon
                    className="w-5 h-5 transition-all duration-200"
                    style={{
                      color: active ? 'var(--brand-1)' : 'var(--t3)',
                    }}
                    strokeWidth={active ? 2.2 : 1.5}
                  />
                )}
              </div>
              <span
                className="text-[8px] font-medium"
                style={{ color: active ? 'var(--brand-1)' : 'var(--t3)' }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
