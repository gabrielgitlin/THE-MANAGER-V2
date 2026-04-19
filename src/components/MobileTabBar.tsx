import { Link, useLocation } from 'react-router-dom';
import { StickyNote, CheckSquare, Settings, type LucideIcon } from 'lucide-react';

type Tab =
  | { type: 'image'; icon: string; path: string }
  | { type: 'lucide'; LucideIcon: LucideIcon; path: string };

const tabs: Tab[] = [
  { type: 'image', icon: '/TM-Pin-negro.png', path: '/dashboard' },
  { type: 'image', icon: '/TM-Calendario-negro.png', path: '/calendar' },
  { type: 'image', icon: '/TM-Maletin-negro.png', path: '/live' },
  { type: 'image', icon: '/TM-Monedas-negro.png', path: '/finance' },
  { type: 'image', icon: '/TM-Vinil-negro.png', path: '/catalog' },
  { type: 'image', icon: '/TM-Contrato-negro.png', path: '/legal' },
  { type: 'image', icon: '/TM-Ajedrez Caballo-negro.png', path: '/marketing' },
  { type: 'image', icon: '/TM-Sello-negro.png', path: '/industry' },
  { type: 'image', icon: '/TM-Icono-negro.png', path: '/artist' },
  { type: 'lucide', LucideIcon: StickyNote, path: '/notes' },
  { type: 'lucide', LucideIcon: CheckSquare, path: '/tasks' },
  { type: 'lucide', LucideIcon: Settings, path: '/settings' },
];

const activeFilter = 'brightness(0) saturate(100%) invert(38%) sepia(93%) saturate(1352%) hue-rotate(130deg) brightness(92%) contrast(102%)';

export default function MobileTabBar() {
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path ||
    (location.pathname.startsWith(path) && path !== '/');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 md:hidden"
      style={{ paddingBottom: 'var(--sab)' }}
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
              className="flex items-center justify-center flex-shrink-0 w-14 active:opacity-70 transition-opacity"
            >
              <div className="relative">
                {active && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#009C55]" />
                )}
                {tab.type === 'image' ? (
                  <img
                    src={tab.icon}
                    alt=""
                    className={`w-8 h-8 object-contain transition-all duration-200 ${active ? 'scale-110' : ''}`}
                    style={active ? { filter: activeFilter } : { opacity: 0.4 }}
                  />
                ) : (
                  <tab.LucideIcon
                    className={`w-8 h-8 transition-all duration-200 ${active ? 'text-[#009C55] scale-110' : 'text-gray-400'}`}
                    strokeWidth={active ? 2.5 : 1.5}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
