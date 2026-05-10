import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channelName: string;
  videoId: string;
  audioUrl?: string;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playlist: Track[];
  playlistIndex: number;

  // Actions
  setCurrentTrack: (track: Track) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setPlaylist: (tracks: Track[], startIndex?: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  playTrack: (track: Track, tracks?: Track[], index?: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  playlist: [],
  playlistIndex: -1,

  setCurrentTrack: (track) => set({ currentTrack: track }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setCurrentTime: (currentTime) => set({ currentTime }),

  setDuration: (duration) => set({ duration }),

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

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
    });
  },

  playTrack: (track, tracks, index) => {
    if (tracks && index !== undefined) {
      set({
        currentTrack: track,
        playlist: tracks,
        playlistIndex: index,
        isPlaying: true,
        currentTime: 0,
      });
    } else {
      set({
        currentTrack: track,
        isPlaying: true,
        currentTime: 0,
      });
    }
  },
}));