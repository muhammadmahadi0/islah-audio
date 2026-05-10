'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '@/store/player-store';

interface StreamData {
  url: string;
  title: string;
  thumbnail: string;
  duration: number;
}

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
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
    playNext,
  } = usePlayerStore();

  // Fetch audio stream when track changes
  useEffect(() => {
    if (!currentTrack?.videoId) {
      setStreamUrl(null);
      return;
    }

    const fetchStream = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/stream/${currentTrack.videoId}`);
        const data = await res.json();

        if (data.success && data.data?.url) {
          setStreamUrl(data.data.url);
        } else {
          console.error('[AudioPlayer] Stream fetch failed:', data.error);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[AudioPlayer] Fetch error:', error);
        setIsLoading(false);
      }
    };

    fetchStream();
  }, [currentTrack?.videoId, setIsLoading]);

  // Handle stream URL and playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl) return;

    audio.src = streamUrl;
    audio.load();

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error('[AudioPlayer] Play error:', err);
        setIsPlaying(false);
      });
    }
  }, [streamUrl, isPlaying, setIsPlaying]);

  // Handle play/pause state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl || isLoading) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error('[AudioPlayer] Play error:', err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, streamUrl, isLoading, setIsPlaying]);

  // Handle volume
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

  const handleEnded = () => {
    playNext();
  };

  const handlePlaying = () => {
    setIsLoading(false);
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    console.error('[AudioPlayer] Error:', e);
    setIsLoading(false);
  };

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      onPlaying={handlePlaying}
      onWaiting={handleWaiting}
      onError={handleError}
      crossOrigin="anonymous"
      playsInline
      preload="metadata"
      className="hidden"
    />
  );
}