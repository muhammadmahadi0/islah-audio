import { useEffect, useRef } from 'react';
import type Hls from 'hls.js';
import { usePlayerStore } from '@/store/player-store';
import { SEEK_EVENT } from '@/lib/yt-engine';

function looksLikeHls(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url) || /\/live(\?|$)/i.test(url);
}

/**
 * Stream playback engine: `<audio>` + hls.js for live HLS + recordings
 * (tracks carrying `hlsUrl`/`audioUrl`).
 *
 * YouTube lecture tracks are owned by the YT engine in
 * `src/lib/yt-engine.ts` (mounted inside MiniPlayer) — this component only
 * makes sure the stream engine is stopped when such a track plays.
 */
export default function AudioPlayer() {
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

  // hls.js is ~500KB — never bundle it. It loads on demand at first HLS
  // play, and is prefetched on browser idle below so that first live-tap
  // doesn't pay the full download before audio can start.
  const hlsModuleRef = useRef<typeof Hls | null>(null);
  const loadHlsModule = async (): Promise<typeof Hls | null> => {
    if (hlsModuleRef.current) return hlsModuleRef.current;
    try {
      const mod = await import('hls.js');
      hlsModuleRef.current = mod.default;
      return mod.default;
    } catch (err) {
      console.error('[AudioPlayer] hls.js load failed:', err);
      return null;
    }
  };

  // Prefetch hls.js once the browser is idle — skipped on data-saver or
  // very slow connections so we never spend a user's mobile data unasked.
  useEffect(() => {
    let idleId: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
      const conn = navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      };
      if (conn.connection?.saveData) return;
      const slow = conn.connection?.effectiveType;
      if (slow === 'slow-2g' || slow === '2g') return;
    } catch {
      return;
    }
    const prefetch = () => {
      if (!hlsModuleRef.current) void loadHlsModule();
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(prefetch, { timeout: 10000 });
    } else {
      timer = setTimeout(prefetch, 6000);
    }
    return () => {
      if (idleId !== null && 'cancelIdleCallback' in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStream = async (url: string, autoplay: boolean) => {
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

    if (!looksLikeHls(url)) {
      // Progressive file (mp3) — no hls.js needed
      audio.src = url;
      audio.load();
      startPlayback();
      return;
    }

    // HLS: Safari plays natively (canPlayType check — no download);
    // everywhere else lazy-loads hls.js on first use.
    // Stale-track guard: if the user switched tracks while importing,
    // abandon this load instead of hijacking the new stream.
    const wantedUrl = url;
    const nativeHls =
      typeof audio.canPlayType === 'function' &&
      audio.canPlayType('application/vnd.apple.mpegurl') !== '';
    if (nativeHls) {
      audio.src = url;
      audio.load();
      startPlayback();
      return;
    }
    const HlsCtor = await loadHlsModule();
    if (!HlsCtor || streamUrlRef.current !== wantedUrl) return;
    if (!HlsCtor.isSupported()) {
      // No MSE at all — last resort: try native anyway.
      audio.src = url;
      audio.load();
      startPlayback();
      return;
    }
    {
      const hls = new HlsCtor({ enableWorker: true });
      hlsRef.current = hls;
      hls.on(HlsCtor.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        // Direct CDN fetch failed (e.g. missing CORS) → retry via proxy
        if (
          data.type === HlsCtor.ErrorTypes.NETWORK_ERROR &&
          !proxyTriedRef.current &&
          !url.startsWith('/api/hls')
        ) {
          proxyTriedRef.current = true;
          console.log('[AudioPlayer] retrying HLS via proxy');
          try {
            hls.loadSource(`/api/hls/${encodeURIComponent(url)}`);
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
                void loadStream(recUrl, true);
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
    }
  };

  // Load a stream track when it changes; stop the stream engine otherwise
  // (the YT engine in MiniPlayer owns YouTube tracks).
  useEffect(() => {
    const track = currentTrack;
    const streamUrl = track?.hlsUrl || track?.audioUrl;

    if (!streamUrl) {
      // Reset so tapping the same stream again after stop reloads it.
      // Without this, streamUrlRef still holds the old URL and the
      // equality check below bails out — leaving isLoading stuck on.
      streamUrlRef.current = null;
      stopStream();
      return;
    }

    if (streamUrlRef.current === streamUrl) return;

    setIsLoading(true);
    setCurrentTime(0);
    setDuration(track?.duration || 0);
    void loadStream(streamUrl, playingRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.hlsUrl, currentTrack?.audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Play / pause for stream tracks
  useEffect(() => {
    const streamUrl = currentTrack?.hlsUrl || currentTrack?.audioUrl;
    if (!streamUrl) return;
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
  }, [isPlaying, currentTrack, setIsPlaying]);

  // Screen Wake Lock — keep the screen on while anything is playing
  // (both YT lectures and streams; this island is always mounted).
  // The lock auto-releases when the tab hides, so re-request on visible.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (type: string) => Promise<{ release: () => Promise<void> }> };
        };
        if (!nav.wakeLock) return;
        if (document.visibilityState !== 'visible') return;
        if (!playingRef.current || !usePlayerStore.getState().currentTrack) return;
        if (lock) return;
        const l = await nav.wakeLock.request('screen');
        if (!cancelled) lock = l;
        else await l.release().catch(() => {});
      } catch {
        // Unsupported / denied / not allowed — playback works fine without it.
      }
    };

    const release = async () => {
      const l = lock;
      lock = null;
      if (l) {
        try {
          await l.release();
        } catch {
          // ignore — already released
        }
      }
    };

    if (isPlaying && currentTrack) void request();
    else void release();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void release();
    };
  }, [isPlaying, currentTrack]);

  // Volume for the stream element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.volume = volume;
      } catch {
        // ignore
      }
    }
  }, [volume]);

  // Seek requests for stream tracks (live edge is not seekable)
  useEffect(() => {
    const onSeek = (e: Event) => {
      const time = (e as CustomEvent<number>).detail;
      if (typeof time !== 'number' || isNaN(time)) return;
      const track = usePlayerStore.getState().currentTrack;
      if (!track || track.isLive) return;
      if (!track.hlsUrl && !track.audioUrl) return;
      const audio = audioRef.current;
      if (!audio) return;
      try {
        audio.currentTime = time;
        storeRef.current.setCurrentTime(time);
      } catch (err) {
        console.error('[AudioPlayer] stream seek error:', err);
      }
    };

    window.addEventListener(SEEK_EVENT, onSeek as EventListener);

    const id = setInterval(() => {
      const track = usePlayerStore.getState().currentTrack;
      if (!track || (!track.hlsUrl && !track.audioUrl)) return;
      const audio = audioRef.current;
      if (!audio) return;
      try {
        storeRef.current.setCurrentTime(audio.currentTime || 0);
        const d = audio.duration;
        if (Number.isFinite(d) && d > 0) storeRef.current.setDuration(d);
      } catch {
        // ignore transient errors during track switches
      }
    }, 500);

    return () => {
      window.removeEventListener(SEEK_EVENT, onSeek as EventListener);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    return () => {
      destroyHls();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
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
  );
}
