import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react';

interface Track {
  id: number;
  title: string;
  artist: string;
  duration: string;
  audioUrl?: string;
  coverArt?: string;
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

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const currentTrack = tracks[currentTrackIndex];

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
    if (!audio) return;

    if (isPlaying && isReady) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Play error:', error);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, isReady]);

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
    console.log('Previous clicked');
    console.log('Current index:', currentTrackIndex);
    console.log('Total tracks:', tracks.length);
    console.log('Tracks:', tracks);
    if (tracks.length <= 1) {
      console.log('Only one track, not changing');
      return;
    }
    const newIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : tracks.length - 1;
    console.log('Changing to index:', newIndex);
    onTrackChange(newIndex);
  };

  const handleNext = () => {
    console.log('Next clicked');
    console.log('Current index:', currentTrackIndex);
    console.log('Total tracks:', tracks.length);
    console.log('Tracks:', tracks);
    if (tracks.length <= 1) {
      console.log('Only one track, not changing');
      return;
    }
    const newIndex = currentTrackIndex < tracks.length - 1 ? currentTrackIndex + 1 : 0;
    console.log('Changing to index:', newIndex);
    onTrackChange(newIndex);
  };

  if (!currentTrack) return null;

  const hasAudio = !!currentTrack.audioUrl;

  return (
    <div style={{ borderRadius: 0 }} className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      {hasAudio && (
        <audio
          ref={audioRef}
          src={currentTrack.audioUrl}
          preload="auto"
        />
      )}

      <div
        ref={progressBarRef}
        onClick={handleProgressClick}
        style={{ borderRadius: 0 }}
        className="absolute top-0 left-0 right-0 h-1 bg-gray-300 cursor-pointer group hover:h-1.5 transition-all duration-150"
      >
        <div
          className="h-full bg-black relative transition-all duration-100"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-4 flex-1 min-w-0 max-w-xs">
            <div className="w-12 h-12 flex-shrink-0 bg-gray-100 shadow-md border border-gray-200" style={{ borderRadius: '8px', overflow: 'hidden' }}>
              {currentTrack.coverArt ? (
                <img
                  src={currentTrack.coverArt}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                  style={{ borderRadius: '7px' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-gray-900 mb-0.5">
                {currentTrack.title}
              </div>
              <div className="truncate text-sm text-gray-500">
                {currentTrack.artist}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevious}
              disabled={tracks.length <= 1}
              className="p-2 text-gray-700 hover:text-gray-900 transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous track"
            >
              <SkipBack className="w-6 h-6" strokeWidth={2} />
            </button>

            <button
              onClick={onPlayPause}
              disabled={!hasAudio || !isReady}
              style={{ borderRadius: '50%' }}
              className="p-3 bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 border-2 border-black aspect-square overflow-hidden"
              title={!hasAudio ? 'No audio available' : isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7" fill="currentColor" strokeWidth={0} />
              ) : (
                <Play className="w-7 h-7 ml-0.5" fill="currentColor" strokeWidth={0} />
              )}
            </button>

            <button
              onClick={handleNext}
              disabled={tracks.length <= 1}
              className="p-2 text-gray-700 hover:text-gray-900 transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next track"
            >
              <SkipForward className="w-6 h-6" strokeWidth={2} />
            </button>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end max-w-xs">
            <span className="text-xs text-gray-500 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-gray-400">/</span>
            <span className="text-xs text-gray-500 tabular-nums">
              {formatTime(duration)}
            </span>

            <div className="flex items-center gap-2 ml-4 group/volume">
              <button
                onClick={toggleMute}
                className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
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
                  className="w-24 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-black
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:transition-all
                    [&::-webkit-slider-thumb]:opacity-0
                    [&::-webkit-slider-thumb]:group-hover/volume:opacity-100
                    [&::-webkit-slider-thumb]:hover:scale-125
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-moz-range-thumb]:w-3
                    [&::-moz-range-thumb]:h-3
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-black
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:transition-all
                    [&::-moz-range-thumb]:opacity-0
                    [&::-moz-range-thumb]:group-hover/volume:opacity-100
                    [&::-moz-range-thumb]:hover:scale-125
                    [&::-moz-range-thumb]:shadow-md"
                />
                <div
                  className="absolute top-0 left-0 h-1 bg-black rounded-lg pointer-events-none transition-all duration-100"
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={onClose}
              className="ml-2 p-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
