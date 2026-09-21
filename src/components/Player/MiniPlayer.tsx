'use client';

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
    setCurrentTime,
    setIsPlaying,
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

  /* ---------------- Full-screen player ---------------- */
  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-ink-950">
        {/* Blurred artwork backdrop */}
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

        <div className="relative flex flex-col h-full max-w-lg w-full mx-auto">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 -ml-2 rounded-full text-white/80 hover:bg-white/10 transition-colors"
              aria-label="Collapse player"
            >
              <ChevronDown size={28} />
            </button>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold">
              Now Playing
            </span>
            <div className="w-10" />
          </div>

          <div className="flex-1 flex items-center justify-center px-10 min-h-0">
            <div className="w-full aspect-square rounded-3xl overflow-hidden shadow-card ring-1 ring-white/15">
              {currentTrack.thumbnail ? (
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-deep to-ink-800 flex items-center justify-center">
                  <Music size={64} className="text-brand-light" />
                </div>
              )}
            </div>
          </div>

          <div className="px-7 pt-5">
            <h2 className="text-xl font-extrabold text-white tracking-tight clamp-2">
              {currentTrack.title}
            </h2>
            <p className="text-gold/90 text-sm font-medium mt-1 truncate">
              {currentTrack.channelName}
            </p>
          </div>

          <div className="px-7 pt-4">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full"
              style={{ '--fill': `${progress}%` } as React.CSSProperties}
              aria-label="Seek"
            />
            <div className="flex justify-between text-xs font-medium text-mist mt-1.5 tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="px-7 pt-3 pb-10 flex items-center justify-center gap-8">
            <button
              onClick={playPrevious}
              className="p-2 text-white/80 hover:text-white transition-colors"
              aria-label="Previous"
            >
              <SkipBack size={30} fill="currentColor" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-brand-light to-brand-dark flex items-center justify-center shadow-glow-lg hover:scale-105 active:scale-95 transition-transform"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <Loader2 size={30} className="animate-spin text-ink-950" />
              ) : isPlaying ? (
                <Pause size={30} fill="#060D0A" className="text-ink-950" />
              ) : (
                <Play size={30} fill="#060D0A" className="text-ink-950 ml-1" />
              )}
            </button>
            <button
              onClick={playNext}
              className="p-2 text-white/80 hover:text-white transition-colors"
              aria-label="Next"
            >
              <SkipForward size={30} fill="currentColor" />
            </button>
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
        // Mobile: floating card above the bottom nav
        'inset-x-3 bottom-[76px]',
        // Desktop: floating card clear of the sidebar
        'md:left-[280px] lg:left-[304px] md:right-6 md:bottom-6 md:inset-x-auto'
      )}
    >
      <div
        onClick={() => setIsExpanded(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="glass relative overflow-hidden rounded-2xl border border-white/10 shadow-card px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:border-brand/40 transition-colors"
      >
        {/* Progress hairline */}
        <span className="absolute top-0 left-3 right-3 h-[2px] rounded-full bg-white/10 overflow-hidden">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-brand to-gold transition-[width]"
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
          <p className="text-white text-sm font-semibold truncate">
            {currentTrack.title}
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
