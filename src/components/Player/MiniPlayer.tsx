'use client';

import { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  } = usePlayerStore();

  // Close expanded player on route change
  useEffect(() => {
    setIsExpanded(false);
  }, []);

  // Handle swipe gestures for mobile
  const touchStartY = useRef<number>(0);
  const touchDeltaY = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaY.current = e.touches[0].clientY - touchStartY.current;
  };

  const handleTouchEnd = () => {
    if (touchDeltaY.current < -50) {
      setIsExpanded(true);
    } else if (touchDeltaY.current > 50 && isExpanded) {
      setIsExpanded(false);
    }
    touchDeltaY.current = 0;
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    // Primary engine is the hidden YouTube player (see AudioPlayer).
    window.dispatchEvent(new CustomEvent('islah:seek', { detail: time }));
    // Fallback for any plain <audio> element (legacy / tests).
    const audio = document.querySelector('audio');
    if (audio) {
      audio.currentTime = time;
    }
    setCurrentTime(time);
  };

  // Don't render if no track
  if (!currentTrack) return null;

  // Full Screen Player (Expanded)
  if (isExpanded) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-safe">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 -ml-2 text-white"
          >
            <ChevronDown size={28} />
          </button>
          <span className="text-xs text-gray-400 uppercase tracking-wider">
            Now Playing
          </span>
          <div className="w-10" />
        </div>

        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm aspect-square rounded-lg overflow-hidden shadow-2xl">
            {currentTrack.thumbnail ? (
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#1DB954] flex items-center justify-center">
                <Music size={64} className="text-black" />
              </div>
            )}
          </div>
        </div>

        {/* Track Info */}
        <div className="px-6 py-4">
          <h2 className="text-xl font-bold text-white truncate">{currentTrack.title}</h2>
          <p className="text-gray-400 text-sm truncate">{currentTrack.channelName}</p>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-[#1DB954]"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={playPrevious}
            className="text-white hover:text-[#1DB954] transition-colors"
          >
            <SkipBack size={32} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full bg-[#1DB954] flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isLoading ? (
              <Loader2 size={28} className="animate-spin text-black" />
            ) : isPlaying ? (
              <Pause size={28} fill="black" className="text-black" />
            ) : (
              <Play size={28} fill="black" className="text-black ml-1" />
            )}
          </button>
          <button
            onClick={playNext}
            className="text-white hover:text-[#1DB954] transition-colors"
          >
            <SkipForward size={32} />
          </button>
        </div>

        {/* Bottom padding for safe area */}
        <div className="h-8" />
      </div>
    );
  }

  // Mini Player (collapsed) - Mobile first design (~60px height)
  return (
    <>
      <div
        className={cn(
          'fixed left-0 right-0 z-40 transition-transform duration-300',
          'bottom-16' // Above bottom nav (64px = h-16)
        )}
      >
        <div
          onClick={() => setIsExpanded(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="bg-[#121212] border-t border-[#282828] px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-[#1a1a1a] transition-colors"
        >
          {/* Small Thumbnail */}
          <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-[#1DB954]">
            {currentTrack.thumbnail ? (
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music size={16} className="text-black" />
              </div>
            )}
          </div>

          {/* Track Info - title scrolls if long */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{currentTrack.title}</p>
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin text-black" />
            ) : isPlaying ? (
              <Pause size={14} fill="black" className="text-black" />
            ) : (
              <Play size={14} fill="black" className="text-black ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind mini player */}
      <div className="h-16" />
    </>
  );
}