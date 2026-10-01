import { useState, useMemo, useEffect, useCallback } from 'react';
import { usePlayerStore, type Track } from '@/store/player-store';
import {
  Zap,
  Loader2,
  X,
  ListPlus,
  RefreshCw,
  Youtube,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/store/language-store';
import { t, type I18nKey, resultsCount, tracksCount, shortsSub } from '@/lib/i18n';
import AddToPlaylistMenu from '@/components/AddToPlaylistMenu';
import ShareButton from '@/components/ShareButton';
import { fetchJson } from '@/lib/fetch-timeout';
import {
  toShortTrack,
  formatShortDate,
  type ShortClip,
} from '@/lib/shorts';

type TypeFilter = 'all' | 'audio' | 'video';

const TYPE_FILTERS: { id: TypeFilter; key: I18nKey }[] = [
  { id: 'all', key: 'filterAll' },
  { id: 'audio', key: 'chipAudio' },
  { id: 'video', key: 'chipVideo' },
];

function ShortRow({
  clip,
  onPlay,
  isActive,
  isPlaying,
}: {
  clip: ShortClip;
  onPlay: () => void;
  isActive: boolean;
  isPlaying: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang } = useLanguageStore();
  const s = t(lang);
  const isVideo = clip.type === 'video';

  const sub = formatShortDate(clip.createdAt);

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
        {isVideo && clip.youtubeId ? (
          <img
            src={`https://i.ytimg.com/vi/${clip.youtubeId}/hqdefault.jpg`}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Zap size={18} className="text-brand-light" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold leading-snug clamp-2',
            isActive ? 'text-brand-light' : 'text-white'
          )}
        >
          {isVideo && clip.youtubeId ? (
            <a
              href={`/watch/${clip.youtubeId}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline"
            >
              {clip.title}
            </a>
          ) : (
            clip.title
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
            {isVideo ? s.chipVideo : s.chipAudio}
          </span>
        </p>
      </div>
      {isVideo && clip.youtubeId ? (
        <ShareButton
          videoId={clip.youtubeId}
          title={clip.title}
          iconSize={16}
          className="p-1.5 text-mist-dark hover:text-gold-light hover:bg-white/10"
        />
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
          track={toShortTrack(clip)}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default function ShortsView() {
  const { lang } = useLanguageStore();
  const s = t(lang);
  const [clips, setClips] = useState<ShortClip[]>([]);
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
        const data = await fetchJson('/api/shorts', 25000);
        if (!data.success || !Array.isArray(data.clips)) {
          throw new Error(data.error || 'Bad shorts response');
        }
        if (!cancelled) setClips(data.clips);
      } catch (err) {
        console.error('Shorts catalog load error:', err);
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
    return clips.filter((c) => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (!q) return true;
      return c.title.toLowerCase().includes(q);
    });
  }, [clips, submittedQuery, typeFilter]);

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

  const toTrackList = (list: ShortClip[]): Track[] => list.map(toShortTrack);

  const handlePlayClip = (clip: ShortClip) => {
    const idx = results.findIndex((c) => c.id === clip.id);
    const trackList = toTrackList(results);
    playTrack(trackList[idx >= 0 ? idx : 0], trackList, idx >= 0 ? idx : 0);
  };

  const audioCount = clips.filter((c) => c.type === 'audio').length;
  const videoCount = clips.filter((c) => c.type === 'video').length;

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
              <Zap size={26} className="text-ink-950" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold">
                {s.brandEyebrow}
              </p>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                {s.shortsTitle}
              </h1>
              <p className="text-[13px] text-mist mt-0.5">
                {isLoading
                  ? s.loading
                  : shortsSub(lang, clips.length, audioCount, videoCount)}
              </p>
            </div>
          </div>
        </section>

        {/* Search */}
        <form onSubmit={handleSearch}>
          <div className="relative group">
            <Zap
              className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-dark group-focus-within:text-brand-light transition-colors"
              size={20}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={s.searchShortsPh}
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
                {s[f.key]}
              </button>
            ))}
            <span className="ml-1 shrink-0 text-xs text-mist-dark tabular-nums">
              {tracksCount(lang, results.length)}
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
                <Zap size={26} className="text-brand-light" />
              </span>
              <p className="text-white font-bold text-lg">{s.shortsLoadFail}</p>
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
                {typeFilter !== 'all' ? ` • ${typeFilter === 'audio' ? s.chipAudio : s.chipVideo}` : ''}
              </p>
              <div className="relative liquid-glass rounded-3xl p-2 overflow-hidden">
                <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                <div className="divide-y divide-white/[0.06]">
                  {results.map((clip) => (
                    <ShortRow
                      key={clip.id}
                      clip={clip}
                      onPlay={() => handlePlayClip(clip)}
                      isActive={currentTrack?.id === `short-${clip.id}`}
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
                <Zap size={26} className="text-brand-light" />
              </span>
              <p className="text-white font-bold">{s.noShorts}</p>
              <p className="text-mist-dark text-sm mt-1">{s.tryKeywordsType}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
