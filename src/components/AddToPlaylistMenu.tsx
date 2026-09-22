import { useState } from 'react';
import { Check, ListPlus, Plus } from 'lucide-react';
import { usePlaylistStore } from '@/store/playlist-store';
import type { Track } from '@/store/player-store';
import { cn } from '@/lib/utils';

/**
 * Floating "save to playlist" panel. Render inside a `relative` parent —
 * it positions itself absolute top-right with a backdrop that closes it.
 */
export default function AddToPlaylistMenu({
  track,
  onClose,
}: {
  track: Track;
  onClose: () => void;
}) {
  const { playlists, createPlaylist, addTrack } = usePlaylistStore();
  const [newName, setNewName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const handleAdd = (playlistId: string, playlistName: string) => {
    const result = addTrack(playlistId, track);
    setNotice(
      result === 'added'
        ? `Saved to “${playlistName}”`
        : result === 'duplicate'
          ? 'Already in that playlist'
          : 'Playlist not found'
    );
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const id = createPlaylist(name);
    addTrack(id, track);
    setNewName('');
    setNotice(`Created “${name}”`);
  };

  return (
    <>
      <button
        aria-label="Close"
        className="fixed inset-0 z-20 cursor-default bg-black/40"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        className="absolute right-2 top-2 z-30 w-60 rounded-2xl liquid-glass p-2 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        <p className="flex items-center gap-1.5 px-2.5 pt-1.5 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-mist-dark">
          <ListPlus size={13} className="text-brand-light" />
          Save to playlist
        </p>

        <div className="max-h-44 overflow-y-auto space-y-0.5">
          {playlists.length === 0 && (
            <p className="px-2.5 py-2 text-xs text-mist-dark">
              No playlists yet — create one below.
            </p>
          )}
          {playlists.map((p) => {
            const saved = p.tracks.some((t) => t.id === track.id);
            return (
              <button
                key={p.id}
                onClick={() => handleAdd(p.id, p.name)}
                className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-white/[0.07] transition-colors"
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-md flex items-center justify-center shrink-0 border',
                    saved
                      ? 'bg-brand border-brand text-ink-950'
                      : 'border-white/20 text-transparent'
                  )}
                >
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="flex-1 min-w-0 truncate text-white font-medium">
                  {p.name}
                </span>
                <span className="text-[11px] text-mist-dark tabular-nums">
                  {p.tracks.length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-white/10">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
            placeholder="New playlist…"
            maxLength={60}
            className="flex-1 min-w-0 rounded-xl liquid-input px-2.5 py-1.5 text-[13px] text-white outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="relative p-2 rounded-xl overflow-hidden bg-gradient-to-br from-brand-light to-brand-dark text-ink-950 ring-1 ring-white/30 disabled:opacity-30 hover:shadow-glow transition-all"
            aria-label="Create playlist"
          >
            <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-1.5 h-1/2 rounded-full bg-gradient-to-b from-white/40 to-transparent" />
            <Plus size={15} strokeWidth={2.5} />
          </button>
        </div>

        {notice && (
          <p className="px-2.5 pt-1.5 text-[11px] font-semibold text-brand-light truncate">
            {notice}
          </p>
        )}
      </div>
    </>
  );
}
