'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Hls from 'hls.js';
import { usePlayerStore, type Track } from '@/store/player-store';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Loader2,
  Moon,
  Clock,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SleepTimerOption {
  label: string;
  minutes: number;
}

const SLEEP_TIMER_OPTIONS: SleepTimerOption[] = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: '1.5 hours', minutes: 90 },
  { label: '2 hours', minutes: 120 },
];

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isBuffering, setIsBuffering] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null);

  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setIsLoading,
    setVolume,
    playNext,
    playPrevious,
  } = usePlayerStore();

  // Fetch audio stream URL when track changes
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTrack?.videoId) return;

    const fetchAudioStream = async () => {
      try {
        const response = await fetch(`/api/audio?videoId=${currentTrack.videoId}`);
        const data = await response.json();

        if (data.success && data.data?.audioUrl) {
          setStreamUrl(data.data.audioUrl);
        } else {
          console.error('Failed to get audio URL:', data.error);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching audio stream:', error);
        setIsLoading(false);
      }
    };

    fetchAudioStream();
  }, [currentTrack?.videoId, setIsLoading]);

  // Initialize HLS.js when stream URL is available
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsLoading(true);
    setIsBuffering(true);

    // Check if HLS is supported
    if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
      const hls = new Hls({
        defaultAudioCodec: 'mp4a.40.2',
        startLevel: 0,
        autoStartLoad: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(audio);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        setIsBuffering(false);
        if (hls.levels.length > 0) {
          hls.currentLevel = 0;
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        setIsBuffering(false);
      });

      hlsRef.current = hls;
    }
    // Direct audio URL (for non-HLS streams)
    else {
      audio.src = streamUrl;
      setIsLoading(false);
      setIsBuffering(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, setIsLoading]);

  // Handle play/pause state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || !streamUrl) return;

    if (isPlaying && !isLoading) {
      audio.play().catch((err) => {
        console.error('Play error:', err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack, streamUrl, isLoading, setIsPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Sleep timer countdown
  useEffect(() => {
    if (sleepTimeRemaining === null || sleepTimeRemaining <= 0) {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
        sleepTimerRef.current = null;
      }
      if (sleepTimeRemaining === 0) {
        setIsPlaying(false);
        setSleepTimeRemaining(null);
      }
      return;
    }

    const interval = setInterval(() => {
      setSleepTimeRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimeRemaining, setIsPlaying]);

  // Event handlers
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [setCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, [setDuration]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSleepTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setVolume(volume === 0 ? 0.8 : 0);
  };

  const handleSetSleepTimer = (minutes: number) => {
    setSleepTimeRemaining(minutes * 60);
    setShowSleepTimer(false);

    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
    }

    sleepTimerRef.current = setTimeout(() => {
      setSleepTimeRemaining(null);
      setIsPlaying(false);
    }, minutes * 60 * 1000);
  };

  const handleCancelSleepTimer = () => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    setSleepTimeRemaining(null);
  };

  // Empty state
  if (!currentTrack) {
    return (
      <div className="h-[90px] bg-[#181818] border-t border-[#282828] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#727272]">
          <Music size={20} />
          <p className="text-sm">Select a lecture to start playing</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={playNext}
        onPlaying={() => {
          setIsLoading(false);
          setIsBuffering(false);
        }}
        onWaiting={() => setIsBuffering(true)}
        onError={(e) => console.error('Audio error:', e)}
        crossOrigin="anonymous"
      />

      {/* Player UI */}
      <div className="h-[90px] bg-[#181818] border-t border-[#282828] flex items-center px-4">
        {/* Track Info - Left */}
        <div className="flex items-center gap-4 w-1/4 min-w-0">
          {currentTrack.thumbnail ? (
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-14 h-14 rounded object-cover"
            />
          ) : (
            <div className="w-14 h-14 bg-[#282828] rounded flex items-center justify-center">
              <Music size={24} className="text-[#727272]" />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-white text-sm font-medium truncate">
              {currentTrack.title}
            </h4>
            <p className="text-[#727272] text-xs truncate">
              {currentTrack.channelName}
            </p>
          </div>
        </div>

        {/* Controls - Center */}
        <div className="flex flex-col items-center flex-1 max-w-[40%]">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={playPrevious}
              className="text-[#b3b3b3] hover:text-white transition-colors"
              title="Previous"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform relative"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading || isBuffering ? (
                <Loader2 size={18} className="animate-spin text-black" />
              ) : isPlaying ? (
                <Pause size={18} fill="black" />
              ) : (
                <Play size={18} fill="black" className="ml-0.5" />
              )}
            </button>
            <button
              onClick={playNext}
              className="text-[#b3b3b3] hover:text-white transition-colors"
              title="Next"
            >
              <SkipForward size={20} />
            </button>
          </div>
          <div className="w-full flex items-center gap-2 player-progress">
            <span className="text-xs text-[#727272] w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-[#4d4d4d] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:opacity-0 [&hover::-webkit-slider-thumb]:opacity-100"
              disabled={!currentTrack}
            />
            <span className="text-xs text-[#727272] w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume & Sleep Timer - Right */}
        <div className="flex items-center gap-3 w-1/4 justify-end">
          {/* Sleep Timer */}
          <div className="relative">
            <button
              onClick={() => setShowSleepTimer(!showSleepTimer)}
              className={cn(
                'transition-colors',
                sleepTimeRemaining !== null
                  ? 'text-[#1DB954]'
                  : 'text-[#b3b3b3] hover:text-white'
              )}
              title={sleepTimeRemaining !== null ? 'Sleep timer active' : 'Sleep timer'}
            >
              <Moon size={20} />
            </button>

            {/* Sleep Timer Dropdown */}
            {showSleepTimer && (
              <div className="absolute bottom-full right-0 mb-2 bg-[#282828] rounded-lg shadow-xl overflow-hidden min-w-[140px]">
                <div className="p-3 border-b border-[#3e3e3e]">
                  <p className="text-white text-sm font-medium">Sleep Timer</p>
                </div>
                {sleepTimeRemaining !== null ? (
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[#1DB954]">
                        <Clock size={16} />
                        <span className="text-sm font-medium">
                          {formatSleepTime(sleepTimeRemaining)}
                        </span>
                      </div>
                      <button
                        onClick={handleCancelSleepTimer}
                        className="p-1 hover:bg-[#3e3e3e] rounded transition-colors"
                        title="Cancel timer"
                      >
                        <X size={16} className="text-[#b3b3b3]" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-1">
                    {SLEEP_TIMER_OPTIONS.map((option) => (
                      <button
                        key={option.minutes}
                        onClick={() => handleSetSleepTimer(option.minutes)}
                        className="w-full px-3 py-2 text-left text-[#b3b3b3] hover:text-white hover:bg-[#3e3e3e] transition-colors text-sm"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Volume */}
          <button
            onClick={toggleMute}
            className="text-[#b3b3b3] hover:text-white transition-colors"
            title={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-[#4d4d4d] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:opacity-0 [&hover::-webkit-slider-thumb]:opacity-100"
          />
        </div>
      </div>

      {/* Click outside to close sleep timer */}
      {showSleepTimer && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowSleepTimer(false)}
        />
      )}
    </>
  );
}