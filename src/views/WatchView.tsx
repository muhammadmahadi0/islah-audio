import { useEffect, useMemo, useState } from 'react';
import { usePlayerStore, type Track } from '@/store/player-store';
import {
  Play,
  Pause,
  Loader2,
  ArrowLeft,
  Music,
  Smartphone,
  Share2,
  Link2,
  Check,
  MessageCircle,
  Send,
  Facebook,
  Twitter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { shareNative, copyLink, shareTargets } from '@/lib/share';
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
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const targets = useMemo(
    () => shareTargets(video.videoId, video.title),
    [video.videoId, video.title]
  );

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

  // Share: native sheet (suggests WhatsApp + other apps). If the browser
  // has no share sheet, open the fallback menu with direct app links.
  const handleShare = async () => {
    const result = await shareNative(video.videoId, video.title);
    if (result === 'unsupported') setShareMenuOpen((v) => !v);
    else setShareMenuOpen(false);
  };

  // Copy Link: always copies the share URL, with checkmark feedback.
  const handleCopyLink = async () => {
    const ok = await copyLink(video.videoId);
    setCopyState(ok ? 'copied' : 'failed');
    setTimeout(() => setCopyState('idle'), 1600);
  };

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
              <span className={cn('relative flex h-10 items-center gap-2 rounded-full liquid-chip px-4 text-sm font-bold text-white')}>
                <button
                  onClick={handleShare}
                  aria-label="Share via apps"
                  title="Share via apps"
                  className="flex items-center gap-2"
                >
                  <Share2 size={16} />
                  Share
                </button>
                {shareMenuOpen && (
                  <>
                    <button
                      aria-label="Close share menu"
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setShareMenuOpen(false)}
                    />
                    <span className="absolute bottom-full mb-2 left-0 z-20 w-52 overflow-hidden rounded-2xl liquid-glass py-1.5 animate-fade-up">
                      <a
                        href={targets.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                      >
                        <MessageCircle size={16} className="text-green-400 shrink-0" />
                        WhatsApp
                      </a>
                      <a
                        href={targets.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                      >
                        <Send size={16} className="text-sky-400 shrink-0" />
                        Telegram
                      </a>
                      <a
                        href={targets.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                      >
                        <Facebook size={16} className="text-blue-400 shrink-0" />
                        Facebook
                      </a>
                      <a
                        href={targets.x}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                      >
                        <Twitter size={16} className="text-mist shrink-0" />X
                      </a>
                    </span>
                  </>
                )}
              </span>
              <button
                onClick={handleCopyLink}
                aria-label={copyState === 'copied' ? 'Link copied' : 'Copy link'}
                title={copyState === 'copied' ? 'Link copied!' : 'Copy link'}
                className="flex h-10 items-center gap-2 rounded-full liquid-chip px-4 text-sm font-bold text-white transition-all"
              >
                {copyState === 'copied' ? (
                  <Check size={16} className="text-brand-light" strokeWidth={3} />
                ) : (
                  <Link2 size={16} />
                )}
                {copyState === 'copied' ? 'Copied!' : copyState === 'failed' ? 'Failed' : 'Copy Link'}
              </button>
              <button
                onClick={openIslahBDApp}
                className="islahbd-open-btn flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-all active:scale-95"
              >
                <Smartphone size={15} />
                Open App
              </button>
            </div>

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
