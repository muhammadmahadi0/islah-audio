import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { usePlayerStore, type Track } from '@/store/player-store';
import {
  Play,
  Pause,
  Music,
  Loader2,
  RefreshCw,
  WifiOff,
  Shuffle,
  ListPlus,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChannelStore } from '@/store/channel-store';
import { useLanguageStore } from '@/store/language-store';
import {
  t,
  type I18nKey,
  videosCount,
  showingOf,
  sortedAcross,
  loadingSorting,
  indexingLabel,
  listenersWatching,
  lastLiveLoc,
  fmtViews,
  fmtPublished,
} from '@/lib/i18n';
import AddToPlaylistMenu from '@/components/AddToPlaylistMenu';
import ShareButton from '@/components/ShareButton';
import { LIVE_POLL_MS, type LiveStatus } from '@/lib/live';
import { fetchJson } from '@/lib/fetch-timeout';



interface VideoItem {
  videoId: string;
  id?: string;
  title: string;
  thumbnail: string;
  duration: number;
  views: number;
  publishedAt?: string;
}

type Filter = 'all' | 'bayan' | 'short';

type Sort = 'newest' | 'popular' | 'oldest';

const FILTERS: { id: Filter; key: I18nKey }[] = [
  { id: 'all', key: 'filterAll' },
  { id: 'bayan', key: 'filterBayans' },
  { id: 'short', key: 'filterShorts' },
];

const SORTS: { id: Sort; key: I18nKey }[] = [
  { id: 'newest', key: 'sortNewest' },
  { id: 'popular', key: 'sortPopular' },
  { id: 'oldest', key: 'sortOldest' },
];

const SHORT_MAX_SECONDS = 5 * 60;

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0)
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function VideoSkeleton() {
  return (
    <div className="relative liquid-glass rounded-2xl p-3">
      <div className="aspect-video rounded-xl shimmer mb-3" />
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full shimmer shrink-0" />
        <div className="flex-1">
          <div className="h-4 rounded shimmer w-11/12 mb-2" />
          <div className="h-3 rounded shimmer w-2/3" />
        </div>
      </div>
    </div>
  );
}

function VideoCard({
  video,
  index,
  onPlay,
  isPlaying,
  isCurrentTrack,
  channelName,
  channelAvatar,
}: {
  video: VideoItem;
  index: number;
  onPlay: (video: VideoItem) => void;
  isPlaying: boolean;
  isCurrentTrack: boolean;
  channelName: string;
  channelAvatar: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang } = useLanguageStore();
  const s = t(lang);

  const meta = [fmtViews(lang, video.views), fmtPublished(lang, video.publishedAt)]
    .filter(Boolean)
    .join(' • ');

  return (
    <div
      onClick={() => onPlay(video)}
      className="group relative cursor-pointer cv-card animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 11) * 40}ms` }}
    >
      {/* YouTube-style thumbnail in a liquid-glass frame */}
      <div className="relative liquid-glass rounded-2xl p-1.5 mb-3">
        <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        <div className="relative aspect-video overflow-hidden rounded-xl bg-ink-800">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading={index < 6 ? 'eager' : 'lazy'}
          fetchPriority={index < 6 ? 'high' : 'auto'}
          decoding="async"
        />
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-center justify-center transition-opacity duration-300',
            isCurrentTrack ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <span className="liquid-gold w-12 h-12 rounded-full flex items-center justify-center scale-90 group-hover:scale-100 transition-transform">
            {isCurrentTrack && isPlaying ? (
              <span className="flex items-end gap-[3px] h-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="eq-bar h-full"
                    style={{ animationDelay: `${i * 0.22}s` }}
                  />
                ))}
              </span>
            ) : (
              <Play size={20} fill="currentColor" className="ml-0.5" />
            )}
          </span>
        </div>
        {video.duration > 0 && (
          <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 backdrop-blur-md border border-white/20 px-1.5 py-0.5 text-xs font-medium text-[#FFFFFF] tabular-nums">
            {formatDuration(video.duration)}
          </span>
        )}
        {isCurrentTrack && (
          <span className="absolute top-1.5 left-1.5 rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-950 ring-1 ring-white/30">
            {s.playing}
          </span>
        )}
        </div>
      </div>

      {/* YouTube-style meta row: avatar + title + channel + stats */}
      <div className="flex gap-3 px-1">
        <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden bg-white/[0.07] backdrop-blur-md ring-1 ring-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
          {channelAvatar ? (
            <img src={channelAvatar} alt={channelName} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-gold-light text-lg font-bold bg-gradient-to-br from-brand-deep to-ink-800">إ</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'text-sm font-medium leading-snug clamp-2 mb-1 transition-colors',
              isCurrentTrack ? 'text-brand-light' : 'text-white'
            )}
          >
            <a
              href={`/watch/${video.videoId || video.id}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline"
            >
              {video.title}
            </a>
          </h3>
          <p className="text-[13px] text-mist-dark truncate hover:text-white transition-colors">
            {channelName}
          </p>
          {meta && <p className="text-[13px] text-mist-dark truncate">{meta}</p>}
        </div>
        <ShareButton
          videoId={video.videoId || video.id || ''}
          title={video.title}
          iconSize={17}
          className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-white/[0.08] hover:ring-1 hover:ring-white/20"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          aria-label={s.saveToPlaylist}
          title={s.saveToPlaylist}
          className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-white/[0.08] hover:ring-1 hover:ring-white/20 transition-all"
        >
          <ListPlus size={17} />
        </button>
      </div>
      {menuOpen && (
        <AddToPlaylistMenu
          track={{
            id: video.videoId || video.id || '',
            title: video.title,
            thumbnail: video.thumbnail,
            duration: video.duration || 0,
            channelName,
            videoId: video.videoId || video.id || '',
          }}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  const { lang } = useLanguageStore();
  const s = t(lang);
  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div
        className="relative text-center max-w-md liquid-glass rounded-[28px] p-10 overflow-hidden animate-fade-up"
      >
        <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/[0.12] via-transparent to-transparent" />
        <div className="w-20 h-20 rounded-full bg-brand/10 border border-brand/25 flex items-center justify-center mx-auto mb-6">
          <WifiOff size={36} className="text-brand-light" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
          {s.serverBusy}
        </h1>
        <p className="text-mist mb-7 text-sm leading-relaxed">
          {s.serverBusySub}
        </p>
        <button
          onClick={onRetry}
          className="liquid-gold inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-transform"
        >
          <RefreshCw size={16} />
          {s.tryAgain}
        </button>
      </div>
    </main>
  );
}

export default function HomePage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelName, setChannelName] = useState('Islah');
  const [channelAvatar, setChannelAvatar] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [live, setLive] = useState<LiveStatus | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [totalVideos, setTotalVideos] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [loadedChannel, setLoadedChannel] = useState('');
  // Guards for the global-sort background indexer (not state — no re-renders).
  const indexingRef = useRef(false);
  const indexedForRef = useRef<string | null>(null);
  // Latest catalog snapshot for the indexer effect (kept out of its deps so
  // progressive appends don't restart the loop).
  const videosRef = useRef(videos);
  videosRef.current = videos;
  const tokenRef = useRef(nextToken);
  tokenRef.current = nextToken;

  const { playTrack, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();
  const { channelId } = useChannelStore();
  const { lang } = useLanguageStore();
  const s = t(lang);

  const fetchVideos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIndexing(false);
      indexedForRef.current = null;

      // NOTE: channel ID goes in the path — query strings are dropped
      // by our hosting before function invocation.
      const data = await fetchJson(`/api/channel/${channelId}`, 20000);
      if (!data.success || !data.videos) {
        throw new Error(data.error || 'No videos found');
      }

      setVideos(data.videos);
      setNextToken(data.nextPageToken || null);
      setLoadedChannel(channelId);
      // BETA: total can be null when InnerTube has no key for statistics.
      setTotalVideos(typeof data.total === 'number' ? data.total : 0);
      if (data.channel?.name) setChannelName(data.channel.name);
      if (data.channel?.avatar) setChannelAvatar(data.channel.avatar);
    } catch (err) {
      console.error('[Page] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Global sorts (Most viewed / Oldest) must rank the WHOLE catalog, not just
  // the loaded page — background-index remaining chunks (deduped progressive
  // append, same pattern as Search) and sort as they arrive. Newest is native
  // API order, so it needs no extra fetch.
  useEffect(() => {
    if (sort === 'newest') return;
    if (indexingRef.current) return;
    if (indexedForRef.current === channelId) return;
    const startToken = tokenRef.current;
    if (loadedChannel !== channelId || !startToken) {
      if (!startToken && loadedChannel === channelId) indexedForRef.current = channelId;
      return;
    }
    indexingRef.current = true;
    let cancelled = false;
    (async () => {
      setIndexing(true);
      const seen = new Set(videosRef.current.map((v) => v.videoId || v.id));
      let token: string | null = startToken;
      while (token && !cancelled) {
        let mdata: { success?: boolean; videos?: VideoItem[]; nextPageToken?: string } | null = null;
        try {
          mdata = await fetchJson(
            `/api/channel/${channelId}/more/${encodeURIComponent(token)}`,
            25000
          );
        } catch (err) {
          console.error('[Page] Sort indexing error:', err);
          break;
        }
        if (!mdata?.success || !Array.isArray(mdata.videos)) break;
        const fresh = mdata.videos.filter((v) => !seen.has(v.videoId || v.id));
        fresh.forEach((v) => seen.add(v.videoId || v.id));
        token = mdata.nextPageToken || null;
        if (cancelled) break;
        if (fresh.length > 0) setVideos((prev) => [...prev, ...fresh]);
        setNextToken(token);
      }
      if (!cancelled) indexedForRef.current = channelId;
      indexingRef.current = false;
      setIndexing(false);
    })();
    return () => {
      cancelled = true;
      indexingRef.current = false;
    };
  }, [sort, channelId, loadedChannel]);

  // Live status from islahbd.com (polled)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/live');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.success) setLive(data.live);
      } catch (error) {
        console.error('[Page] Live status error:', error);
      }
    };
    load();
    const id = setInterval(load, LIVE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const filtered = useMemo(() => {
    let list = videos;
    if (filter === 'bayan') list = list.filter((v) => (v.duration || 0) > SHORT_MAX_SECONDS);
    else if (filter === 'short') list = list.filter((v) => (v.duration || 0) <= SHORT_MAX_SECONDS);
    if (sort === 'popular') return [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
    if (sort === 'oldest') {
      // InnerTube exposes NO absolute dates here — publishedAt is a relative
      // label ("6 days ago"), so date-parsing sorts nothing. But the uploads
      // catalog arrives in exact newest-first order, so oldest-first is just
      // the reverse (filter preserves order, so this holds for subsets too).
      return [...list].reverse();
    }
    return list;
  }, [videos, filter, sort]);

  const toTrack = useCallback(
    (video: VideoItem): Track => ({
      id: video.videoId || video.id || '',
      title: video.title,
      thumbnail: video.thumbnail,
      duration: video.duration || 0,
      channelName,
      videoId: video.videoId || video.id || '',
    }),
    [channelName]
  );

  const playList = useCallback(
    (list: VideoItem[], startIndex: number) => {
      if (list.length === 0) return;
      const trackList = list.map(toTrack);
      playTrack(trackList[startIndex], trackList, startIndex);
    },
    [playTrack, toTrack]
  );

  const handlePlayVideo = useCallback(
    (video: VideoItem) => {
      const id = video.videoId || video.id;
      const idx = filtered.findIndex((v) => (v.videoId || v.id) === id);
      playList(filtered, idx >= 0 ? idx : 0);
    },
    [filtered, playList]
  );

  const handlePlayAll = useCallback(() => {
    if (currentTrack) setIsPlaying(!isPlaying);
    else playList(filtered, 0);
  }, [currentTrack, isPlaying, setIsPlaying, filtered, playList]);

  const handleShuffle = useCallback(() => {
    if (filtered.length === 0) return;
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    playList(shuffled, 0);
  }, [filtered, playList]);

  const handleLoadMore = useCallback(async () => {
    if (!nextToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchJson(
        `/api/channel/${channelId}/more/${encodeURIComponent(nextToken)}`,
        25000
      );
      if (data.success && Array.isArray(data.videos)) {
        setVideos((prev) => {
          const seen = new Set(prev.map((v) => v.videoId || v.id));
          const fresh = data.videos.filter((v: VideoItem) => !seen.has(v.videoId || v.id));
          return [...prev, ...fresh];
        });
        setNextToken(data.nextPageToken || null);
      }
    } catch (err) {
      console.error('[Page] Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [nextToken, loadingMore, channelId]);

  const isLiveTrackActive =
    !!currentTrack && (currentTrack.id === 'live' || currentTrack.id === 'live-recording');

  const handleLive = useCallback(() => {
    if (!live) return;
    if (isLiveTrackActive) {
      setIsPlaying(!isPlaying);
      return;
    }
    if (live.isLive && live.streamUrl) {
      const track: Track = {
        id: 'live',
        title: live.title || 'Live Broadcast',
        thumbnail: channelAvatar,
        duration: 0,
        channelName: live.speaker || 'Islah Live',
        videoId: '',
        hlsUrl: live.streamUrl,
        isLive: true,
        location: live.location || '',
      };
      playTrack(track, [track], 0);
    } else if (live.recording?.audioUrl) {
      const track: Track = {
        id: 'live-recording',
        title: live.recording.title || 'Last Live Broadcast',
        thumbnail: channelAvatar,
        duration: live.recording.durationSeconds || 0,
        channelName: live.recording.speaker || 'Islah',
        videoId: '',
        audioUrl: live.recording.audioUrl,
        location: live.recording.location || '',
      };
      playTrack(track, [track], 0);
    }
  }, [live, isLiveTrackActive, isPlaying, setIsPlaying, playTrack, channelAvatar]);

  if (error && !isLoading) {
    return <ErrorScreen onRetry={fetchVideos} />;
  }

  return (
    <main className="pb-44 md:pb-36">
      <div className="mx-auto max-w-[1600px] px-4 md:px-6 pt-0 md:pt-1">
        {isLoading ? (
          <div className="relative liquid-glass rounded-[28px] p-4 md:p-8 mb-4 md:mb-6 overflow-hidden">
            <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <div className="relative flex items-center gap-4">
              <div className="flex-1">
                <div className="h-3 w-28 rounded shimmer mb-2.5" />
                <div className="h-7 w-48 rounded-lg shimmer mb-2.5" />
                <div className="h-3.5 w-36 rounded shimmer" />
              </div>
              <div className="w-14 h-14 md:w-24 md:h-24 rounded-2xl md:rounded-3xl shimmer shrink-0" />
            </div>
          </div>
        ) : (
          /* ---------- Channel header (liquid-glass hero) ---------- */
          <section
            className="relative liquid-glass rounded-[28px] p-4 overflow-hidden animate-fade-up mt-2"
          >
            <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/[0.12] via-transparent to-transparent" />
            <span aria-hidden="true" className="pointer-events-none absolute bottom-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="relative flex items-center gap-4 md:gap-6">
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden shrink-0 ring-1 ring-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.3)] bg-gradient-to-br from-brand-light to-brand-dark flex items-center justify-center">
              {channelAvatar ? (
                <img
                  src={channelAvatar}
                  alt={channelName}
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              ) : (
                <span className="text-[#E7C55A] text-4xl md:text-6xl font-bold">إ</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white truncate">
                {channelName}
              </h1>
              <p className="mt-1 text-[13px] md:text-sm text-mist-dark truncate">
                @islahbd • {videosCount(lang, totalVideos || videos.length)}
              </p>
              {live?.isLive ? (
                <button
                  onClick={handleLive}
                  className="mt-1 flex items-center gap-1.5 text-[13px] md:text-sm font-medium text-red-500 hover:text-red-400 transition-colors"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span
                      className="relative inline-flex rounded-full h-2 w-2 bg-red-500"
                      style={{ boxShadow: '0 0 10px 3px rgba(239,68,68,0.95)' }}
                    />
                  </span>
                  <span className="truncate">
                    {s.liveNow}{live.title ? ` • ${live.title}` : ''}{live.location ? ` • ${live.location}` : ''}{live.listeners > 0 ? ` • ${listenersWatching(lang, live.listeners)}` : ''}
                  </span>
                </button>
              ) : live?.recording?.location ? (
                <p className="mt-1 hidden sm:block text-[13px] text-mist-dark truncate">
                  {lastLiveLoc(lang, live.recording.location)}
                </p>
              ) : (
                <p className="mt-1 hidden sm:block text-[13px] text-mist-dark truncate">
                  {s.heroTagline}
                </p>
              )}

              {/* Actions row — wraps on small screens, labels never wrap */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleLive}
                  disabled={!live || (!live.isLive && !live.recording)}
                  className={cn(
                    'h-9 px-4 rounded-full flex items-center gap-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-all disabled:opacity-40',
                    live?.isLive
                      ? 'bg-black/60 text-white ring-1 ring-red-500 hover:bg-black/70 active:scale-95'
                      : 'bg-white/10 text-white hover:bg-white/15 active:scale-95'
                  )}
                  style={
                    live?.isLive
                      ? { boxShadow: '0 0 18px 2px rgba(239,68,68,0.55)' }
                      : undefined
                  }
                >
                  {live?.isLive ? (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span
                        className="relative inline-flex rounded-full h-2 w-2 bg-red-500"
                        style={{ boxShadow: '0 0 10px 3px rgba(239,68,68,0.95)' }}
                      />
                    </span>
                  ) : (
                    <Radio size={15} />
                  )}
                  {live?.isLive
                    ? isLiveTrackActive && isPlaying
                      ? s.listening
                      : s.live
                    : live?.recording
                      ? s.lastLive
                      : s.live}
                </button>
                <button
                  onClick={handlePlayAll}
                  className="liquid-gold h-9 px-4 rounded-full text-sm font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:scale-[1.03] active:scale-95 transition-all"
                  aria-label={currentTrack && isPlaying ? s.pause : s.playAll}
                >
                  {isPlaying && currentTrack ? (
                    <Pause size={16} fill="currentColor" />
                  ) : (
                    <Play size={16} fill="currentColor" />
                  )}
                  {s.playAll}
                </button>
                <button
                  onClick={handleShuffle}
                  className="h-9 w-9 rounded-full bg-white/[0.07] backdrop-blur-md border border-white/20 hover:bg-white/[0.14] hover:border-white/40 flex items-center justify-center text-white transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
                  aria-label={s.shufflePlay}
                  title={s.shufflePlay}
                >
                  <Shuffle size={18} />
                </button>
              </div>
              </div>
            </div>
          </section>
        )}

        {/* ---------- Sticky chips bar (liquid-glass pill) ---------- */}
        {!isLoading && !error && (
          <div className="sticky top-[4.75rem] z-20 -mx-4 md:-mx-8 px-4 md:px-8 py-2 transform-gpu">
            <div className="relative liquid-glass rounded-full px-2 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-14 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all overflow-hidden',
                    filter === f.id
                      ? 'liquid-gold font-bold'
                      : 'liquid-chip text-white'
                  )}
                >
                  {s[f.key]}
                </button>
              ))}
              <span aria-hidden="true" className="shrink-0 w-px h-5 bg-white/15 mx-1" />
              {SORTS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSort(item.id)}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all overflow-hidden',
                    sort === item.id
                      ? 'liquid-gold font-bold'
                      : 'liquid-chip text-white'
                  )}
                >
                  {s[item.key]}
                </button>
              ))}
              <span className="ml-1 shrink-0 text-xs text-mist-dark tabular-nums">
                {indexing ? indexingLabel(lang, videos.length) : filter === 'all' ? videosCount(lang, totalVideos || videos.length) : (lang === 'bn' ? `${filtered.length}টি ভিডিও` : `${filtered.length} videos`)}
              </span>
            </div>
          </div>
        )}

        {/* ---------- Grid ---------- */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <VideoSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
              {/* No AnimatePresence here: popLayout forces absolute
                  positioning + layout recalcs on every filter/show-more
                  change, which janks scrolling on phones. */}
              {filtered.map((video, index) => (
                  <VideoCard
                    key={video.videoId || video.id}
                    video={video}
                    index={index}
                    onPlay={handlePlayVideo}
                    isPlaying={isPlaying}
                    isCurrentTrack={
                      !!currentTrack &&
                      currentTrack.videoId === (video.videoId || video.id)
                    }
                    channelName={channelName}
                    channelAvatar={channelAvatar}
                  />
                ))}
            </div>

            {/* Show more — the uploads catalog is paged (100 + 200 chunks).
                Under global sorts (Most viewed / Oldest) the whole catalog is
                background-indexed instead, so manual paging is hidden there. */}
            <div className="flex flex-col items-center mt-8 gap-2">
              {totalVideos > 0 && (
                <p className="text-xs font-semibold text-mist-dark tabular-nums">
                  {showingOf(lang, videos.length, totalVideos)}
                </p>
              )}
              {sort !== 'newest' && indexing && (
                <p className="flex items-center gap-2 text-xs font-semibold text-brand-light">
                  <Loader2 size={14} className="animate-spin" />
                  {loadingSorting(lang, videos.length)}
                </p>
              )}
              {sort === 'newest' && nextToken ? (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="relative flex items-center gap-2 px-7 py-3 rounded-full liquid-glass text-sm font-bold text-white transition-all hover:border-white/30 disabled:opacity-50 overflow-hidden"
                >
                  <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                  {loadingMore ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-brand-light" />
                      {s.loading}
                    </>
                  ) : (
                    s.showMore
                  )}
                </button>
              ) : (
                videos.length > 0 && !indexing && (
                  <p className="text-xs text-mist-dark">
                    {sort === 'newest'
                      ? s.endReached
                      : sortedAcross(lang, videos.length)}
                  </p>
                )
              )}
            </div>
          </>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="relative flex flex-col items-center justify-center py-20 text-center liquid-glass rounded-[28px] overflow-hidden">
            <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <span className="relative w-16 h-16 rounded-full bg-white/[0.07] backdrop-blur-md border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-center mb-4">
              <Music size={28} className="text-brand-light" />
            </span>
            <p className="text-white font-bold">{s.noLectures}</p>
            <p className="text-mist-dark text-sm mt-1">{s.tryDifferentFilter}</p>
          </div>
        )}
      </div>
    </main>
  );
}
