import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

interface Playlist {
  id: string;
  title: string;
  description: string | null;
  password_hash: string | null;
  cover_url?: string | null;
  is_public: boolean;
  user_id: string;
}

interface PlaylistTrack {
  position: number;
  tracks: {
    id: string;
    title: string;
    duration: number;
    audio_url?: string;
    preview_url?: string;
    spotify_url?: string;
  };
  albumInfo?: {
    title: string;
    cover_url?: string;
    artist_name?: string;
  };
}

export default function SharedPlaylist() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthStore();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  useEffect(() => {
    if (shareToken && !authLoading) {
      fetchPlaylist();
    }
  }, [shareToken, authLoading]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (currentTrackIndex !== null && currentTrackIndex < tracks.length - 1) {
        playTrack(currentTrackIndex + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex, tracks.length]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  const fetchPlaylist = async () => {
    try {
      const { data, error: playlistError } = await supabase
        .from('playlists')
        .select('id, title, description, password_hash, cover_url, is_public, user_id')
        .eq('share_token', shareToken)
        .maybeSingle();

      if (playlistError) {
        console.error('Playlist query error:', playlistError);
        throw playlistError;
      }

      if (!data) {
        setError('Playlist not found or is not publicly shared');
        setIsLoading(false);
        return;
      }

      const isOwner = user && data.user_id === user.id;

      setPlaylist(data);

      if (isOwner) {
        await fetchTracks(data.id);
      } else if (data.password_hash) {
        setIsPasswordProtected(true);
        setIsLoading(false);
      } else {
        await fetchTracks(data.id);
      }
    } catch (error: any) {
      console.error('Error fetching playlist:', error);
      setError(error?.message || 'Failed to load playlist');
      setIsLoading(false);
    }
  };

  const fetchTracks = async (playlistId: string) => {
    try {
      const { data, error } = await supabase
        .from('playlist_tracks')
        .select(`
          position,
          tracks (
            id,
            title,
            duration,
            audio_url,
            preview_url,
            spotify_url
          )
        `)
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (error) throw error;

      const tracksWithAlbums = await Promise.all(
        (data || []).map(async (pt: any) => {
          const { data: albumData } = await supabase
            .from('album_tracks')
            .select('albums(title, cover_url, artists(name))')
            .eq('track_id', pt.tracks.id)
            .limit(1)
            .maybeSingle();

          return {
            ...pt,
            albumInfo: albumData?.albums ? {
              title: albumData.albums.title,
              cover_url: albumData.albums.cover_url,
              artist_name: albumData.albums.artists?.name,
            } : undefined,
          };
        })
      );

      setTracks(tracksWithAlbums);
      setIsUnlocked(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      setError('Failed to load tracks');
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlist || !password) return;

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hashHex === playlist.password_hash) {
        await fetchTracks(playlist.id);
      } else {
        setError('Incorrect password');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setError('Failed to verify password');
    }
  };

  const playTrack = (index: number) => {
    const track = tracks[index];
    const audioUrl = track?.tracks.audio_url || track?.tracks.preview_url;

    if (!audioUrl) {
      if (track?.tracks.spotify_url) {
        window.open(track.tracks.spotify_url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (currentTrackIndex === index) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
      setProgress(0);
      setCurrentTime(0);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        audioRef.current.play().catch(console.error);
      }
    }
  };

  const handlePlayAll = () => {
    const firstAudioIndex = tracks.findIndex(t => t.tracks.audio_url || t.tracks.preview_url);
    if (firstAudioIndex !== -1) {
      playTrack(firstAudioIndex);
    } else {
      const firstSpotifyIndex = tracks.findIndex(t => t.tracks.spotify_url);
      if (firstSpotifyIndex !== -1) {
        playTrack(firstSpotifyIndex);
      }
    }
  };

  const handlePrevious = () => {
    if (currentTrackIndex !== null && currentTrackIndex > 0) {
      playTrack(currentTrackIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentTrackIndex !== null && currentTrackIndex < tracks.length - 1) {
      playTrack(currentTrackIndex + 1);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalDuration = (): string => {
    const totalSeconds = tracks.reduce((sum, pt) => sum + (pt.tracks.duration || 0), 0);
    const mins = Math.floor(totalSeconds / 60);
    return `${mins} min`;
  };

  const handleShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getTrackCover = (track: PlaylistTrack) => {
    return track.albumInfo?.cover_url || playlist?.cover_url;
  };

  // --- Loading ---
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <LoadingSpinner fullScreen={false} />
      </div>
    );
  }

  // --- Error ---
  if (error && !isPasswordProtected) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
        <header style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-6xl mx-auto px-6 py-4">
            <img src="/The Manager_Logo_PNG-2.png" alt="The Manager" className="h-5 object-contain" style={{ filter: 'invert(1)' }} />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <img src="/tm-vinil-negro_(2).png" alt="Not Found" className="mx-auto h-16 w-16 object-contain opacity-30 mb-6" style={{ filter: 'invert(1)' }} />
            <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--t1)' }}>Playlist Not Found</h1>
            <p className="text-sm" style={{ color: 'var(--t3)' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Password Gate ---
  if (isPasswordProtected && !isUnlocked) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
        <header style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-6xl mx-auto px-6 py-4">
            <img src="/The Manager_Logo_PNG-2.png" alt="The Manager" className="h-5 object-contain" style={{ filter: 'invert(1)' }} />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                <Lock className="w-6 h-6" style={{ color: 'var(--t2)' }} />
              </div>
              <h1 className="text-lg font-semibold mb-1" style={{ color: 'var(--t1)' }}>{playlist?.title}</h1>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                Password Required
              </p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                className="w-full px-4 py-3 text-center text-lg tracking-widest"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border)' }}
                placeholder="****"
                required
                autoFocus
              />
              {error && (
                <p className="text-xs text-center" style={{ color: 'var(--status-red)' }}>{error}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 text-sm font-medium uppercase tracking-wide transition-colors"
                style={{ backgroundColor: 'var(--brand-1)', color: '#fff', fontFamily: 'var(--font-mono)' }}
              >
                Unlock
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Playlist View ---
  const hasCover = !!playlist?.cover_url;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <audio ref={audioRef} preload="auto" />

      {/* Hero Section */}
      <div className="relative" style={{ minHeight: '420px' }}>
        {/* Background: blurred cover or gradient */}
        {hasCover && (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={playlist!.cover_url!}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: 'blur(60px) brightness(0.3) saturate(1.5)', transform: 'scale(1.3)' }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(12,12,12,0.4) 0%, var(--bg) 100%)' }} />
          </div>
        )}
        {!hasCover && (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%)' }} />
        )}

        {/* Header */}
        <div className="relative z-10">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <img src="/The Manager_Logo_PNG-2.png" alt="The Manager" className="h-5 object-contain" style={{ filter: 'invert(1)' }} />
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.15em' }}>
              Playlist
            </span>
          </div>
        </div>

        {/* Playlist Info */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-8 pb-10">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-end">
            {/* Cover Art */}
            <div className="flex-shrink-0 relative group">
              <div
                className="w-52 h-52 md:w-60 md:h-60 overflow-hidden"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {hasCover ? (
                  <img src={playlist!.cover_url!} alt={playlist?.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
                    <img src="/TM2.png" alt="TM" className="w-20 h-20 object-contain" style={{ filter: 'invert(1)', opacity: 0.15 }} />
                  </div>
                )}
              </div>
              {/* Play overlay */}
              {tracks.some(t => t.tracks.audio_url || t.tracks.preview_url || t.tracks.spotify_url) && (
                <button
                  onClick={handlePlayAll}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                  style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                >
                  <img src="/pixel-play.svg" alt="Play" className="w-16 h-16" />
                </button>
              )}
            </div>

            {/* Text Info */}
            <div className="flex-1 text-center md:text-left pb-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight" style={{ color: 'var(--t1)' }}>
                {playlist?.title}
              </h1>
              {playlist?.description && (
                <div className="text-sm mb-4 max-w-lg opacity-70" style={{ color: 'var(--t2)' }} dangerouslySetInnerHTML={{ __html: playlist.description }} />
              )}
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                  {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
                </span>
                <span style={{ color: 'var(--t3)' }}>/</span>
                <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                  {formatTotalDuration()}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-5 justify-center md:justify-start">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wide transition-all duration-[120ms]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--t2)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--t3)'; e.currentTarget.style.color = 'var(--t1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--t2)'; }}
                >
                  <img src="/TM-ArrowLeft-negro.svg" alt="" className="pxi-sm icon-white" />
                  Back
                </button>

                {tracks.some(t => t.tracks.audio_url || t.tracks.preview_url) && (
                  <button
                    onClick={handlePlayAll}
                    className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wide transition-all duration-[120ms]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: '#fff',
                      backgroundColor: 'var(--brand-1)',
                      border: '1px solid var(--brand-1)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    <img src="/TM-Play-negro.svg" alt="" className="pxi-sm" style={{ filter: 'brightness(0) invert(1)' }} />
                    Play All
                  </button>
                )}

                <button
                  onClick={handleShareLink}
                  className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wide transition-all duration-[120ms]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: copiedLink ? 'var(--brand-1)' : 'var(--t2)',
                    border: `1px solid ${copiedLink ? 'var(--brand-1)' : 'var(--border)'}`,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => { if (!copiedLink) { e.currentTarget.style.borderColor = 'var(--t3)'; e.currentTarget.style.color = 'var(--t1)'; } }}
                  onMouseLeave={(e) => { if (!copiedLink) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--t2)'; } }}
                >
                  {copiedLink ? (
                    <>
                      <img src="/The Manager_Iconografia-11.svg" alt="" className="pxi-sm" style={{ filter: 'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(120deg)' }} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <img src="/TM-Share-negro.svg" alt="" className="pxi-sm icon-white" />
                      Share
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Track List */}
      <main className="flex-1 pb-32">
        <div className="max-w-5xl mx-auto px-6">
          {tracks.length === 0 ? (
            <div className="py-20 text-center">
              <img src="/tm-vinil-negro_(2).png" alt="Empty" className="mx-auto h-10 w-10 object-contain opacity-20 mb-3" style={{ filter: 'invert(1)' }} />
              <p className="text-sm" style={{ color: 'var(--t3)' }}>This playlist is empty</p>
            </div>
          ) : (
            <div>
              {/* Column Headers */}
              <div
                className="hidden md:grid items-center py-2 mb-1"
                style={{
                  gridTemplateColumns: '40px 1fr auto',
                  gap: '16px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span className="text-xs uppercase tracking-wide text-right" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>#</span>
                <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>Title</span>
                <span className="text-xs uppercase tracking-wide pr-1" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>Duration</span>
              </div>

              {/* Tracks */}
              {tracks.map((pt, index) => {
                const hasAudio = !!(pt.tracks.audio_url || pt.tracks.preview_url);
                const hasSpotify = !!(pt.tracks.spotify_url);
                const isPlayable = hasAudio || hasSpotify;
                const isActive = currentTrackIndex === index;

                return (
                  <div
                    key={pt.position}
                    onClick={() => isPlayable && playTrack(index)}
                    className="group"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr auto',
                      gap: '16px',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--border)',
                      cursor: isPlayable ? 'pointer' : 'default',
                      opacity: isPlayable ? 1 : 0.4,
                      transition: 'background-color 120ms',
                      marginLeft: '-8px',
                      marginRight: '-8px',
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      borderRadius: 0,
                    }}
                    onMouseEnter={(e) => { if (isPlayable) e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {/* Track Number / EQ bars */}
                    <div className="flex items-center justify-end">
                      {isActive && isPlaying ? (
                        <span className="eq-bars">
                          <span className="eq-bar" />
                          <span className="eq-bar" />
                          <span className="eq-bar" />
                        </span>
                      ) : isActive && !isPlaying ? (
                        <span className="eq-bars paused">
                          <span className="eq-bar" />
                          <span className="eq-bar" />
                          <span className="eq-bar" />
                        </span>
                      ) : isPlayable ? (
                        <>
                          <span className="group-hover:hidden text-sm" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                            {String(pt.position + 1).padStart(2, '0')}
                          </span>
                          <img src="/pixel-play.svg" alt="Play" className="w-4 h-4 hidden group-hover:block" />
                        </>
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                          {String(pt.position + 1).padStart(2, '0')}
                        </span>
                      )}
                    </div>

                    {/* Title + Artist */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: isActive ? 'var(--brand-1)' : 'var(--t1)' }}
                        >
                          {pt.tracks.title}
                        </p>
                        <div className="flex items-center gap-2">
                          {pt.albumInfo?.artist_name && (
                            <p className="text-xs truncate" style={{ color: 'var(--t3)' }}>
                              {pt.albumInfo.artist_name}
                            </p>
                          )}
                          {hasSpotify && !hasAudio && (
                            <span className="text-xs flex-shrink-0" style={{ color: 'var(--t3)' }}>· opens Spotify</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="text-sm pr-1" style={{ color: isActive ? 'var(--brand-1)' : 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                      {formatDuration(pt.tracks.duration || 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 mb-8 flex items-center justify-center gap-2">
            <img src="/TM2.png" alt="TM" className="w-4 h-4 object-contain" style={{ filter: 'invert(1)', opacity: 0.2 }} />
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)', opacity: 0.4, letterSpacing: '0.15em' }}>
              The Manager
            </span>
          </div>
        </div>
      </main>

      {/* Bottom Player */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-50" style={{ backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          {/* Progress bar */}
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            className="h-1 cursor-pointer group/progress"
            style={{ backgroundColor: 'var(--surface-3)' }}
          >
            <div
              className="h-full relative"
              style={{ width: `${progress}%`, backgroundColor: 'var(--brand-1)', transition: 'width 100ms linear' }}
            >
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 opacity-0 group-hover/progress:opacity-100 transition-opacity"
                style={{ backgroundColor: 'var(--brand-1)', borderRadius: '50%' }}
              />
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Track Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0 max-w-xs">
                <div className="w-10 h-10 flex-shrink-0 overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
                  {getTrackCover(currentTrack) ? (
                    <img src={getTrackCover(currentTrack)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <img src="/TM2.png" alt="" className="w-4 h-4 object-contain" style={{ filter: 'invert(1)', opacity: 0.2 }} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium" style={{ color: 'var(--t1)' }}>
                    {currentTrack.tracks.title}
                  </div>
                  {currentTrack.albumInfo?.artist_name && (
                    <div className="truncate text-xs" style={{ color: 'var(--t3)' }}>
                      {currentTrack.albumInfo.artist_name}
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentTrackIndex === 0}
                  className="p-2 transition-colors disabled:opacity-20"
                  style={{ color: 'var(--t2)' }}
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 flex items-center justify-center transition-colors"
                  style={{ backgroundColor: 'var(--t1)', borderRadius: '50%' }}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" style={{ color: 'var(--bg)', fill: 'var(--bg)' }} />
                  ) : (
                    <img src="/pixel-play.svg" alt="Play" className="w-4 h-4" style={{ filter: 'brightness(0)' }} />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentTrackIndex === tracks.length - 1}
                  className="p-2 transition-colors disabled:opacity-20"
                  style={{ color: 'var(--t2)' }}
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Time + Volume */}
              <div className="flex items-center gap-4 flex-1 justify-end max-w-xs">
                <span className="text-xs tabular-nums" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <div className="flex items-center gap-1 group/volume">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 transition-colors"
                    style={{ color: 'var(--t3)' }}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  <div className="relative w-0 group-hover/volume:w-16 transition-all duration-200 overflow-hidden">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const newVolume = parseFloat(e.target.value);
                        setVolume(newVolume);
                        setIsMuted(newVolume === 0);
                      }}
                      className="w-16 h-0.5 appearance-none cursor-pointer"
                      style={{
                        backgroundColor: 'var(--surface-3)',
                        borderRadius: 0,
                        accentColor: 'var(--brand-1)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
