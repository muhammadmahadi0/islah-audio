import { useEffect } from 'react';
import { usePlayerStore, type Track } from '@/store/player-store';
import {
  Play,
  Pause,
  Loader2,
  ArrowLeft,
  Music,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ShareButton from '@/components/ShareButton';
import { watchUrl } from '@/lib/share';
import { openIslahBDApp } from '@/lib/open-app';

export interface WatchVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
  channelName: string;
  description: string;
  publishedAt: string;
  views: number;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatViews(views: number): string {
  if (!views || views <= 0) return '';
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
  return `${views} views`;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return iso;
  return new Date(t).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Shared-link landing page for one video (`/watch/[videoId]`).
 * Auto-plays the video on open (single-track queue); the global
 * MiniPlayer owns actual playback. The URL itself is the share link —
 * the share button copies it (native sheet on mobile).
 */
export default function WatchView({ video }: { video: WatchVideo }) {
  const { currentTrack, isPlaying, isLoading, playTrack, setIsPlaying } = usePlayerStore();

  const isCurrent = currentTrack?.videoId === video.videoId;

  // Auto-play on open (direct visits + in-app navigation alike).
  useEffect(() => {
    const state = usePlayerStore.getState();
    if (state.currentTrack?.videoId === video.videoId) return;
    const track: Track = {
      id: video.videoId,
      title: video.title || 'Untitled lecture',
      thumbnail: video.thumbnail,
      duration: video.duration || 0,
      channelName: video.channelName || 'Islah',
      videoId: video.videoId,
    };
    state.playTrack(track, [track], 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.videoId]);

  const handlePlayPause = () => {
    if (isCurrent) {
      setIsPlaying(!isPlaying);
      return;
    }
    const track: Track = {
      id: video.videoId,
      title: video.title || 'Untitled lecture',
      thumbnail: video.thumbnail,
      duration: video.duration || 0,
      channelName: video.channelName || 'Islah',
      videoId: video.videoId,
    };
    playTrack(track, [track], 0);
  };

  const meta = [formatViews(video.views), formatDate(video.publishedAt)]
    .filter(Boolean)
    .join(' • ');

  return (
    <main className="pb-44 md:pb-36">
      <div className="mx-auto max-w-3xl px-4 md:px-8 pt-4 md:pt-6">
        <a
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-mist-dark hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          All lectures
        </a>

        <section className="relative liquid-glass rounded-[28px] p-3 md:p-4 overflow-hidden">
          <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/[0.12] via-transparent to-transparent" />
          <div className="relative aspect-video overflow-hidden rounded-[20px] bg-black ring-1 ring-white/15">
            {video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-deep to-ink-800">
                <Music size={56} className="text-brand-light" />
              </div>
            )}
            <button
              onClick={handlePlayPause}
              aria-label={isCurrent && isPlaying ? 'Pause' : 'Play'}
              className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/20"
            >
              <span className="liquid-gold flex h-16 w-16 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95">
                {isLoading && isCurrent ? (
                  <Loader2 size={28} className="animate-spin" />
                ) : isCurrent && isPlaying ? (
                  <Pause size={28} fill="currentColor" />
                ) : (
                  <Play size={28} fill="currentColor" className="ml-1" />
                )}
              </span>
            </button>
          </div>

          <div className="relative px-2 pt-4 pb-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-snug">
              {video.title || 'Untitled lecture'}
            </h1>
            <p className="mt-1.5 text-sm font-medium text-gold/90">
              {video.channelName || 'Islah'}
            </p>
            {(meta || formatDuration(video.duration)) && (
              <p className="mt-1 text-[13px] text-mist-dark tabular-nums">
                {[formatDuration(video.duration), meta].filter(Boolean).join(' • ')}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="liquid-gold flex h-10 items-center gap-2 rounded-full px-5 text-sm font-bold transition-all hover:scale-[1.03] active:scale-95"
              >
                {isCurrent && isPlaying ? (
                  <Pause size={16} fill="currentColor" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
                {isCurrent && isPlaying ? 'Pause' : 'Play'}
              </button>
              <span className={cn('flex h-10 items-center gap-2 rounded-full liquid-chip px-4 text-sm font-bold text-white')}>
                <ShareButton videoId={video.videoId} title={video.title} iconSize={16} />
                Share
              </span>
              <button
                onClick={openIslahBDApp}
                className="islahbd-open-btn flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-all active:scale-95"
              >
                <Smartphone size={15} />
                Open App
              </button>
            </div>
            <p className="mt-3 text-[11px] text-mist-dark break-all">
              Share link: {watchUrl(video.videoId)}
            </p>

            {video.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-mist clamp-2">
                {video.description.slice(0, 400)}
                {video.description.length > 400 ? '…' : ''}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
