'use client';

import { useState } from 'react';
import { usePlayerStore } from '@/store/player-store';
import { Play, Pause, SkipForward, ChevronUp, Music, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FloatingPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    setIsPlaying,
    playNext,
  } = usePlayerStore();

  if (!currentTrack) return null;

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (isExpanded) {
    return (
      <motion.div
        className="fixed inset-0 bg-black z-50 flex flex-col"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
      >
        <div className="flex items-center justify-between p-4 pt-12">
          <button onClick={() => setIsExpanded(false)} className="p-2">
            <ChevronUp size={28} />
          </button>
          <span className="text-xs text-[#b3b3b3] uppercase">Now Playing</span>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm aspect-square rounded-lg overflow-hidden">
            {currentTrack.thumbnail ? (
              <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                <Music size={64} className="text-[#727272]" />
              </div>
            )}
          </div>
        </div>

        <div className="px-6">
          <h2 className="text-xl font-bold truncate">{currentTrack.title}</h2>
          <p className="text-[#b3b3b3] text-sm truncate">{currentTrack.channelName}</p>
        </div>

        <div className="px-6 py-4">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              window.dispatchEvent(new CustomEvent('islah:seek', { detail: time }));
              const audio = document.querySelector('audio');
              if (audio) audio.currentTime = time;
            }}
            className="w-full h-1 bg-[#4d4d4d] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
          <div className="flex justify-between text-xs text-[#b3b3b3] mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="px-6 pb-12 flex items-center justify-between">
          <button onClick={playNext} className="text-white"><SkipForward size={28} /></button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center"
          >
            {isLoading ? <Loader2 size={28} className="animate-spin" /> : isPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" className="ml-1" />}
          </button>
          <div className="w-7" />
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        className="fixed left-2 right-2 bottom-[72px] md:bottom-0 z-40"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
      >
        <div
          onClick={() => setIsExpanded(true)}
          className="bg-[#282828] rounded-md p-3 flex items-center gap-3 cursor-pointer hover:bg-[#333333] active:scale-[0.98] transition-colors"
        >
          <div className="w-12 h-12 rounded overflow-hidden bg-[#333333] flex-shrink-0">
            {currentTrack.thumbnail ? (
              <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Music size={20} className="text-[#727272]" /></div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{currentTrack.title}</p>
            <p className="text-[#b3b3b3] text-xs truncate">{currentTrack.channelName}</p>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" className="ml-0.5" />}
          </button>
        </div>
      </motion.div>

      <div className="h-24 md:hidden" />
    </>
  );
}