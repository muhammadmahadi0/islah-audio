import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEEK_EVENT } from '@/lib/yt-engine';

export interface Track {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channelName: string;
  videoId: string;
  audioUrl?: string;
  hlsUrl?: string;
  /** True for the live broadcast — duration is unknown, seeking disabled. */
  isLive?: boolean;
  /** Venue/place name for live + recording tracks (from islahbd.com). */
  location?: string;
  publishedAt?: string;
  description?: string;
}

interface PlayerState {
  // State (currentTrack/playlist/playlistIndex/volume persist to
  // localStorage `islah-player` so the mini-player survives page loads;
  // playback flags always rehydrate paused — browsers block autoplay)
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
  /** Stop playback entirely and dismiss the player (keeps the queue). */
  stop: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
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

    // If more than 3 seconds in, restart current track — and SEEK the
    // engines there too, so audio follows the progress bar. Both engines
    // (YT in MiniPlayer, <audio> in AudioPlayer) listen for SEEK_EVENT.
    if (currentTime > 3) {
      set({ currentTime: 0 });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SEEK_EVENT, { detail: 0 }));
      }
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

  stop: () =>
    set({
      currentTrack: null,
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      duration: 0,
      playlistIndex: -1,
    }),
    }),
    {
      name: 'islah-player',
      // Survive full page loads (Astro MPA nav): keep the track + queue +
      // volume so the mini-player stays visible on Search/Library/Boyan.
      // Playback state itself never resumes automatically (browser autoplay
      // policy) — rehydrate paused at 0, user taps to resume.
      partialize: (s) => ({
        currentTrack: s.currentTrack,
        playlist: s.playlist,
        playlistIndex: s.playlistIndex,
        volume: s.volume,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<PlayerState>),
        isPlaying: false,
        isLoading: false,
        currentTime: 0,
        duration: 0,
      }),
      // Progress ticks set() twice a second — without throttling, every tick
      // would JSON.stringify the whole queue (100+ tracks) into localStorage
      // and jank low-end phones. Trailing-edge 2s throttle: track/queue
      // changes still land promptly on pause/stop/nav.
      storage: {
        getItem: (name) => {
          try {
            const raw = localStorage.getItem(name);
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        },
        setItem: (() => {
          let timer: ReturnType<typeof setTimeout> | null = null;
          let pending: { name: string; value: unknown } | null = null;
          const flush = () => {
            timer = null;
            if (!pending) return;
            const { name, value } = pending;
            pending = null;
            try {
              localStorage.setItem(name, JSON.stringify(value));
            } catch {
              // Quota/private-mode — playback continues in memory.
            }
          };
          return (name: string, value: unknown) => {
            pending = { name, value };
            if (!timer) timer = setTimeout(flush, 2000);
          };
        })(),
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {
            // ignore
          }
        },
      },
    }
  )
);