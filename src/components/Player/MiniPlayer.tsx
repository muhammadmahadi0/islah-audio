import { useState, useRef } from 'react';
import { usePlayerStore } from '@/store/player-store';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronUp,
  ChevronDown,
  Music,
  Loader2,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function EqBars({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-end gap-[3px] h-4 text-brand-light', className)}>
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

export default function MiniPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    playlist,
    playlistIndex,
    setCurrentTime,
    setIsPlaying,
    setVolume,
    playNext,
    playPrevious,
    stop,
  } = usePlayerStore();

  const touchStartY = useRef<number>(0);
  const touchDeltaY = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaY.current = e.touches[0].clientY - touchStartY.current;
  };
  const handleTouchEnd = () => {
    if (touchDeltaY.current < -50) setIsExpanded(true);
    else if (touchDeltaY.current > 50 && isExpanded) setIsExpanded(false);
    touchDeltaY.current = 0;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    window.dispatchEvent(new CustomEvent('islah:seek', { detail: time }));
    const audio = document.querySelector('audio');
    if (audio) audio.currentTime = time;
    setCurrentTime(time);
  };

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  if (!currentTrack) return null;

  const isLive = !!currentTrack.isLive;

  /* ---------------- Full-screen player (Material 3) ---------------- */
  if (isExpanded) {
    const queueTotal = playlist.length;
    const queuePos = playlistIndex >= 0 ? playlistIndex + 1 : null;

    return (
      <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-ink-950">
        {/* Blurred artwork backdrop + tonal scrim */}
        {currentTrack.thumbnail && (
          <>
            <img
              src={currentTrack.thumbnail}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-25 blur-[80px] scale-125"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-ink-950/80 to-ink-950" />
          </>
        )}

        <div className="relative mx-auto flex h-full w-full max-w-md flex-col px-5 pb-8 pt-3 safe-bottom">
          {/* M3 top app bar: collapse • title • stop */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15 active:scale-95"
              aria-label="Collapse player"
            >
              <ChevronDown size={22} />
            </button>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-mist">
                Now playing
              </p>
              {queueTotal > 1 && queuePos !== null && (
                <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-mist-dark">
                  {queuePos} of {queueTotal}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setIsExpanded(false);
                stop();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-500 transition-colors hover:bg-red-500/25 active:scale-95"
              aria-label="Stop and close player"
              title="Stop"
            >
              <X size={20} />
            </button>
          </div>

          {/* M3 hero art — large rounded shape */}
          <div className="flex min-h-0 flex-1 items-center justify-center py-4">
            <div className="aspect-square w-full overflow-hidden rounded-[28px] shadow-card ring-1 ring-white/15">
              {currentTrack.thumbnail ? (
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-deep to-ink-800">
                  <Music size={64} className="text-brand-light" />
                </div>
              )}
            </div>
          </div>

          {/* Title block */}
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                Live
              </span>
            )}
            <h2 className="clamp-2 text-[22px] font-bold leading-snug tracking-tight text-white">
              {currentTrack.title}
            </h2>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-gold/90">
            {currentTrack.channelName}
          </p>

          {/* M3 slider */}
          <div className="pt-3">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              disabled={isLive}
              className={cn('w-full', isLive && 'opacity-40')}
              style={{ '--fill': `${progress}%` } as React.CSSProperties}
              aria-label="Seek"
            />
            <div className="mt-1 flex justify-between text-xs font-medium tabular-nums text-mist">
              <span>{isLive ? 'LIVE' : formatTime(currentTime)}</span>
              <span>{isLive ? '' : formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls: tonal side buttons + FAB */}
          <div className="flex items-center justify-between px-1 pt-2">
            <button
              onClick={playPrevious}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/15 active:scale-95"
              aria-label="Previous"
            >
              <SkipBack size={24} fill="currentColor" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br from-brand-light to-brand-dark text-ink-950 shadow-glow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <Loader2 size={32} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={32} fill="currentColor" />
              ) : (
                <Play size={32} fill="currentColor" className="ml-1" />
              )}
            </button>
            <button
              onClick={playNext}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/15 active:scale-95"
              aria-label="Next"
            >
              <SkipForward size={24} fill="currentColor" />
            </button>
          </div>

          {/* M3 volume row */}
          <div className="flex items-center gap-3 px-1 pt-4">
            <button
              onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-mist transition-colors hover:bg-white/15 hover:text-white"
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            >
              {volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full"
              style={{ '--fill': `${Math.round(volume * 100)}%` } as React.CSSProperties}
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Floating mini player ---------------- */
  return (
    <div
      className={cn(
        'fixed z-40',
        // Mobile: floating pill above the bottom nav pill
        'inset-x-4 bottom-[86px]',
        // Desktop: floating card clear of the sidebar
        'md:left-[280px] lg:left-[304px] md:right-6 md:bottom-6 md:inset-x-auto'
      )}
    >
      <div
        onClick={() => setIsExpanded(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="glass relative overflow-hidden rounded-[28px] border border-white/10 shadow-card px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-brand/40 transition-colors"
      >
        {/* Progress hairline */}
        <span className="absolute top-0 left-3 right-3 h-[2px] rounded-full bg-white/10 overflow-hidden">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-gold-light to-gold transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </span>

        <div className="w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-brand/15 ring-1 ring-white/10">
          {currentTrack.thumbnail ? (
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music size={18} className="text-brand-light" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="flex items-center gap-1.5 text-white text-sm font-semibold truncate">
            {isLive && (
              <span className="flex items-center gap-1 rounded-full bg-red-500 px-1.5 py-px text-[9px] font-extrabold uppercase tracking-widest text-white shrink-0">
                <span className="h-1 w-1 rounded-full bg-white animate-pulse" />
                Live
              </span>
            )}
            <span className="truncate">{currentTrack.title}</span>
          </p>
          <div className="flex items-center gap-2">
            <p className="text-mist-dark text-xs truncate">{currentTrack.channelName}</p>
            {isPlaying && <EqBars />}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(!isPlaying);
          }}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-light to-brand-dark flex items-center justify-center shrink-0 shadow-glow hover:scale-105 active:scale-95 transition-transform"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-ink-950" />
          ) : isPlaying ? (
            <Pause size={16} fill="#060D0A" className="text-ink-950" />
          ) : (
            <Play size={16} fill="#060D0A" className="text-ink-950 ml-0.5" />
          )}
        </button>

        {/* Stop everything + dismiss */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(false);
            stop();
          }}
          className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center shrink-0 text-mist-dark hover:text-white hover:border-white/30 hover:bg-white/10 transition-colors"
          aria-label="Stop and close player"
          title="Stop"
        >
          <X size={14} />
        </button>

        <span className="hidden sm:flex text-mist-dark">
          <ChevronUp size={18} />
        </span>
      </div>
    </div>
  );
}
