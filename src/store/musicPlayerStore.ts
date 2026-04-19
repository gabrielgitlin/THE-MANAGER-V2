import { create } from 'zustand';

interface Track {
  id: number;
  title: string;
  artist: string;
  duration: string;
  audioUrl?: string;
  coverArt?: string;
  spotifyId?: string;
}

interface MusicPlayerState {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  hasInteracted: boolean;
  setTracks: (tracks: Track[]) => void;
  setCurrentTrackIndex: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setHasInteracted: (hasInteracted: boolean) => void;
  playTrack: (track: Track) => void;
  playAlbum: (tracks: Track[], startIndex?: number) => void;
  togglePlayPause: () => void;
}

export const useMusicPlayerStore = create<MusicPlayerState>((set, get) => ({
  tracks: [],
  currentTrackIndex: 0,
  isPlaying: false,
  hasInteracted: false,
  setTracks: (tracks) => set({ tracks }),
  setCurrentTrackIndex: (index) => set({ currentTrackIndex: index }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setHasInteracted: (hasInteracted) => set({ hasInteracted }),
  playTrack: (track) => {
    const { tracks } = get();
    const index = tracks.findIndex(t => t.id === track.id);
    if (index !== -1) {
      set({
        currentTrackIndex: index,
        isPlaying: true,
        hasInteracted: true
      });
    } else {
      // Add track to playlist if not already present
      set({
        tracks: [...tracks, track],
        currentTrackIndex: tracks.length,
        isPlaying: true,
        hasInteracted: true
      });
    }
  },
  playAlbum: (tracks, startIndex = 0) => {
    set({
      tracks,
      currentTrackIndex: startIndex,
      isPlaying: true,
      hasInteracted: true
    });
  },
  togglePlayPause: () => {
    const { isPlaying } = get();
    set({
      isPlaying: !isPlaying,
      hasInteracted: true
    });
  },
}));