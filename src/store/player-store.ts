import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channelName: string;
  videoId: string;
  audioUrl?: string;
  hlsUrl?: string;
  publishedAt?: string;
  description?: string;
}

interface PlayerState {
  // State
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playlist: Track[];
  playlistIndex: number;

  // Actions
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setPlaylist: (tracks: Track[], startIndex?: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  playTrack: (track: Track, tracks?: Track[], index?: number) => void;
  togglePlay: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Initial state
  currentTrack: null,
  isPlaying: false,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  playlist: [],
  playlistIndex: -1,

  // Actions
  setCurrentTrack: (track) => set({ currentTrack: track }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setCurrentTime: (currentTime) => set({ currentTime }),

  setDuration: (duration) => set({ duration }),

  setVolume: (volume) =>
    set({ volume: Math.max(0, Math.min(1, volume)) }),

  setPlaylist: (tracks, startIndex = 0) =>
    set({
      playlist: tracks,
      playlistIndex: startIndex,
      currentTrack: tracks[startIndex] || null,
    }),

  playNext: () => {
    const { playlist, playlistIndex } = get();
    if (playlist.length === 0) return;

    const nextIndex = (playlistIndex + 1) % playlist.length;
    const nextTrack = playlist[nextIndex];

    set({
      playlistIndex: nextIndex,
      currentTrack: nextTrack,
      currentTime: 0,
      isPlaying: true,
    });
  },

  playPrevious: () => {
    const { playlist, playlistIndex, currentTime } = get();
    if (playlist.length === 0) return;

    // If more than 3 seconds in, restart current track
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }

    const prevIndex = playlistIndex <= 0 ? playlist.length - 1 : playlistIndex - 1;
    const prevTrack = playlist[prevIndex];

    set({
      playlistIndex: prevIndex,
      currentTrack: prevTrack,
      currentTime: 0,
      isPlaying: true,
    });
  },

  playTrack: (track, tracks, index) => {
    if (tracks && index !== undefined) {
      set({
        currentTrack: track,
        playlist: tracks,
        playlistIndex: index,
        isPlaying: true,
        isLoading: true,
        currentTime: 0,
      });
    } else {
      set({
        currentTrack: track,
        isPlaying: true,
        isLoading: true,
        currentTime: 0,
      });
    }
  },

  togglePlay: () => {
    const { isPlaying, currentTrack } = get();
    if (currentTrack) {
      set({ isPlaying: !isPlaying });
    }
  },
}));