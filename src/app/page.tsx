'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { usePlayerStore, type Track } from '@/store/player-store';
import {
  Play,
  Pause,
  Music,
  Loader2,
  RefreshCw,
  WifiOff,
  Shuffle,
  Clock,
  Eye,
  ListMusic,
  ListPlus,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_CHANNEL_ID } from '@/lib/invidious';
import AddToPlaylistMenu from '@/components/AddToPlaylistMenu';
import { LIVE_POLL_MS, type LiveStatus } from '@/lib/live';
import { motion, AnimatePresence } from 'framer-motion';

const CHANNEL_ID = DEFAULT_CHANNEL_ID;

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

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'bayan', label: 'Bayans' },
  { id: 'short', label: 'Shorts' },
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

function formatViews(views: number): string {
  if (!views || views <= 0) return '';
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
  return `${views} views`;
}

function formatTotalHours(videos: VideoItem[]): string {
  const total = videos.reduce((sum, v) => sum + (v.duration || 0), 0);
  const hours = Math.round(total / 3600);
  return hours >= 1 ? `${hours}+ hours` : `${Math.round(total / 60)} min`;
}

function VideoSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="aspect-video rounded-xl shimmer mb-3" />
      <div className="h-4 rounded-md shimmer w-11/12 mb-2" />
      <div className="h-3 rounded-md shimmer w-2/3" />
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
}: {
  video: VideoItem;
  index: number;
  onPlay: (video: VideoItem) => void;
  isPlaying: boolean;
  isCurrentTrack: boolean;
  channelName: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 11) * 0.04, duration: 0.4 }}
      onClick={() => onPlay(video)}
      className={cn(
        'group relative cursor-pointer rounded-2xl border p-3 transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-card',
        isCurrentTrack
          ? 'border-brand/50 bg-brand/[0.07] shadow-glow'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-brand/30 hover:bg-white/[0.05]'
      )}
    >
      <div className="relative aspect-video mb-3 overflow-hidden rounded-xl">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          loading="lazy"
        />
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center transition-opacity duration-300',
            isCurrentTrack ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <span className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-light to-brand-dark flex items-center justify-center shadow-glow-lg scale-90 group-hover:scale-100 transition-transform">
            {isCurrentTrack && isPlaying ? (
              <span className="flex items-end gap-[3px] h-4 text-ink-950">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="eq-bar h-full"
                    style={{ animationDelay: `${i * 0.22}s` }}
                  />
                ))}
              </span>
            ) : (
              <Play size={20} fill="#060D0A" className="text-ink-950 ml-0.5" />
            )}
          </span>
        </div>
        {video.duration > 0 && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/75 backdrop-blur px-1.5 py-0.5 text-[11px] font-semibold text-white tabular-nums">
            {formatDuration(video.duration)}
          </span>
        )}
        {isCurrentTrack && (
          <span className="absolute top-2 left-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-950">
            Playing
          </span>
        )}
        {/* Save to playlist */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          aria-label="Save to playlist"
          title="Save to playlist"
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 backdrop-blur border border-white/15 text-white/80 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-gold-light hover:border-gold/50 transition-all"
        >
          <ListPlus size={15} />
        </button>
      </div>
      <h3
        className={cn(
          'text-sm font-semibold leading-snug clamp-2 mb-1.5 transition-colors',
          isCurrentTrack ? 'text-brand-light' : 'text-white group-hover:text-brand-light'
        )}
      >
        {video.title}
      </h3>
      <div className="flex items-center gap-1.5 text-xs text-mist-dark">
        {video.views > 0 && (
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {formatViews(video.views)}
          </span>
        )}
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
    </motion.div>
  );
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <motion.div
        className="text-center max-w-md rounded-3xl border border-white/[0.07] bg-white/[0.02] p-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 rounded-full bg-brand/10 border border-brand/25 flex items-center justify-center mx-auto mb-6">
          <WifiOff size={36} className="text-brand-light" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
          Server Busy
        </h1>
        <p className="text-mist mb-7 text-sm leading-relaxed">
          All streaming services are currently unavailable. Please try again in a moment.
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-brand-light to-brand-dark text-ink-950 font-bold text-sm shadow-glow hover:scale-105 active:scale-95 transition-transform"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </motion.div>
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
  const [live, setLive] = useState<LiveStatus | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [totalVideos, setTotalVideos] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const { playTrack, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();

  const fetchVideos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // NOTE: channel ID goes in the path — query strings are dropped
      // by our hosting before function invocation.
      const res = await fetch(`/api/channel/${CHANNEL_ID}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success || !data.videos) {
        throw new Error(data.error || 'No videos found');
      }

      setVideos(data.videos);
      setNextToken(data.nextPageToken || null);
      setTotalVideos(data.total || data.videos.length);
      if (data.channel?.name) setChannelName(data.channel.name);
      if (data.channel?.avatar) setChannelAvatar(data.channel.avatar);
    } catch (err) {
      console.error('[Page] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

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
    if (filter === 'bayan') return videos.filter((v) => (v.duration || 0) > SHORT_MAX_SECONDS);
    if (filter === 'short') return videos.filter((v) => (v.duration || 0) <= SHORT_MAX_SECONDS);
    return videos;
  }, [videos, filter]);

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
      const res = await fetch(
        `/api/channel/${CHANNEL_ID}/more/${encodeURIComponent(nextToken)}`
      );
      const data = await res.json();
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
  }, [nextToken, loadingMore]);

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
      };
      playTrack(track, [track], 0);
    }
  }, [live, isLiveTrackActive, isPlaying, setIsPlaying, playTrack, channelAvatar]);

  if (error && !isLoading) {
    return <ErrorScreen onRetry={fetchVideos} />;
  }

  return (
    <main className="pb-44 md:pb-36">
      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-4 md:pt-8">
        {isLoading ? (
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4 md:p-8 mb-4 md:mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-3 w-28 rounded shimmer mb-2.5" />
                <div className="h-7 w-48 rounded-lg shimmer mb-2.5" />
                <div className="h-3.5 w-36 rounded shimmer" />
              </div>
              <div className="w-14 h-14 md:w-24 md:h-24 rounded-2xl md:rounded-3xl shimmer shrink-0" />
            </div>
          </div>
        ) : (
          /* ---------- Hero ---------- */
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-brand-deep/60 via-ink-800 to-ink-900 p-4 md:p-9 mb-4 md:mb-6"
          >
            {/* Ambient glows */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand/25 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-28 -left-16 w-72 h-72 rounded-full bg-gold/15 blur-[100px]" />
            {/* Subtle pattern */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.15]"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)',
                backgroundSize: '22px 22px',
                maskImage: 'linear-gradient(to bottom, black, transparent 75%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 75%)',
              }}
            />

            <div className="relative flex flex-col gap-3.5 md:gap-7 md:flex-row md:items-center">
              {/* Top row on mobile: text left, logo right */}
              <div className="flex items-center gap-3.5 md:contents">
                <div className="flex-1 min-w-0 order-1 md:order-2">
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] text-gold mb-1 md:mb-1.5">
                    Islamic Lectures
                  </p>
                  <h1 className="text-2xl md:text-[2.75rem] leading-none font-extrabold tracking-tight text-white truncate">
                    {channelName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-0.5 md:gap-y-1 mt-1.5 md:mt-2.5 text-xs md:text-[13px] text-mist">
                    <span className="flex items-center gap-1.5">
                      <ListMusic size={13} className="text-brand-light" />
                      {totalVideos || videos.length} lectures
                    </span>
                    <span className="hidden sm:flex items-center gap-1.5">
                      <Clock size={13} className="text-brand-light" />
                      {formatTotalHours(videos)} of content
                    </span>
                  </div>
                  {live?.isLive && (
                    <button
                      onClick={handleLive}
                      className="flex items-center gap-2 mt-2 md:mt-3 text-xs md:text-[13px] font-semibold text-red-300 hover:text-red-200 transition-colors"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                      <span className="truncate">
                        Live now{live.title ? `: ${live.title}` : ''}
                        {live.listeners > 0 ? ` • ${live.listeners} listening` : ''}
                      </span>
                    </button>
                  )}
                </div>

                <div className="order-2 md:order-1 w-14 h-14 md:w-24 md:h-24 rounded-2xl md:rounded-3xl overflow-hidden shrink-0 ring-2 ring-gold/50 shadow-gold bg-gradient-to-br from-brand to-emerald-950 flex items-center justify-center">
                  {channelAvatar ? (
                    <img
                      src={channelAvatar}
                      alt={channelName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gold-light text-3xl md:text-5xl font-bold">إ</span>
                  )}
                </div>
              </div>

              <div className="order-3 flex items-center gap-2.5 md:gap-3 shrink-0">
                {/* Live / replay-last-broadcast */}
                <button
                  onClick={handleLive}
                  disabled={!live || (!live.isLive && !live.recording)}
                  title={live?.isLive ? 'Play live broadcast' : 'Play last broadcast'}
                  aria-label={live?.isLive ? 'Play live' : 'Play last broadcast'}
                  className={cn(
                    'h-10 md:h-12 pl-3 pr-3.5 md:pl-3.5 md:pr-4 rounded-full flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-extrabold transition-all disabled:opacity-40',
                    live?.isLive
                      ? 'bg-red-500 text-white shadow-[0_8px_32px_rgba(239,68,68,0.45)] hover:scale-105 active:scale-95'
                      : 'border border-gold/50 bg-gold/10 text-gold-light hover:border-gold hover:shadow-gold'
                  )}
                >
                  {live?.isLive ? (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                    </span>
                  ) : (
                    <Radio size={17} />
                  )}
                  {live?.isLive
                    ? isLiveTrackActive && isPlaying
                      ? 'Listening'
                      : 'LIVE'
                    : live?.recording
                      ? 'Last Live'
                      : 'Live'}
                </button>
                <button
                  onClick={handlePlayAll}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-brand-light to-brand-dark flex items-center justify-center shadow-glow-lg hover:scale-105 active:scale-95 transition-transform"
                  aria-label={currentTrack && isPlaying ? 'Pause' : 'Play all'}
                >
                  {isPlaying && currentTrack ? (
                    <Pause size={22} fill="#060D0A" className="text-ink-950 md:w-[26px] md:h-[26px]" />
                  ) : (
                    <Play size={22} fill="#060D0A" className="text-ink-950 ml-1 md:w-[26px] md:h-[26px]" />
                  )}
                </button>
                <button
                  onClick={handleShuffle}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/15 bg-white/[0.05] backdrop-blur flex items-center justify-center text-white hover:border-gold/60 hover:text-gold-light transition-colors"
                  aria-label="Shuffle play"
                  title="Shuffle play"
                >
                  <Shuffle size={17} className="md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {/* ---------- Filter + section header ---------- */}
        {!isLoading && !error && (
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-white">
              {filter === 'all' ? 'Latest Lectures' : filter === 'bayan' ? 'Bayans' : 'Shorts'}
              <span className="ml-2 text-sm font-semibold text-mist-dark">
                {filtered.length}
              </span>
            </h2>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all',
                    filter === f.id
                      ? 'bg-gradient-to-r from-brand-light to-brand-dark text-ink-950 shadow-glow'
                      : 'bg-white/[0.05] text-mist border border-white/10 hover:text-white hover:border-white/25'
                  )}
                >
                  {f.label}
                </button>
              ))}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              <AnimatePresence mode="popLayout">
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
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Show more — the uploads catalog is paged (100 + 200 chunks) */}
            <div className="flex flex-col items-center mt-8 gap-2">
              {totalVideos > 0 && (
                <p className="text-xs font-semibold text-mist-dark tabular-nums">
                  Showing {videos.length} of {totalVideos} lectures
                </p>
              )}
              {nextToken ? (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-7 py-3 rounded-full bg-white/[0.06] border border-white/15 text-sm font-bold text-white hover:border-brand/60 hover:shadow-glow transition-all disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-brand-light" />
                      Loading…
                    </>
                  ) : (
                    'Show more'
                  )}
                </button>
              ) : (
                videos.length > 0 && (
                  <p className="text-xs text-mist-dark">You’ve reached the end ✓</p>
                )
              )}
            </div>
          </>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-dashed border-white/10">
            <span className="w-16 h-16 rounded-full bg-brand/10 border border-brand/25 flex items-center justify-center mb-4">
              <Music size={28} className="text-brand-light" />
            </span>
            <p className="text-white font-bold">No lectures found</p>
            <p className="text-mist-dark text-sm mt-1">Try a different filter</p>
          </div>
        )}
      </div>
    </main>
  );
}
