'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Hls from 'hls.js';
import { usePlayerStore } from '@/store/player-store';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Player() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);

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

  // Initialize HLS.js when track changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentTrack) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = currentTrack.hlsUrl || currentTrack.audioUrl;
    if (!streamUrl) {
      console.error('No stream URL available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsBuffering(true);

    // Check if HLS is supported
    if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
      const hls = new Hls({
        // Prefer lowest bitrate for audio-only playback
        defaultAudioCodec: 'mp4a.40.2',
        startLevel: 0, // Start with lowest quality (360p or lower)
        // Enable auto level selection but prefer lower
        autoStartLoad: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        setIsBuffering(false);
        // Force lowest bitrate by selecting level 0
        if (hls.levels.length > 0) {
          hls.currentLevel = 0;
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try to recover by restarting load
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
    // Native HLS support (Safari)
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      setIsLoading(false);
      setIsBuffering(false);
    }
    // Direct file URL (MP4, etc.)
    else {
      video.src = streamUrl;
      setIsLoading(false);
      setIsBuffering(false);
    }

    // Cleanup on unmount or track change
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentTrack?.hlsUrl, currentTrack?.audioUrl, currentTrack?.id]);

  // Handle play/pause state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentTrack) return;

    if (isPlaying && !isLoading) {
      video.play().catch((err) => {
        console.error('Play error:', err);
        setIsPlaying(false);
      });
    } else {
      video.pause();
    }
  }, [isPlaying, currentTrack, isLoading, setIsPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // Event handlers
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [setCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, [setDuration]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
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

  const toggleMute = () => {
    setVolume(volume === 0 ? 0.8 : 0);
  };

  // Empty state - no track selected
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
      {/* Hidden video element - handles HLS via hls.js */}
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={playNext}
        onPlaying={() => {
          setIsLoading(false);
          setIsBuffering(false);
        }}
        onWaiting={() => setIsBuffering(true)}
        onError={(e) => console.error('Video error:', e)}
        className="hidden"
        muted
        playsInline
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

        {/* Volume - Right */}
        <div className="flex items-center gap-3 w-1/4 justify-end">
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
    </>
  );
}