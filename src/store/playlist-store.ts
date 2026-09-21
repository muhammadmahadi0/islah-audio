import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Track } from './player-store';

export interface SavedPlaylist {
  id: string;
  name: string;
  createdAt: number;
  tracks: Track[];
}

interface PlaylistStore {
  playlists: SavedPlaylist[];
  createPlaylist: (name: string) => string;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addTrack: (playlistId: string, track: Track) => 'added' | 'duplicate' | 'missing';
  removeTrack: (playlistId: string, trackId: string) => void;
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const usePlaylistStore = create<PlaylistStore>()(
  persist(
    (set, get) => ({
      playlists: [],

      createPlaylist: (name) => {
        const clean = name.trim().slice(0, 60) || 'Untitled playlist';
        const id = newId();
        set((s) => ({
          playlists: [
            ...s.playlists,
            { id, name: clean, createdAt: Date.now(), tracks: [] },
          ],
        }));
        return id;
      },

      deletePlaylist: (id) =>
        set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),

      renamePlaylist: (id, name) => {
        const clean = name.trim().slice(0, 60);
        if (!clean) return;
        set((s) => ({
          playlists: s.playlists.map((p) => (p.id === id ? { ...p, name: clean } : p)),
        }));
      },

      addTrack: (playlistId, track) => {
        const playlist = get().playlists.find((p) => p.id === playlistId);
        if (!playlist) return 'missing';
        if (playlist.tracks.some((t) => t.id === track.id)) return 'duplicate';
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId ? { ...p, tracks: [...p.tracks, track] } : p
          ),
        }));
        return 'added';
      },

      removeTrack: (playlistId, trackId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) }
              : p
          ),
        })),
    }),
    {
      name: 'islah-playlists',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ playlists: s.playlists }) as PlaylistStore,
    }
  )
);
