import { useState, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useMusicPlayerStore } from '../store/musicPlayerStore';
import ArtistPortal from './ArtistPortal';
import MusicPlayer from './MusicPlayer';
import AIManager from './AIManager';
import MobileTabBar from './MobileTabBar';

const PolyhedraIcons = {
  Dashboard: () => (
    <img src="/TM-Pin-negro.png" alt="Dashboard" className="w-10 h-10 object-contain" />
  ),
  Calendar: () => (
    <img src="/TM-Calendario-negro.png" alt="Calendar" className="w-10 h-10 object-contain" />
  ),
  Catalog: () => (
    <img src="/TM-Vinil-negro.png" alt="Catalog" className="w-10 h-10 object-contain" />
  ),
  Finance: () => (
    <img src="/TM-Monedas-negro.png" alt="Finance" className="w-10 h-10 object-contain" />
  ),
  Legal: () => (
    <img src="/TM-Contrato-negro.png" alt="Legal" className="w-10 h-10 object-contain" />
  ),
  Live: () => (
    <img src="/TM-Maletin-negro.png" alt="Live" className="w-10 h-10 object-contain" />
  ),
  Marketing: () => (
    <img src="/TM-Ajedrez Caballo-negro.png" alt="Marketing" className="w-10 h-10 object-contain" />
  ),
  Artist: () => (
    <img src="/TM-Icono-negro.png" alt="Artist" className="w-10 h-10 object-contain" />
  ),
  Team: () => (
    <img src="/TM-Sello-negro.png" alt="Team" className="w-10 h-10 object-contain" />
  ),
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isArtistPortalOpen, setIsArtistPortalOpen] = useState(false);
  const [isAIManagerOpen, setIsAIManagerOpen] = useState(false);
  const [titleAnimating, setTitleAnimating] = useState(false);
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
      label: 'TEAM',
      path: '/team',
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
    <div className="flex flex-col h-screen bg-white">
      <div className="flex-1 flex flex-col min-h-0">
        <header
          className="bg-white/95 backdrop-blur-md border-b border-black sticky top-0 z-50"
          style={{ paddingTop: 'var(--sat)' }}
        >
          <div className="flex items-center justify-between px-4 md:px-8 h-12 md:h-16">
            <div
              className="cursor-pointer flex-shrink-0"
              onClick={handleTitleClick}
              ref={titleRef}
            >
              <img
                src="/The Manager_Logo_PNG-2.png"
                alt="The Manager"
                className="h-5 md:h-8 object-contain"
              />
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path ||
                  (location.pathname.startsWith(item.path) && item.path !== '/');
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex flex-col items-center justify-center p-2 group ${
                      isActive ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div
                      className="w-10 h-10 transition-all duration-300 ease-out group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:drop-shadow-md"
                      style={isActive ? {
                        filter: 'brightness(0) saturate(100%) invert(38%) sepia(93%) saturate(1352%) hue-rotate(130deg) brightness(92%) contrast(102%)'
                      } : {}}
                    >
                      <Icon />
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/settings')}
                className="hidden md:block p-2"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ paddingBottom: 'calc(var(--tab-bar-height) + var(--sab) + 16px)' }}
        >
          <div className="px-4 py-4 md:px-8 md:py-8">
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
