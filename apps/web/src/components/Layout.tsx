import { useState, useRef, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useMusicPlayerStore } from '../store/musicPlayerStore';
import ArtistPortal from './ArtistPortal';
import MusicPlayer from './MusicPlayer';
import AIManager from './AIManager';
import MobileTabBar from './MobileTabBar';

/* ── Pixel art icon map (from Andrés Higueros brand identity) ── */
const menuItems = [
  // { icon: '/TM-Pin-negro.png',               path: '/dashboard', tooltip: 'Dashboard', label: 'DASH' },
  { icon: '/TM-Calendario-negro.png',         path: '/calendar',  tooltip: 'Calendar',  label: 'CAL'  },
  { icon: '/TM-Vinil-negro.png',              path: '/catalog',   tooltip: 'Catalog',   label: 'CTLG' },
  // { icon: '/TM-Monedas-negro.png',         path: '/finance',   tooltip: 'Finance',   label: 'FIN'  }, // v2
  { icon: '/TM-Contrato-negro.png',           path: '/legal',     tooltip: 'Legal',     label: 'LEGAL'},
  { icon: '/TM-Maletin-negro.png',            path: '/live',      tooltip: 'Live',      label: 'LIVE' },
  // { icon: '/TM-Ajedrez Caballo-negro.png',    path: '/marketing', tooltip: 'Marketing', label: 'MKTG' },
  { icon: '/TM-Sello-negro.png',              path: '/team',      tooltip: 'Team',      label: 'TEAM' },
  { icon: '/TM-Icono-negro.png',              path: '/artist',    tooltip: 'Artist',    label: 'ART'  },
];

/* Active icon filter: turns black pixel icon to brand green #009C55 */
const activeFilter = 'brightness(0) saturate(100%) invert(40%) sepia(85%) saturate(600%) hue-rotate(118deg) brightness(95%) contrast(101%)';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isArtistPortalOpen, setIsArtistPortalOpen] = useState(false);
  const [isAIManagerOpen, setIsAIManagerOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  const {
    tracks,
    currentTrackIndex,
    isPlaying,
    hasInteracted,
    setCurrentTrackIndex,
    setIsPlaying,
    togglePlayPause,
    setHasInteracted
  } = useMusicPlayerStore();

  const handleTrackChange = (index: number) => {
    setCurrentTrackIndex(index);
    if (isPlaying) {
      setIsPlaying(true);
    }
  };

  const handleArtistInfoSave = (info: any) => {
    console.log('Saving artist info:', info);
  };


  const menuItems = [
    {
      icon: PolyhedraIcons.Dashboard,
      label: 'DASHBOARD',
      path: '/dashboard',
      permission: 'view_dashboard' as const,
      group: 1
    },
    {
      icon: PolyhedraIcons.Calendar,
      label: 'CALENDAR',
      path: '/calendar',
      permission: 'view_live' as const,
      group: 1
    },
    {
      icon: PolyhedraIcons.Catalog,
      label: 'CATALOG',
      path: '/catalog',
      permission: 'view_catalog' as const,
      group: 2
    },
    {
      icon: PolyhedraIcons.Finance,
      label: 'FINANCE',
      path: '/finance',
      permission: 'view_finance' as const,
      group: 2
    },
    {
      icon: PolyhedraIcons.Legal,
      label: 'LEGAL',
      path: '/legal',
      permission: 'view_legal' as const,
      group: 2
    },
    {
      icon: PolyhedraIcons.Live,
      label: 'LIVE',
      path: '/live',
      permission: 'view_live' as const,
      group: 2
    },
    {
      icon: PolyhedraIcons.Marketing,
      label: 'MARKETING',
      path: '/marketing',
      permission: 'view_marketing' as const,
      group: 2
    },
    {
      icon: PolyhedraIcons.Team,
      label: 'INDUSTRY',
      path: '/industry',
      permission: 'view_personnel' as const,
      group: 3
    },
    {
      icon: PolyhedraIcons.Artist,
      label: 'ARTIST',
      path: '/artist',
      permission: 'view_sensitive_info' as const,
      group: 3
    },
  ];

  const handleTitleClick = () => {
    if (titleAnimating) return;

    setTitleAnimating(true);

    if (titleRef.current) {
      titleRef.current.style.transition = 'transform 0.6s ease-in-out';
      titleRef.current.style.transformStyle = 'preserve-3d';
      titleRef.current.style.transform = 'perspective(800px) rotateY(180deg)';

      setTimeout(() => {
        if (titleRef.current) {
          titleRef.current.style.transform = 'perspective(800px) rotateY(360deg)';

          setTimeout(() => {
            if (titleRef.current) {
              titleRef.current.style.transition = '';
              titleRef.current.style.transform = '';
              setTitleAnimating(false);
            }
          }, 600);
        }
      }, 300);
    }

    setIsAIManagerOpen(true);
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>
      <div className="flex-1 flex flex-col min-h-0">
        {/* ── SINGLE NAV BAR: Logo + Icons + Settings ── */}
        <header
          className="sticky top-0 z-50"
          style={{
            background: 'var(--bg)',
            paddingTop: 'var(--sat)',
          }}
        >
          <div className="flex items-center h-[56px] px-4 md:px-5">
            {/* Logo — left (swaps to hovered page name) */}
            <div
              className="cursor-pointer flex-shrink-0 flex items-center mr-6"
              onClick={() => setIsAIManagerOpen(true)}
              ref={titleRef}
              style={{ width: '120px', position: 'relative', height: '24px' }}
            >
              <img
                src="/The Manager_Logo_PNG-2.png"
                alt="The Manager"
                className="h-5 md:h-6 object-contain invert"
                style={{
                  position: 'absolute',
                  left: 0,
                  opacity: hoveredPath ? 0 : 1,
                  transition: 'opacity 0.15s ease',
                  pointerEvents: hoveredPath ? 'none' : 'auto',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '16px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--t1)',
                  opacity: hoveredPath ? 1 : 0,
                  transition: 'opacity 0.15s ease',
                  whiteSpace: 'nowrap',
                  lineHeight: '21.75px',
                }}
              >
                {menuItems.find(m => m.path === hoveredPath)?.tooltip ?? ''}
              </span>
            </div>

            {/* Nav icons — center/fill */}
            <nav className="hidden md:flex items-center gap-0 flex-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path ||
                  (location.pathname.startsWith(item.path) && item.path !== '/');
                const isHovered = hoveredPath === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={item.tooltip}
                    className="flex items-center justify-center"
                    style={{
                      width: '52px',
                      height: '56px',
                      borderBottom: isActive
                        ? '2px solid var(--brand-1)'
                        : isHovered
                          ? '2px solid var(--border-3)'
                          : '2px solid transparent',
                      transition: 'border-color 0.12s',
                    }}
                    onMouseEnter={() => setHoveredPath(item.path)}
                    onMouseLeave={() => setHoveredPath(null)}
                  >
                    <img
                      src={item.icon}
                      alt={item.tooltip}
                      className="w-7 h-7 object-contain"
                      style={{
                        filter: isActive ? activeFilter : 'invert(1)',
                        opacity: isActive ? 1 : isHovered ? 0.75 : 0.35,
                        transform: isHovered && !isActive ? 'translateY(-2px)' : 'translateY(0)',
                        transition: 'opacity 0.12s, transform 0.15s cubic-bezier(0.16,1,0.3,1)',
                      }}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Settings — right */}
            <div className="flex items-center ml-auto">
              <button
                onClick={() => navigate('/settings')}
                className="hidden md:flex items-center justify-center w-[52px] h-[56px]"
                style={{ color: 'var(--t3)' }}
              >
                <img src="/TM-Settings-negro.svg" className="pxi-lg icon-muted" alt="Settings" />
              </button>
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{
            background: 'var(--bg)',
            paddingBottom: 'calc(var(--tab-bar-height) + var(--sab) + 16px)',
          }}
        >
          <div className="max-w-[1600px] mx-auto px-4 pt-7 pb-3 md:px-6 md:pt-8 md:pb-4">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileTabBar />

      <ArtistPortal
        isOpen={isArtistPortalOpen}
        onClose={() => setIsArtistPortalOpen(false)}
        onSave={handleArtistInfoSave}
      />

      <AIManager
        isOpen={isAIManagerOpen}
        onClose={() => setIsAIManagerOpen(false)}
      />

      {hasInteracted && tracks.length > 0 && (
        <MusicPlayer
          tracks={tracks}
          currentTrackIndex={currentTrackIndex}
          onTrackChange={handleTrackChange}
          isPlaying={isPlaying}
          onPlayPause={togglePlayPause}
          onClose={() => setHasInteracted(false)}
        />
      )}
    </div>
  );
}
