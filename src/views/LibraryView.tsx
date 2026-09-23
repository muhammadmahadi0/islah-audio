import { useState, useEffect } from 'react';
import { usePlayerStore, type Track } from '@/store/player-store';
import { usePlaylistStore, type SavedPlaylist } from '@/store/playlist-store';
import { useChannelStore } from '@/store/channel-store';
import {
  Music,
  Clock,
  Heart,
  ListMusic,
  ListVideo,
  Plus,
  Trash2,
  Play,
  X,
  ChevronDown,
  Loader2,
  Youtube,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchJson } from '@/lib/fetch-timeout';

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function EqBars() {
  return (
    <span className="flex items-end gap-[3px] h-4 text-brand-light shrink-0 pr-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="eq-bar h-full"
          style={{ animationDelay: `${i * 0.22}s` }}
        />
      ))}
    </span>
  );
}

function TrackRow({  track,
  index,
  showIndex = true,
  onPlay,
  onRemove,
  isActive,
  isPlaying,
}: {
  track: Track;
  index: number;
  showIndex?: boolean;
  onPlay: () => void;
  onRemove?: () => void;
  isActive: boolean;
  isPlaying: boolean;
}) {
  return (
    <div
      onClick={onPlay}
      className={cn(
        'flex items-center gap-3.5 p-3 cursor-pointer transition-all rounded-2xl cv-row',
        isActive
          ? 'liquid-chip ring-1 ring-brand/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
          : 'hover:bg-white/[0.05] border border-transparent'
      )}
    >
      {showIndex && (
        <span className="w-6 text-center text-xs font-bold text-mist-dark tabular-nums shrink-0">
          {index + 1}
        </span>
      )}
      <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-white/[0.06] ring-1 ring-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt={track.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={18} className="text-brand-light" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold truncate', isActive ? 'text-brand-light' : 'text-white')}>
          {track.title}
        </p>
        <p className="text-mist-dark text-xs truncate">{track.channelName}</p>
      </div>
      <span className="text-xs font-medium text-mist-dark tabular-nums shrink-0">
        {formatDuration(track.duration)}
      </span>
      {isActive && isPlaying && <EqBars />}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 rounded-lg text-mist-dark hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
          aria-label="Remove from playlist"
          title="Remove"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function PlaylistCard({ playlist }: { playlist: SavedPlaylist }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { deletePlaylist, removeTrack } = usePlaylistStore();
  const { playTrack, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();

  const totalSeconds = playlist.tracks.reduce((s, t) => s + (t.duration || 0), 0);
  const cover = playlist.tracks[0]?.thumbnail;

  const playAll = () => {
    if (playlist.tracks.length === 0) return;
    playTrack(playlist.tracks[0], playlist.tracks, 0);
  };

  const playOne = (track: Track, index: number) => {
    if (currentTrack?.id === track.id) setIsPlaying(!isPlaying);
    else playTrack(track, playlist.tracks, index);
  };

  return (
    <div className="relative liquid-glass rounded-3xl p-2 overflow-hidden">
      <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="flex items-center gap-3.5 p-3.5">
        <div className="w-14 h-14 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-deep to-ink-700 ring-1 ring-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
          {cover ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ListVideo size={22} className="text-brand-light" />
            </div>
          )}
        </div>
        <button onClick={() => setExpanded((v) => !v)} className="flex-1 min-w-0 text-left">
          <p className="text-white font-bold truncate">{playlist.name}</p>
          <p className="text-mist-dark text-xs mt-0.5">
            {playlist.tracks.length} track{playlist.tracks.length === 1 ? '' : 's'}
            {totalSeconds > 0 && ` • ${formatDuration(totalSeconds)}`}
          </p>
        </button>
        {playlist.tracks.length > 0 && (
          <button
            onClick={playAll}
            className="liquid-gold w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0"
            aria-label={`Play ${playlist.name}`}
          >
            <Play size={16} fill="currentColor" className="ml-0.5" />
          </button>
        )}
        {confirmDelete ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => deletePlaylist(playlist.id)}
              className="px-2.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-500 text-xs font-bold"
            >
              Delete?
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="p-1.5 rounded-lg text-mist-dark hover:text-white"
              aria-label="Cancel"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-xl text-mist-dark hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
            aria-label="Delete playlist"
          >
            <Trash2 size={16} />
          </button>
        )}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-2 rounded-xl text-mist-dark hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <ChevronDown size={17} className={cn('transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.06]">
          {playlist.tracks.length === 0 ? (
            <p className="px-4 py-5 text-[13px] text-mist-dark text-center">
              Empty playlist — tap <Plus size={12} className="inline" /> on any lecture to add tracks.
            </p>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {playlist.tracks.map((t, i) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  index={i}
                  showIndex={false}
                  onPlay={() => playOne(t, i)}
                  onRemove={() => removeTrack(playlist.id, t.id)}
                  isActive={currentTrack?.id === t.id}
                  isPlaying={isPlaying}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface ChannelPlaylist {
  id: string;
  title: string;
  thumbnail: string;
  itemCount: number;
}

/** A real YouTube playlist from the channel — items lazy-load on expand. */
function ChannelPlaylistCard({ playlist }: { playlist: ChannelPlaylist }) {
  const [expanded, setExpanded] = useState(false);
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadErrorMsg, setLoadErrorMsg] = useState('');
  const { playTrack, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();

  const load = async (): Promise<Track[]> => {
    setIsLoading(true);
    setLoadFailed(false);
    setLoadErrorMsg('');
    try {
      // NOTE: playlist ID goes in the path — query strings are dropped
      // by our hosting before function invocation.
      const data = await fetchJson(`/api/playlist-items/${playlist.id}`, 20000);
      if (data.success && Array.isArray(data.videos)) {
        const mapped: Track[] = data.videos.map((v: any) => ({
          id: v.videoId || v.id,
          title: v.title,
          thumbnail: v.thumbnail,
          duration: v.duration || 0,
          channelName: 'Islah',
          videoId: v.videoId || v.id,
        }));
        setTracks(mapped);
        return mapped;
      }
      throw new Error(data.error || 'Bad playlist response');
    } catch (error) {
      console.error('Playlist items load error:', error);
      setLoadFailed(true);
      setLoadErrorMsg(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
    // Never leave tracks null — that would spin the loader forever.
    setTracks([]);
    return [];
  };

  const ensureTracks = async (): Promise<Track[]> => {
    if (tracks) return tracks;
    return load();
  };

  const reload = () => {
    setTracks(null);
    load();
  };

  const toggle = () => {
    if (!expanded) ensureTracks();
    setExpanded((v) => !v);
  };

  const playAll = async () => {
    const list = await ensureTracks();
    if (list.length === 0) return;
    if (!expanded) setExpanded(true);
    playTrack(list[0], list, 0);
  };

  const playOne = (track: Track, index: number) => {
    if (!tracks) return;
    if (currentTrack?.id === track.id) setIsPlaying(!isPlaying);
    else playTrack(track, tracks, index);
  };

  return (
    <div className="relative liquid-glass rounded-3xl p-2 overflow-hidden">
      <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="flex items-center gap-3.5 p-3.5">
        <div className="relative w-14 h-14 shrink-0 rounded-2xl overflow-hidden bg-white/[0.06] ring-1 ring-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
          {playlist.thumbnail ? (
            <img src={playlist.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ListVideo size={22} className="text-brand-light" />
            </div>
          )}
          <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] font-bold text-[#FFFFFF] text-center py-0.5 tabular-nums">
            {playlist.itemCount}
          </span>
        </div>
        <button onClick={toggle} className="flex-1 min-w-0 text-left">
          <p className="flex items-center gap-1.5 text-white font-bold truncate">
            <Youtube size={15} className="text-red-400 shrink-0" />
            <span className="truncate">{playlist.title}</span>
          </p>
          <p className="text-mist-dark text-xs mt-0.5">
            YouTube playlist • {playlist.itemCount} video{playlist.itemCount === 1 ? '' : 's'}
          </p>
        </button>
        <button
          onClick={playAll}
          disabled={isLoading}
          className="liquid-gold w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0 disabled:opacity-40"
          aria-label={`Play ${playlist.title}`}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Play size={16} fill="currentColor" className="ml-0.5" />
          )}
        </button>
        <button
          onClick={toggle}
          className="p-2 rounded-xl text-mist-dark hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <ChevronDown size={17} className={cn('transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.06]">
          {isLoading || tracks === null ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={22} className="animate-spin text-brand-light" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="px-4 py-5 text-center">
              <p className="text-[13px] text-mist-dark">
                {loadFailed
                  ? 'Couldn’t load this playlist.'
                  : 'This playlist is empty or unavailable.'}
              </p>
              {loadFailed && loadErrorMsg && (
                <p className="text-[11px] text-mist-dark/80 mt-1 break-words">
                  {loadErrorMsg}
                </p>
              )}
              {loadFailed && (
                <button
                  onClick={reload}
                  className="mt-2.5 px-5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-xs font-bold text-white hover:border-brand/60 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {tracks.map((t, i) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  index={i}
                  showIndex={false}
                  onPlay={() => playOne(t, i)}
                  isActive={currentTrack?.id === t.id}
                  isPlaying={isPlaying}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LibraryView({
  initialYtPlaylists,
}: {
  // Server-rendered playlists keyed by channel ID (all channels, no
  // client fetch needed). Null entry = server fetch failed for it.
  initialYtPlaylists: Record<string, ChannelPlaylist[] | null>;
}) {
  const [newName, setNewName] = useState('');
  const [ytPlaylists, setYtPlaylists] = useState<ChannelPlaylist[] | null>(null);
  const [ytForChannel, setYtForChannel] = useState('');
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState(false);
  const [ytErrorMsg, setYtErrorMsg] = useState('');
  const { playlists, createPlaylist } = usePlaylistStore();
  const { channelId } = useChannelStore();

  // Channel playlists follow the active channel, served from the
  // server-rendered map. Client fetch is only a fallback when the server
  // had none for that channel.
  useEffect(() => {
    if (ytLoading) return;
    if (ytForChannel === channelId && ytPlaylists !== null) return;
    if (ytForChannel !== channelId) {
      const server = initialYtPlaylists[channelId] ?? null;
      setYtForChannel(channelId);
      setYtError(false);
      setYtErrorMsg('');
      setYtPlaylists(server);
      if (server) return;
    }
    let cancelled = false;
    (async () => {
      setYtLoading(true);
      setYtError(false);
      setYtErrorMsg('');
      try {
        const data = await fetchJson(`/api/playlists/${channelId}`, 20000);
        if (!cancelled && data.success && Array.isArray(data.playlists)) {
          setYtPlaylists(data.playlists);
        } else if (!cancelled) {
          throw new Error(data.error || 'Bad playlists response');
        }
      } catch (error) {
        console.error('Channel playlists load error:', error);
        if (!cancelled) {
          setYtError(true);
          setYtErrorMsg(error instanceof Error ? error.message : 'Unknown error');
          setYtPlaylists([]);
        }
      } finally {
        if (!cancelled) setYtLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ytPlaylists, ytLoading, ytForChannel, channelId, initialYtPlaylists]);

  const retryYtPlaylists = () => {
    setYtError(false);
    setYtPlaylists(null);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createPlaylist(newName.trim());
    setNewName('');
  };

  return (
    <main className="pb-44 md:pb-36">
      <div className="mx-auto max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
        {/* Header card */}
        <section className="relative liquid-glass rounded-[28px] p-6 md:p-8 mb-5 overflow-hidden">
          <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/[0.12] via-transparent to-transparent" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="relative flex items-center gap-4">
            <span className="liquid-gold w-14 h-14 rounded-2xl flex items-center justify-center shrink-0">
              <ListMusic size={26} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold">
                Collection
              </p>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Your Library
              </h1>
              <p className="text-[13px] text-mist mt-0.5">
                {playlists.length} playlist{playlists.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </section>

        {/* Playlists live here — the playback queue moved to the
            expanded player's Up-next dropdown */}
        <div>
            {/* Channel's YouTube playlists */}
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold mb-2.5">
              From YouTube
            </p>
            {ytLoading || ytPlaylists === null ? (
              <div className="flex items-center justify-center py-8 liquid-glass rounded-3xl">
                <Loader2 size={22} className="animate-spin text-brand-light" />
              </div>
            ) : ytPlaylists.length > 0 ? (
              <div className="space-y-3 mb-7">
                {ytPlaylists.map((p) => (
                  <ChannelPlaylistCard key={p.id} playlist={p} />
                ))}
              </div>
            ) : ytError ? (
              <div className="relative liquid-glass rounded-3xl px-4 py-6 text-center mb-7 overflow-hidden">
                <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                <p className="text-[13px] text-mist-dark mb-1">
                  Couldn’t load channel playlists.
                </p>
                {ytErrorMsg && (
                  <p className="text-[11px] text-mist-dark/80 mb-3 break-words">
                    {ytErrorMsg}
                  </p>
                )}
                <button
                  onClick={retryYtPlaylists}
                  className="relative px-5 py-2 rounded-full liquid-glass text-sm font-bold text-white transition-all overflow-hidden"
                >
                  <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                  Retry
                </button>
              </div>
            ) : (
              <p className="text-[13px] text-mist-dark liquid-glass rounded-3xl px-4 py-5 text-center mb-7">
                No public playlists on this channel yet.
              </p>
            )}

            {/* User playlists */}
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold mb-2.5">
              Your Playlists
            </p>
            <div className="flex items-center gap-2 mb-4">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
                placeholder="New playlist name…"
                maxLength={60}
                className="flex-1 min-w-0 rounded-2xl liquid-input px-4 py-2.5 text-sm text-white outline-none transition-all"
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="liquid-gold flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold disabled:opacity-30 transition-all shrink-0"
              >
                <Plus size={16} strokeWidth={2.5} />
                Create
              </button>
            </div>

            {playlists.length > 0 ? (
              <div className="space-y-3">
                {playlists.map((p) => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
              </div>
            ) : (
              <div className="relative text-center py-16 liquid-glass rounded-[28px] overflow-hidden">
                <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                <span className="relative w-16 h-16 rounded-full bg-white/[0.07] backdrop-blur-md border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-center mx-auto mb-4">
                  <Heart size={26} className="text-gold-light" />
                </span>
                <p className="text-white font-bold text-lg">No playlists yet</p>
                <p className="text-mist-dark text-sm mt-1 max-w-xs mx-auto">
                  Create one above, or tap <Plus size={12} className="inline" /> on any
                  lecture to save it to a playlist
                </p>
              </div>
            )}
          </div>

        {/* Info sections */}
        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          <div className="relative liquid-glass rounded-3xl p-5 overflow-hidden">
            <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <div className="flex items-center gap-2 mb-2">
              <Clock size={17} className="text-gold" />
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Recently Played
              </h2>
            </div>
            <p className="text-mist-dark text-[13px] leading-relaxed">
              Your listening history will appear here as you play more lectures.
            </p>
          </div>
          <div className="relative liquid-glass rounded-3xl p-5 overflow-hidden">
            <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <div className="flex items-center gap-2 mb-2">
              <Heart size={17} className="text-gold" />
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Saved Offline
              </h2>
            </div>
            <p className="text-mist-dark text-[13px] leading-relaxed">
              Your playlists are stored on this device and survive reloads.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
