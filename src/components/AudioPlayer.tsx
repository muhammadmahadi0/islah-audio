'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/player-store';

/**
 * Name of the window CustomEvent used to request a seek.
 * UI components (MiniPlayer, etc.) dispatch:
 *   window.dispatchEvent(new CustomEvent('islah:seek', { detail: seconds }))
 */
export const SEEK_EVENT = 'islah:seek';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<any> | null = null;

function loadYouTubeAPI(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onerror = () => {
      apiPromise = null;
      reject(new Error('Failed to load YouTube player'));
    };
    document.head.appendChild(tag);

    // Safety timeout — don't hang the player forever
    setTimeout(() => {
      if (!window.YT?.Player) {
        apiPromise = null;
        reject(new Error('YouTube player timed out'));
      }
    }, 15000);
  });

  return apiPromise;
}

/**
 * Hidden YouTube embed player wired to the global player store.
 *
 * Why an embed instead of audio-stream extraction?
 * Public extraction APIs (Cobalt v7, Piped, Invidious) are all dead or
 * blocked (HTTP 403/525) as of late 2024, and direct scraping gets blocked
 * on serverless IPs. The official embed always works and needs no backend.
 */
export default function AudioPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const readyRef = useRef(false);
  const trackIdRef = useRef<string | null>(null);

  const {
    currentTrack,
    isPlaying,
    volume,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setIsLoading,
    playNext,
  } = usePlayerStore();

  // Keep latest callbacks in refs for YT event handlers
  const storeRef = useRef({ setCurrentTime, setDuration, setIsPlaying, setIsLoading, playNext });
  storeRef.current = { setCurrentTime, setDuration, setIsPlaying, setIsLoading, playNext };
  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;

  // Create the hidden player once
  useEffect(() => {
    let cancelled = false;

    loadYouTubeAPI()
      .then((YT) => {
        if (cancelled || !containerRef.current || playerRef.current) return;

        playerRef.current = new YT.Player(containerRef.current, {
          height: '0',
          width: '0',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: (e: any) => {
              readyRef.current = true;
              e.target.setVolume(Math.round(usePlayerStore.getState().volume * 100));
              // If a track was selected before the player was ready, load it now
              const track = usePlayerStore.getState().currentTrack;
              if (track?.videoId && trackIdRef.current !== track.videoId) {
                trackIdRef.current = track.videoId;
                storeRef.current.setIsLoading(true);
                if (playingRef.current) e.target.loadVideoById(track.videoId);
                else e.target.cueVideoById(track.videoId);
              }
            },
            onStateChange: (e: any) => {
              const YTNS = window.YT?.PlayerState;
              const s = storeRef.current;
              switch (e.data) {
                case YTNS?.PLAYING:
                  s.setIsPlaying(true);
                  s.setIsLoading(false);
                  break;
                case YTNS?.PAUSED:
                  s.setIsPlaying(false);
                  break;
                case YTNS?.BUFFERING:
                  s.setIsLoading(true);
                  break;
                case YTNS?.CUED:
                  s.setIsLoading(false);
                  if (playingRef.current) e.target.playVideo();
                  break;
                case YTNS?.ENDED:
                  s.setIsPlaying(false);
                  // Only auto-advance if a track is still active
                  // (the stop button clears it — don't resume the queue).
                  if (usePlayerStore.getState().currentTrack) {
                    s.playNext();
                  }
                  break;
              }
            },
            onError: () => {
              // Unplayable video (removed, region-blocked, embed-restricted):
              // stop the spinner and skip to the next track.
              storeRef.current.setIsLoading(false);
              storeRef.current.playNext();
            },
          },
        });
      })
      .catch((err) => {
        console.error('[AudioPlayer]', err);
        storeRef.current.setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load a new track when it changes (or stop when cleared)
  useEffect(() => {
    const player = playerRef.current;
    const videoId = currentTrack?.videoId;

    // Track cleared (stop button) — halt the embed immediately.
    // NOTE: pause+seek is used instead of stopVideo() because stopVideo()
    // can fire an ENDED event that would auto-advance the queue.
    if (!videoId) {
      trackIdRef.current = null;
      setIsLoading(false);
      setCurrentTime(0);
      if (player && readyRef.current) {
        try {
          player.pauseVideo();
          player.seekTo(0, true);
        } catch {
          // ignore — player may be tearing down
        }
      }
      return;
    }

    if (trackIdRef.current === videoId) return;
    trackIdRef.current = videoId;

    setIsLoading(true);
    setCurrentTime(0);

    if (player && readyRef.current) {
      try {
        if (playingRef.current) player.loadVideoById(videoId);
        else player.cueVideoById(videoId);
      } catch (err) {
        console.error('[AudioPlayer] load error:', err);
        setIsLoading(false);
      }
    }
    // If the player isn't ready yet, onReady picks the track up.
  }, [currentTrack?.videoId, setIsLoading, setCurrentTime]); // eslint-disable-line react-hooks/exhaustive-deps

  // Play / pause
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !readyRef.current || !currentTrack) return;
    try {
      if (isPlaying) player.playVideo();
      else player.pauseVideo();
    } catch (err) {
      console.error('[AudioPlayer] play/pause error:', err);
    }
  }, [isPlaying, currentTrack]);

  // Volume
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !readyRef.current) return;
    try {
      player.setVolume(Math.round(volume * 100));
    } catch {
      // ignore — player may be tearing down
    }
  }, [volume]);

  // Progress polling + seek requests
  useEffect(() => {
    const onSeek = (e: Event) => {
      const player = playerRef.current;
      if (!player || !readyRef.current) return;
      const time = (e as CustomEvent<number>).detail;
      if (typeof time !== 'number' || isNaN(time)) return;
      try {
        player.seekTo(time, true);
        storeRef.current.setCurrentTime(time);
      } catch (err) {
        console.error('[AudioPlayer] seek error:', err);
      }
    };

    window.addEventListener(SEEK_EVENT, onSeek as EventListener);

    const id = setInterval(() => {
      const player = playerRef.current;
      if (!player || !readyRef.current) return;
      try {
        if (typeof player.getCurrentTime === 'function') {
          storeRef.current.setCurrentTime(player.getCurrentTime() || 0);
        }
        if (typeof player.getDuration === 'function') {
          const d = player.getDuration() || 0;
          if (d > 0) storeRef.current.setDuration(d);
        }
      } catch {
        // ignore transient errors during track switches
      }
    }, 500);

    return () => {
      window.removeEventListener(SEEK_EVENT, onSeek as EventListener);
      clearInterval(id);
    };
  }, []);

  // Hidden container — the iframe gets injected here by the YT API
  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    />
  );
}
