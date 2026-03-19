import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Disc, Lock, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Clock } from 'lucide-react';
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
  };
  albumInfo?: {
    title: string;
    cover_url?: string;
    artist_name?: string;
  };
}

export default function SharedPlaylist() {
  const { shareToken } = useParams<{ shareToken: string }>();
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

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  useEffect(() => {
    // Wait for auth to finish loading before fetching playlist
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
      // Query by share_token and let RLS policies handle access control
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

      // Check if user is the owner (to skip password protection)
      const isOwner = user && data.user_id === user.id;

      setPlaylist(data);

      // If owner, skip password protection
      if (isOwner) {
        await fetchTracks(data.id);
      } else if (data.password_hash) {
        // Password protected - show password prompt
        setIsPasswordProtected(true);
        setIsLoading(false);
      } else {
        // Public with no password - load tracks
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
            preview_url
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
    const firstPlayableIndex = tracks.findIndex(t => t.tracks.audio_url || t.tracks.preview_url);
    if (firstPlayableIndex !== -1) {
      playTrack(firstPlayableIndex);
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

  const getTrackCover = (track: PlaylistTrack) => {
    return track.albumInfo?.cover_url || playlist?.cover_url;
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <LoadingSpinner fullScreen={false} />
      </div>
    );
  }

  if (error && !isPasswordProtected) {
    return (
      <div className="min-h-screen bg-beige flex flex-col">
        <header className="bg-white border-b border-black">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <img
              src="/The Manager_Logo_PNG-2.png"
              alt="The Manager"
              className="h-6 object-contain"
            />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white border border-black p-12 text-center max-w-md" style={{ borderTopLeftRadius: '16px' }}>
            <img src="/tm-vinil-negro_(2).png" alt="Not Found" className="mx-auto h-16 w-16 object-contain opacity-50 mb-4" />
            <h1 className="text-xl font-bold text-black mb-2">Playlist Not Found</h1>
            <p className="text-gray">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isPasswordProtected && !isUnlocked) {
    return (
      <div className="min-h-screen bg-beige flex flex-col">
        <header className="bg-white border-b border-black">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <img
              src="/The Manager_Logo_PNG-2.png"
              alt="The Manager"
              className="h-6 object-contain"
            />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white border border-black p-8 max-w-md w-full" style={{ borderTopLeftRadius: '16px' }}>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-black mx-auto mb-4 flex items-center justify-center" style={{ borderRadius: '50%' }}>
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-xl font-bold text-black mb-2">{playlist?.title}</h1>
              {playlist?.description && (
                <p className="text-gray text-sm">{playlist.description}</p>
              )}
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Enter Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-4 py-3 border border-black focus:ring-primary focus:border-primary text-center text-lg tracking-widest"
                  placeholder="****"
                  required
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-black text-white hover:bg-gray-800 transition-colors font-medium"
              >
                Unlock Playlist
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige flex flex-col">
      <audio ref={audioRef} preload="auto" />

      <header className="bg-white border-b border-black sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <img
            src="/The Manager_Logo_PNG-2.png"
            alt="The Manager"
            className="h-6 object-contain"
          />
          <span className="text-xs text-gray uppercase tracking-wider">Shared Playlist</span>
        </div>
      </header>

      <main className="flex-1 py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-black" style={{ borderTopLeftRadius: '16px' }}>
            <div className="p-8 border-b border-black">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0">
                  <div className="w-48 h-48 md:w-56 md:h-56 bg-beige overflow-hidden relative group mx-auto md:mx-0">
                    {playlist?.cover_url ? (
                      <img
                        src={playlist.cover_url}
                        alt={playlist.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <img src="/tm-vinil-negro_(2).png" alt="Playlist" className="w-16 h-16 object-contain opacity-50" />
                      </div>
                    )}
                    {tracks.some(t => t.tracks.audio_url || t.tracks.preview_url) && (
                      <button
                        onClick={handlePlayAll}
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all"
                      >
                        <div
                          className="w-16 h-16 bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 hover:bg-green"
                          style={{ borderRadius: '50%' }}
                        >
                          <Play className="w-7 h-7 fill-white ml-1" />
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <p className="text-xs text-gray uppercase tracking-wider mb-2">Playlist</p>
                  <h1 className="text-3xl md:text-4xl font-bold text-black mb-3">{playlist?.title}</h1>
                  {playlist?.description && (
                    <p className="text-gray mb-4 max-w-lg">{playlist.description}</p>
                  )}
                  <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray">
                    <span>{tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTotalDuration()}
                    </span>
                  </div>

                  {tracks.some(t => t.tracks.audio_url || t.tracks.preview_url) && (
                    <button
                      onClick={handlePlayAll}
                      className="mt-6 px-8 py-3 bg-primary text-white hover:bg-green transition-colors font-medium flex items-center gap-2 mx-auto md:mx-0"
                    >
                      <Play className="w-5 h-5 fill-white" />
                      Play All
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              {tracks.length === 0 ? (
                <div className="p-12 text-center">
                  <img src="/tm-vinil-negro_(2).png" alt="Empty" className="mx-auto h-12 w-12 object-contain opacity-50 mb-2" />
                  <p className="text-gray">This playlist is empty</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:grid grid-cols-[auto,1fr,auto] gap-4 px-8 py-3 border-b border-black bg-beige text-xs text-gray uppercase tracking-wider">
                    <div className="w-12">#</div>
                    <div>Title</div>
                    <div className="w-16 text-right">Duration</div>
                  </div>
                  {tracks.map((pt, index) => {
                    const hasAudio = pt.tracks.audio_url || pt.tracks.preview_url;
                    const isActive = currentTrackIndex === index;

                    return (
                      <div
                        key={pt.position}
                        onClick={() => hasAudio && playTrack(index)}
                        className={`grid grid-cols-[auto,1fr,auto] gap-4 px-8 py-4 border-b border-gray/20 last:border-b-0 transition-colors group ${
                          hasAudio ? 'cursor-pointer hover:bg-beige' : 'opacity-50'
                        } ${isActive ? 'bg-light-blue' : ''}`}
                      >
                        <div className="w-12 flex items-center">
                          {hasAudio ? (
                            <button className="w-8 h-8 flex items-center justify-center">
                              {isActive && isPlaying ? (
                                <Pause className="w-4 h-4 text-primary fill-primary" />
                              ) : (
                                <>
                                  <span className={`group-hover:hidden ${isActive ? 'text-primary font-medium' : 'text-gray'}`}>
                                    {pt.position + 1}
                                  </span>
                                  <Play className="w-4 h-4 text-primary hidden group-hover:block fill-primary" />
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-gray">{pt.position + 1}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 min-w-0">
                          {getTrackCover(pt) && (
                            <img
                              src={getTrackCover(pt)}
                              alt=""
                              className="w-10 h-10 object-cover flex-shrink-0 hidden sm:block"
                            />
                          )}
                          <div className="min-w-0">
                            <p className={`font-medium truncate ${isActive ? 'text-primary' : 'text-black'}`}>
                              {pt.tracks.title}
                            </p>
                            {pt.albumInfo?.artist_name && (
                              <p className="text-sm text-gray truncate">
                                {pt.albumInfo.artist_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="w-16 flex items-center justify-end text-sm text-gray">
                          {formatDuration(pt.tracks.duration || 0)}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray">
              Powered by <span className="font-medium text-black">The Manager</span>
            </p>
          </div>
        </div>
      </main>

      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black z-50">
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            className="absolute top-0 left-0 right-0 h-1 bg-gray/30 cursor-pointer group hover:h-1.5 transition-all -translate-y-full"
          >
            <div
              className="h-full bg-primary relative transition-all"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderRadius: '50%' }} />
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0 max-w-xs">
                <div className="w-12 h-12 flex-shrink-0 bg-beige overflow-hidden">
                  {getTrackCover(currentTrack) ? (
                    <img
                      src={getTrackCover(currentTrack)}
                      alt={currentTrack.tracks.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <img src="/tm-vinil-negro_(2).png" alt="Track" className="w-5 h-5 object-contain opacity-50" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-black">
                    {currentTrack.tracks.title}
                  </div>
                  {currentTrack.albumInfo?.artist_name && (
                    <div className="truncate text-sm text-gray">
                      {currentTrack.albumInfo.artist_name}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevious}
                  disabled={currentTrackIndex === 0}
                  className="p-2 text-black hover:text-primary transition-colors disabled:opacity-30"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
                  style={{ borderRadius: '50%' }}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-white" />
                  ) : (
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentTrackIndex === tracks.length - 1}
                  className="p-2 text-black hover:text-primary transition-colors disabled:opacity-30"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 flex-1 justify-end max-w-xs">
                <span className="text-xs text-gray tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <div className="flex items-center gap-2 group/volume">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 text-black hover:text-primary transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>

                  <div className="relative w-0 group-hover/volume:w-20 transition-all duration-200 overflow-hidden">
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
                      className="w-20 h-1 bg-gray/30 appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-3
                        [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:bg-black
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-3
                        [&::-moz-range-thumb]:h-3
                        [&::-moz-range-thumb]:bg-black
                        [&::-moz-range-thumb]:border-0
                        [&::-moz-range-thumb]:cursor-pointer"
                      style={{ borderRadius: 0 }}
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
