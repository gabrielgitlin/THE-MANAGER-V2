import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

// Extend Window to accommodate the Spotify IFrame API
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
    SpotifyIframeApi?: SpotifyIFrameAPI;
  }
}
interface SpotifyIFrameAPI {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: SpotifyEmbedController) => void
  ) => void;
}
interface SpotifyEmbedController {
  play: () => void;
  pause: () => void;
  loadUri: (uri: string) => void;
  addListener: (event: string, callback: (e: any) => void) => void;
}

interface Track {
  id: number;
  title: string;
  artist: string;
  duration: string;
  audioUrl?: string;
  coverArt?: string;
  spotifyId?: string;
}

interface MusicPlayerProps {
  tracks: Track[];
  currentTrackIndex: number;
  onTrackChange: (index: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onClose: () => void;
}

export default function MusicPlayer({
  tracks,
  currentTrackIndex,
  onTrackChange,
  isPlaying,
  onPlayPause,
  onClose
}: MusicPlayerProps) {
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [spotifyApiReady, setSpotifyApiReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const spotifyEmbedRef = useRef<HTMLDivElement>(null);
  const spotifyControllerRef = useRef<SpotifyEmbedController | null>(null);

  const currentTrack = tracks[currentTrackIndex];
  const isSpotifyTrack = !currentTrack?.audioUrl && !!currentTrack?.spotifyId;

  // Load Spotify IFrame API once
  useEffect(() => {
    if (window.SpotifyIframeApi) {
      setSpotifyApiReady(true);
      return;
    }
    const prev = window.onSpotifyIframeApiReady;
    window.onSpotifyIframeApiReady = (api) => {
      window.SpotifyIframeApi = api;
      setSpotifyApiReady(true);
      if (prev) prev(api);
    };
    if (!document.querySelector('script[src*="open.spotify.com/embed/iframe-api"]')) {
      const script = document.createElement('script');
      script.src = 'https://open.spotify.com/embed/iframe-api/v1';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Mount/update Spotify embed when Spotify track becomes active
  useEffect(() => {
    if (!isSpotifyTrack || !spotifyApiReady || !spotifyEmbedRef.current) return;

    // Destroy previous controller
    spotifyControllerRef.current = null;
    spotifyEmbedRef.current.innerHTML = '';

    const el = document.createElement('div');
    spotifyEmbedRef.current.appendChild(el);

    window.SpotifyIframeApi!.createController(
      el,
      { uri: `spotify:track:${currentTrack!.spotifyId}`, width: '100%', height: 80 },
      (controller) => {
        spotifyControllerRef.current = controller;

        controller.addListener('playback_update', (e: any) => {
          const { isPaused, position, duration: dur } = e.data;
          // Detect end: paused after actually playing (position > 0) and at/near end
          if (isPaused && position > 1 && dur > 0 && Math.abs(position - dur) < 2) {
            if (currentTrackIndex < tracks.length - 1) {
              onTrackChange(currentTrackIndex + 1);
            } else {
              onPlayPause();
            }
          }
        });

        if (isPlaying) controller.play();
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.spotifyId, spotifyApiReady]);

  // Play/pause Spotify controller when isPlaying changes
  useEffect(() => {
    if (!isSpotifyTrack || !spotifyControllerRef.current) return;
    if (isPlaying) {
      spotifyControllerRef.current.play();
    } else {
      spotifyControllerRef.current.pause();
    }
  }, [isPlaying, isSpotifyTrack]);

  // HTML5 audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      setIsReady(true);
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const handleEnded = () => {
      if (currentTrackIndex < tracks.length - 1) {
        onTrackChange(currentTrackIndex + 1);
      } else {
        onPlayPause();
      }
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsReady(false);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadedmetadata', handleCanPlay);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadedmetadata', handleCanPlay);
    };
  }, [currentTrackIndex, tracks.length, onTrackChange, onPlayPause]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isSpotifyTrack) return;

    if (isPlaying && isReady) {
      audio.play().catch(error => console.error('Play error:', error));
    } else {
      audio.pause();
    }
  }, [isPlaying, isReady, isSpotifyTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    setIsReady(false);
    setProgress(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [currentTrack?.audioUrl]);

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handlePrevious = () => {
    if (tracks.length <= 1) return;
    onTrackChange(currentTrackIndex > 0 ? currentTrackIndex - 1 : tracks.length - 1);
  };

  const handleNext = () => {
    if (tracks.length <= 1) return;
    onTrackChange(currentTrackIndex < tracks.length - 1 ? currentTrackIndex + 1 : 0);
  };

  if (!currentTrack) return null;

  const hasAudio = !!currentTrack.audioUrl;

  return (
    <div style={{ borderRadius: 0, backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} className="fixed bottom-0 left-0 right-0 border-t shadow-lg z-50">
      {hasAudio && (
        <audio
          ref={audioRef}
          src={currentTrack.audioUrl}
          preload="auto"
        />
      )}

      {/* Hidden Spotify embed mount point — the IFrame API renders into this */}
      <div
        ref={spotifyEmbedRef}
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      />

      {/* Progress bar — only for HTML5 audio tracks */}
      {!isSpotifyTrack && (
        <div
          ref={progressBarRef}
          onClick={handleProgressClick}
          style={{ borderRadius: 0, backgroundColor: 'var(--surface-2)' }}
          className="absolute top-0 left-0 right-0 h-1 cursor-pointer group hover:h-1.5 transition-all duration-150"
        >
          <div
            className="h-full relative transition-all duration-100"
            style={{ width: `${progress}%`, backgroundColor: 'var(--brand-1)' }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md" style={{ backgroundColor: 'var(--brand-1)' }} />
          </div>
        </div>
      )}
      {/* Thin static bar placeholder for Spotify tracks */}
      {isSpotifyTrack && (
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: 'var(--surface-2)' }}
        >
          <div className="h-full animate-pulse" style={{ width: isPlaying ? '100%' : '0%', backgroundColor: 'var(--brand-1)', transition: 'width 0.3s' }} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-4 flex-1 min-w-0 max-w-xs">
            <div className="w-12 h-12 flex-shrink-0 shadow-md border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', borderRadius: 0, overflow: 'hidden' }}>
              {currentTrack.coverArt ? (
                <img
                  src={currentTrack.coverArt}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                  style={{ borderRadius: 0 }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <img src="/TM-Play-negro.svg" className="pxi-lg icon-muted" alt="Play" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold mb-0.5" style={{ color: 'var(--t1)' }}>
                {currentTrack.title}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="truncate text-sm" style={{ color: 'var(--t2)' }}>
                  {currentTrack.artist}
                </div>
                {isSpotifyTrack && (
                  <span className="text-xs flex-shrink-0 px-1.5 py-0.5 font-medium" style={{ backgroundColor: '#1DB954', color: '#fff', borderRadius: 2 }}>
                    Spotify
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevious}
              disabled={tracks.length <= 1}
              className="p-2 transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: 'var(--t1)' }}
              title="Previous track"
            >
              <img src="/TM-SkipBack-negro.svg" className="pxi-xl icon-white" alt="Previous" />
            </button>

            <button
              onClick={onPlayPause}
              disabled={!hasAudio && !isSpotifyTrack}
              style={{ borderRadius: '50%', backgroundColor: 'var(--brand-1)', borderColor: 'var(--brand-1)' }}
              className="p-3 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 border-2 aspect-square overflow-hidden"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <img src="/TM-Pause-negro.svg" className="pxi-xl icon-white" alt="Pause" />
              ) : (
                <img src="/TM-Play-negro.svg" className="pxi-xl icon-white" alt="Play" />
              )}
            </button>

            <button
              onClick={handleNext}
              disabled={tracks.length <= 1}
              className="p-2 transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: 'var(--t1)' }}
              title="Next track"
            >
              <img src="/TM-SkipFwd-negro.svg" className="pxi-xl icon-white" alt="Next" />
            </button>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end max-w-xs">
            {!isSpotifyTrack && (
              <>
                <span className="text-xs tabular-nums" style={{ color: 'var(--t2)' }}>
                  {formatTime(currentTime)}
                </span>
                <span className="text-xs" style={{ color: 'var(--t3)' }}>/</span>
                <span className="text-xs tabular-nums" style={{ color: 'var(--t2)' }}>
                  {formatTime(duration)}
                </span>
              </>
            )}

            <div className="flex items-center gap-2 ml-4 group/volume">
              <button
                onClick={toggleMute}
                className="p-2 transition-colors"
                style={{ color: 'var(--t1)' }}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" strokeWidth={2} />
                ) : (
                  <Volume2 className="w-5 h-5" strokeWidth={2} />
                )}
              </button>

              <div className="relative w-0 group-hover/volume:w-24 transition-all duration-200 ease-out overflow-hidden">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:transition-all
                    [&::-webkit-slider-thumb]:opacity-0
                    [&::-webkit-slider-thumb]:group-hover/volume:opacity-100
                    [&::-webkit-slider-thumb]:hover:scale-125
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-moz-range-thumb]:w-3
                    [&::-moz-range-thumb]:h-3
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:transition-all
                    [&::-moz-range-thumb]:opacity-0
                    [&::-moz-range-thumb]:group-hover/volume:opacity-100
                    [&::-moz-range-thumb]:hover:scale-125
                    [&::-moz-range-thumb]:shadow-md"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    '--webkit-slider-thumb-bg': 'var(--brand-1)',
                    '--moz-range-thumb-bg': 'var(--brand-1)'
                  } as any}
                />
                <div
                  className="absolute top-0 left-0 h-1 pointer-events-none transition-all duration-100"
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%`, backgroundColor: 'var(--brand-1)', borderRadius: 0 }}
                />
              </div>
            </div>

            <button
              onClick={onClose}
              className="ml-2 p-2 transition-colors"
              style={{ color: 'var(--t2)' }}
            >
              <img src="/TM-Close-negro.svg" className="pxi-lg icon-muted" alt="Close" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
