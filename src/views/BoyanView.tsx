import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { usePlayerStore, type Track } from '@/store/player-store';
import {
  Mic,
  Music,
  Loader2,
  X,
  ListPlus,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/store/language-store';
import { t, resultsCount, boyanSub } from '@/lib/i18n';
import AddToPlaylistMenu from '@/components/AddToPlaylistMenu';
import { fetchJson } from '@/lib/fetch-timeout';
import { setupAutoRefresh, mergeNewestFirst, ISLAHBD_REFRESH_MS } from '@/lib/auto-refresh';
import {
  toBoyanTrack,
  formatBoyanDate,
  type BoyanAudio,
  type BoyanCategory,
} from '@/lib/boyan';

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function BoyanRow({
  audio,
  onPlay,
  isActive,
  isPlaying,
}: {
  audio: BoyanAudio;
  onPlay: () => void;
  isActive: boolean;
  isPlaying: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang } = useLanguageStore();
  const s = t(lang);

  const sub = [audio.speaker, audio.location, formatBoyanDate(audio.uploadDate)]
    .filter(Boolean)
    .join(' • ');

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
        <Mic size={18} className="text-brand-light" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold leading-snug clamp-2',
            isActive ? 'text-brand-light' : 'text-white'
          )}
        >
          {audio.title}
        </p>
        {sub && <p className="text-mist-dark text-xs mt-0.5 truncate">{sub}</p>}
        <p className="text-mist-dark/80 text-[11px] mt-0.5 truncate flex items-center gap-1">
          {audio.category && <span className="truncate">{audio.category}</span>}
        </p>
      </div>
      {audio.duration && audio.duration !== '00:00' ? (
        <span className="shrink-0 text-xs font-medium text-mist-dark tabular-nums">
          {audio.duration}
        </span>
      ) : null}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        aria-label={s.saveToPlaylist}
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
          track={toBoyanTrack(audio)}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default function BoyanView() {
  const { lang } = useLanguageStore();
  const s = t(lang);
  const [audios, setAudios] = useState<BoyanAudio[]>([]);
  const [categories, setCategories] = useState<BoyanCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [category, setCategory] = useState<string>('all');

  const { playTrack, currentTrack, isPlaying } = usePlayerStore();

  const load = useCallback(async () => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchJson('/api/boyan', 25000);
        if (!data.success || !Array.isArray(data.audios)) {
          throw new Error(data.error || 'Bad boyan response');
        }
        if (!cancelled) {
          setAudios(data.audios);
          if (Array.isArray(data.categories)) setCategories(data.categories);
        }
      } catch (err) {
        console.error('Boyan catalog load error:', err);
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

  // Auto-update: silent background refresh (poll + tab-visible + page-load)
  // merges newly published bayans at the top — no skeleton, no lost scroll,
  // filter, or playback.
  const refreshingRef = useRef(false);
  const refreshSilently = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const data = await fetchJson('/api/boyan', 25000);
      if (data.success && Array.isArray(data.audios)) {
        setAudios((prev) => {
          if (prev.length === 0) return data.audios;
          return mergeNewestFirst(prev, data.audios, (a: BoyanAudio) => a.id);
        });
        if (Array.isArray(data.categories)) setCategories(data.categories);
      }
    } catch {
      // Silent — keep showing the cached list.
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  useEffect(() => setupAutoRefresh(refreshSilently, ISLAHBD_REFRESH_MS), [refreshSilently]);

  const results = useMemo(() => {
    const q = submittedQuery.trim().toLowerCase();
    return audios.filter((a) => {
      if (category !== 'all' && a.category !== category) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.speaker.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    });
  }, [audios, submittedQuery, category]);

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

  const toTrackList = (list: BoyanAudio[]): Track[] => list.map(toBoyanTrack);

  const handlePlayAudio = (audio: BoyanAudio) => {
    const idx = results.findIndex((a) => a.id === audio.id);
    const trackList = toTrackList(results);
    playTrack(trackList[idx >= 0 ? idx : 0], trackList, idx >= 0 ? idx : 0);
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
            <span className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-light to-brand-dark flex items-center justify-center shadow-glow ring-1 ring-white/30 shrink-0">
              <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-2 h-1/2 rounded-full bg-gradient-to-b from-white/40 to-transparent" />
              <Mic size={26} className="text-ink-950" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold">
                {s.brandEyebrow}
              </p>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                {s.boyanTitle}
              </h1>
              <p className="text-[13px] text-mist mt-0.5">
                {isLoading
                  ? s.loading
                  : boyanSub(lang, audios.length)}
              </p>
            </div>
          </div>
        </section>

        {/* Search */}
        <form onSubmit={handleSearch}>
          <div className="relative group">
            <Mic
              className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-dark group-focus-within:text-brand-light transition-colors"
              size={20}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={s.searchBoyanPh}
              className="w-full rounded-2xl liquid-input py-3.5 pl-12 pr-12 text-white outline-none transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-mist-dark hover:text-white hover:bg-white/10 transition-colors"
                aria-label={s.clearSearch}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </form>

        {/* Category chips */}
        {!isLoading && !error && categories.length > 0 && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setCategory('all')}
              className={cn(
                'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all overflow-hidden',
                category === 'all' ? 'liquid-gold font-bold' : 'liquid-chip text-white'
              )}
            >
              {s.filterAll}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.name)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all overflow-hidden max-w-48 truncate',
                  category === c.name ? 'liquid-gold font-bold' : 'liquid-chip text-white'
                )}
                title={c.name}
              >
                {c.name}
              </button>
            ))}
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
              <p className="text-white font-bold text-lg">{s.boyanLoadFail}</p>
              <p className="text-mist-dark text-sm mt-1 max-w-xs mx-auto break-words">{error}</p>
              <button
                onClick={() => load()}
                className="relative mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full liquid-gold text-sm font-bold transition-all"
              >
                <RefreshCw size={15} />
                {s.retry}
              </button>
            </div>
          )}

          {!isLoading && !error && results.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-mist-dark mb-3">
                {resultsCount(lang, results.length)}
                {category !== 'all' ? ` • ${category}` : ''}
              </p>
              <div className="relative liquid-glass rounded-3xl p-2 overflow-hidden">
                <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                <div className="divide-y divide-white/[0.06]">
                  {results.map((audio) => (
                    <BoyanRow
                      key={audio.id}
                      audio={audio}
                      onPlay={() => handlePlayAudio(audio)}
                      isActive={currentTrack?.id === `boyan-${audio.id}`}
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
              <p className="text-white font-bold">{s.noBoyan}</p>
              <p className="text-mist-dark text-sm mt-1">{s.tryKeywordsCategory}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
