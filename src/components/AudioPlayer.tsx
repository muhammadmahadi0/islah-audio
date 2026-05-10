'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { usePlayerStore } from '@/store/player-store';

interface AudioPlayerProps {
  className?: string;
}

export default function AudioPlayer({ className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const {
    currentTrack,
    isPlaying,
    isLoading,
    volume,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setIsLoading,
    setVolume,
  } = usePlayerStore();

  // Fetch audio stream URL when track changes
  useEffect(() => {
    if (!currentTrack?.videoId) {
      setStreamUrl(null);
      return;
    }

    const fetchAudioStream = async () => {
      try {
        // Use Consumet API for audio stream
        const response = await fetch(`/api/audio/${currentTrack.videoId}`);
        const data = await response.json();

        if (data.success && data.data?.url) {
          setStreamUrl(data.data.url);
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

      hlsRef.current = hls;
    }
    // Direct audio URL (for non-HLS streams)
    else {
      audio.src = streamUrl;
      setIsLoading(false);
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

  // Event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // This component is hidden - MiniPlayer handles all UI
  // Only render the audio element
  return (
    <audio
      ref={audioRef}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={() => {
        // Trigger next track via store
        const { playNext } = usePlayerStore.getState();
        playNext();
      }}
      onPlaying={() => {
        setIsLoading(false);
      }}
      onWaiting={() => setIsLoading(true)}
      onError={(e) => console.error('Audio error:', e)}
      crossOrigin="anonymous"
      playsInline
      preload="metadata"
      className="hidden"
    />
  );
}