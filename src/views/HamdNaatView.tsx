import { useState, useMemo, useEffect, useCallback } from 'react';
import { usePlayerStore, type Track } from '@/store/player-store';
import {
  Music,
  Loader2,
  X,
  ListPlus,
  MapPin,
  RefreshCw,
  Youtube,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AddToPlaylistMenu from '@/components/AddToPlaylistMenu';
import ShareButton from '@/components/ShareButton';
import { fetchJson } from '@/lib/fetch-timeout';
import {
  toHamdNaatTrack,
  formatHamdNaatDate,
  type HamdNaatItem,
} from '@/lib/hamdnaat';

type TypeFilter = 'all' | 'audio' | 'video';

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'audio', label: 'Audio' },
  { id: 'video', label: 'Video' },
];

function HamdNaatRow({
  item,
  onPlay,
  isActive,
  isPlaying,
}: {
  item: HamdNaatItem;
  onPlay: () => void;
  isActive: boolean;
  isPlaying: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isVideo = item.type === 'video';

  const sub = [item.artist, item.writingPlace, formatHamdNaatDate(item.createdAt)]
    .filter(Boolean)
    .join(' • ');
  const credits = [item.lyricist, item.composer].filter(Boolean).join(' • ');

  return (
    <div
      onClick={onPlay}
      className={cn(
        'relative flex items-center gap-3.5 p-3 cursor-pointer transition-all rounded-2xl cv-row',
        isActive
          ? 'liquid-chip ring-1 ring-brand/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
          : 'hover:bg-white/[0.05] border border-transparent'
      )}
    >
      <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-brand-deep to-ink-700 ring-1 ring-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center">
        {isVideo && item.youtubeId ? (
          <img
            src={`https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Music size={18} className="text-brand-light" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold leading-snug clamp-2',
            isActive ? 'text-brand-light' : 'text-white'
          )}
        >
          {isVideo && item.youtubeId ? (
            <a
              href={`/watch/${item.youtubeId}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline"
            >
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </p>
        {sub && <p className="text-mist-dark text-xs mt-0.5 truncate">{sub}</p>}
        <p className="text-mist-dark/80 text-[11px] mt-0.5 truncate flex items-center gap-1.5">
          <span
            className={cn(
              'shrink-0 rounded px-1.5 py-px text-[9px] font-extrabold uppercase tracking-widest',
              isVideo ? 'bg-red-500/15 text-red-400' : 'bg-brand/15 text-brand-light'
            )}
          >
            {isVideo ? 'Video' : 'Audio'}
          </span>
          {credits && <span className="truncate">{credits}</span>}
        </p>
      </div>
      {isVideo && item.youtubeId ? (
        <ShareButton
          videoId={item.youtubeId}
          title={item.title}
          iconSize={16}
          className="p-1.5 text-mist-dark hover:text-gold-light hover:bg-white/10"
        />
      ) : null}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        aria-label="Save to playlist"
        className="p-1.5 rounded-lg text-mist-dark hover:text-gold-light hover:bg-white/10 transition-colors shrink-0"
      >
        <ListPlus size={16} />
      </button>
      {isActive && isPlaying && (
        <span className="flex items-end gap-[3px] h-4 text-brand-light shrink-0 pr-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="eq-bar h-full"
              style={{ animationDelay: `${i * 0.22}s` }}
            />
          ))}
        </span>
      )}
      {menuOpen && (
        <AddToPlaylistMenu
          track={toHamdNaatTrack(item)}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default function HamdNaatView() {
  const [items, setItems] = useState<HamdNaatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const { playTrack, currentTrack, isPlaying } = usePlayerStore();

  const load = useCallback(async () => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchJson('/api/hamdnaat', 25000);
        if (!data.success || !Array.isArray(data.items)) {
          throw new Error(data.error || 'Bad hamd-naat response');
        }
        if (!cancelled) setItems(data.items);
      } catch (err) {
        console.error('Hamd-Naat catalog load error:', err);
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const results = useMemo(() => {
    const q = submittedQuery.trim().toLowerCase();
    return items.filter((a) => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.artist.toLowerCase().includes(q) ||
        a.lyricist.toLowerCase().includes(q) ||
        a.composer.toLowerCase().includes(q) ||
        a.writingPlace.toLowerCase().includes(q)
      );
    });
  }, [items, submittedQuery, typeFilter]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSubmittedQuery(query.trim());
    },
    [query]
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setSubmittedQuery('');
  }, []);

  const toTrackList = (list: HamdNaatItem[]): Track[] => list.map(toHamdNaatTrack);

  const handlePlayItem = (item: HamdNaatItem) => {
    const idx = results.findIndex((a) => a.id === item.id);
    const trackList = toTrackList(results);
    playTrack(trackList[idx >= 0 ? idx : 0], trackList, idx >= 0 ? idx : 0);
  };

  const audioCount = items.filter((a) => a.type === 'audio').length;
  const videoCount = items.filter((a) => a.type === 'video').length;

  return (
    <main className="pb-44 md:pb-36">
      <div className="mx-auto max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
        {/* Header card */}
        <section className="relative liquid-glass rounded-[28px] p-6 md:p-8 mb-5 overflow-hidden">
          <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/[0.12] via-transparent to-transparent" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="relative flex items-center gap-4">
            <span className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-light to-brand-dark flex items-center justify-center shadow-glow ring-1 ring-white/30 shrink-0">
              <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-2 h-1/2 rounded-full bg-gradient-to-b from-white/40 to-transparent" />
              <Music size={26} className="text-ink-950" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold">
                IslahBD
              </p>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Hamd-Naat
              </h1>
              <p className="text-[13px] text-mist mt-0.5">
                {isLoading
                  ? 'Loading…'
                  : `${items.length} track${items.length === 1 ? '' : 's'} • ${audioCount} audio • ${videoCount} video`}
              </p>
            </div>
          </div>
        </section>

        {/* Search */}
        <form onSubmit={handleSearch}>
          <div className="relative group">
            <Music
              className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-dark group-focus-within:text-brand-light transition-colors"
              size={20}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hamd-naat…"
              className="w-full rounded-2xl liquid-input py-3.5 pl-12 pr-12 text-white outline-none transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-mist-dark hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </form>

        {/* Type filter chips */}
        {!isLoading && !error && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all overflow-hidden flex items-center gap-1.5',
                  typeFilter === f.id ? 'liquid-gold font-bold' : 'liquid-chip text-white'
                )}
              >
                {f.id === 'video' && <Youtube size={14} />}
                {f.label}
              </button>
            ))}
            <span className="ml-1 shrink-0 text-xs text-mist-dark tabular-nums">
              {results.length} tracks
            </span>
          </div>
        )}

        <div className="mt-5">
          {isLoading && (
            <div className="relative liquid-glass rounded-3xl p-2 overflow-hidden space-y-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3.5 p-3">
                  <div className="w-12 h-12 rounded-xl shimmer shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 rounded shimmer w-11/12 mb-2" />
                    <div className="h-3 rounded shimmer w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="relative text-center py-16 liquid-glass rounded-[28px] overflow-hidden">
              <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              <span className="relative w-16 h-16 rounded-full bg-white/[0.07] backdrop-blur-md border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-center mx-auto mb-4">
                <Music size={26} className="text-brand-light" />
              </span>
              <p className="text-white font-bold text-lg">Couldn’t load Hamd-Naat</p>
              <p className="text-mist-dark text-sm mt-1 max-w-xs mx-auto break-words">{error}</p>
              <button
                onClick={() => load()}
                className="relative mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full liquid-gold text-sm font-bold transition-all"
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && results.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-mist-dark mb-3">
                {results.length} result{results.length === 1 ? '' : 's'}
                {typeFilter !== 'all' ? ` • ${typeFilter}` : ''}
              </p>
              <div className="relative liquid-glass rounded-3xl p-2 overflow-hidden">
                <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                <div className="divide-y divide-white/[0.06]">
                  {results.map((item) => (
                    <HamdNaatRow
                      key={item.id}
                      item={item}
                      onPlay={() => handlePlayItem(item)}
                      isActive={currentTrack?.id === `hamdnaat-${item.id}`}
                      isPlaying={isPlaying}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {!isLoading && !error && results.length === 0 && (
            <div className="relative text-center py-16 liquid-glass rounded-[28px] overflow-hidden">
              <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              <span className="relative w-16 h-16 rounded-full bg-white/[0.07] backdrop-blur-md border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-center mx-auto mb-4">
                <MapPin size={26} className="text-brand-light" />
              </span>
              <p className="text-white font-bold">No hamd-naat found</p>
              <p className="text-mist-dark text-sm mt-1">Try different keywords or type</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
