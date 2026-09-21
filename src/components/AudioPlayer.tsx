'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
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

function looksLikeHls(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url) || /\/live(\?|$)/i.test(url);
}

/**
 * Hidden playback engine wired to the global player store.
 *
 * Two engines, chosen per track:
 * - YouTube tracks → official embed (no extraction service needed).
 * - Stream tracks (`hlsUrl`/`audioUrl`, e.g. the islahbd live broadcast or
 *   its recording) → `<audio>` + hls.js, with same-origin proxy fallback.
 */
export default function AudioPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const readyRef = useRef(false);
  const trackIdRef = useRef<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const proxyTriedRef = useRef(false);
  const fallbackTriedRef = useRef(false);
  const streamUrlRef = useRef<string | null>(null);

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

  // Keep latest callbacks in refs for event handlers
  const storeRef = useRef({ setCurrentTime, setDuration, setIsPlaying, setIsLoading, playNext });
  storeRef.current = { setCurrentTime, setDuration, setIsPlaying, setIsLoading, playNext };
  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;

  const isStreamTrack = !!currentTrack?.hlsUrl || !!currentTrack?.audioUrl;

  const destroyHls = () => {
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {
        // ignore
      }
      hlsRef.current = null;
    }
  };

  const stopStream = () => {
    destroyHls();
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      } catch {
        // ignore
      }
    }
  };

  const loadStream = (url: string, autoplay: boolean) => {
    const audio = audioRef.current;
    if (!audio) return;
    destroyHls();
    proxyTriedRef.current = false;
    fallbackTriedRef.current = false;
    streamUrlRef.current = url;

    const startPlayback = () => {
      if (autoplay) {
        audio.play().catch((err) => {
          console.error('[AudioPlayer] stream play error:', err);
          storeRef.current.setIsPlaying(false);
          storeRef.current.setIsLoading(false);
        });
      } else {
        storeRef.current.setIsLoading(false);
      }
    };

    if (looksLikeHls(url) && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        // Direct CDN fetch failed (e.g. missing CORS) → retry via proxy
        if (
          data.type === Hls.ErrorTypes.NETWORK_ERROR &&
          !proxyTriedRef.current &&
          !url.startsWith('/api/hls')
        ) {
          proxyTriedRef.current = true;
          console.log('[AudioPlayer] retrying HLS via proxy');
          try {
            hls.loadSource(`/api/hls?url=${encodeURIComponent(url)}`);
            return;
          } catch (err) {
            console.error('[AudioPlayer] proxy retry failed:', err);
          }
        }
        // Live still failing → fall back to the last recording once,
        // so the user gets audio instead of silence.
        const track = usePlayerStore.getState().currentTrack;
        if (track?.isLive && !fallbackTriedRef.current) {
          fallbackTriedRef.current = true;
          console.log('[AudioPlayer] live failed, falling back to recording');
          fetch('/api/live')
            .then((res) => res.json())
            .then((live) => {
              const recUrl: string | undefined = live?.live?.recording?.audioUrl;
              const stillLive = usePlayerStore.getState().currentTrack?.id === 'live';
              // Never fall back onto the URL that just failed (avoids loops).
              if (recUrl && stillLive && recUrl !== streamUrlRef.current) {
                proxyTriedRef.current = true; // skip proxy retry for the mp3
                loadStream(recUrl, true);
              } else {
                storeRef.current.setIsLoading(false);
              }
            })
            .catch(() => storeRef.current.setIsLoading(false));
          return;
        }
        console.error('[AudioPlayer] HLS fatal error:', data);
        storeRef.current.setIsLoading(false);
      });
      hls.loadSource(url);
      hls.attachMedia(audio);
      startPlayback();
    } else {
      // Native HLS (Safari) or progressive file (mp3)
      audio.src = url;
      audio.load();
      startPlayback();
    }
  };

  // Create the hidden YouTube player once
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
              // If a YouTube track was selected before ready, load it now
              const track = usePlayerStore.getState().currentTrack;
              if (track?.videoId && !track.hlsUrl && !track.audioUrl) {
                if (trackIdRef.current !== track.videoId) {
                  trackIdRef.current = track.videoId;
                  storeRef.current.setIsLoading(true);
                  if (playingRef.current) e.target.loadVideoById(track.videoId);
                  else e.target.cueVideoById(track.videoId);
                }
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
      destroyHls();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load a new track when it changes (or stop when cleared)
  useEffect(() => {
    const player = playerRef.current;
    const track = currentTrack;

    // Track cleared (stop button) — halt both engines.
    // NOTE: pause+seek is used instead of YT stopVideo() because stopVideo()
    // can fire an ENDED event that would auto-advance the queue.
    if (!track || (!track.videoId && !track.hlsUrl && !track.audioUrl)) {
      trackIdRef.current = null;
      setIsLoading(false);
      setCurrentTime(0);
      setDuration(0);
      stopStream();
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

    const key = track.hlsUrl || track.audioUrl || track.videoId;
    if (trackIdRef.current === key) return;
    trackIdRef.current = key;

    setIsLoading(true);
    setCurrentTime(0);
    setDuration(track.duration || 0);

    // --- Stream track: pause YouTube, play via <audio> ---
    if (track.hlsUrl || track.audioUrl) {
      if (player && readyRef.current) {
        try {
          player.pauseVideo();
        } catch {
          // ignore
        }
      }
      loadStream(track.hlsUrl || (track.audioUrl as string), playingRef.current);
      return;
    }

    // --- YouTube track: stop stream engine, load embed ---
    stopStream();
    if (player && readyRef.current) {
      try {
        if (playingRef.current) player.loadVideoById(track.videoId);
        else player.cueVideoById(track.videoId);
      } catch (err) {
        console.error('[AudioPlayer] load error:', err);
        setIsLoading(false);
      }
    }
    // If the YT player isn't ready yet, onReady picks the track up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.videoId, currentTrack?.hlsUrl, currentTrack?.audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Play / pause — routed to the active engine
  useEffect(() => {
    if (!currentTrack) return;
    if (currentTrack.hlsUrl || currentTrack.audioUrl) {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
        audio.play().catch((err) => {
          console.error('[AudioPlayer] stream play error:', err);
          setIsPlaying(false);
        });
      } else {
        audio.pause();
      }
      return;
    }
    const player = playerRef.current;
    if (!player || !readyRef.current) return;
    try {
      if (isPlaying) player.playVideo();
      else player.pauseVideo();
    } catch (err) {
      console.error('[AudioPlayer] play/pause error:', err);
    }
  }, [isPlaying, currentTrack, setIsPlaying]);

  // Volume — applied to both engines
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.volume = volume;
      } catch {
        // ignore
      }
    }
    const player = playerRef.current;
    if (!player || !readyRef.current) return;
    try {
      player.setVolume(Math.round(volume * 100));
    } catch {
      // ignore — player may be tearing down
    }
  }, [volume]);

  // Seek requests — routed to the active engine (live edge is not seekable)
  useEffect(() => {
    const onSeek = (e: Event) => {
      const time = (e as CustomEvent<number>).detail;
      if (typeof time !== 'number' || isNaN(time)) return;
      const track = usePlayerStore.getState().currentTrack;
      if (!track) return;
      if (track.isLive) return;
      if (track.hlsUrl || track.audioUrl) {
        const audio = audioRef.current;
        if (!audio) return;
        try {
          audio.currentTime = time;
          storeRef.current.setCurrentTime(time);
        } catch (err) {
          console.error('[AudioPlayer] stream seek error:', err);
        }
        return;
      }
      const player = playerRef.current;
      if (!player || !readyRef.current) return;
      try {
        player.seekTo(time, true);
        storeRef.current.setCurrentTime(time);
      } catch (err) {
        console.error('[AudioPlayer] seek error:', err);
      }
    };

    window.addEventListener(SEEK_EVENT, onSeek as EventListener);

    const id = setInterval(() => {
      const track = usePlayerStore.getState().currentTrack;
      if (!track) return;
      // Stream engine progress
      if (track.hlsUrl || track.audioUrl) {
        const audio = audioRef.current;
        if (!audio) return;
        try {
          storeRef.current.setCurrentTime(audio.currentTime || 0);
          const d = audio.duration;
          if (Number.isFinite(d) && d > 0) storeRef.current.setDuration(d);
        } catch {
          // ignore transient errors during track switches
        }
        return;
      }
      // YouTube engine progress
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

  return (
    <>
      {/* Hidden container — the YT iframe gets injected here */}
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
      {/* Hidden stream element — live HLS + recordings */}
      <audio
        ref={audioRef}
        className="hidden"
        preload="none"
        onPlaying={() => {
          storeRef.current.setIsLoading(false);
          storeRef.current.setIsPlaying(true);
        }}
        onWaiting={() => storeRef.current.setIsLoading(true)}
        onEnded={() => {
          if (usePlayerStore.getState().currentTrack) {
            storeRef.current.playNext();
          }
        }}
        onError={() => {
          // Non-HLS (progressive) failures land here
          storeRef.current.setIsLoading(false);
        }}
      />
    </>
  );
}
