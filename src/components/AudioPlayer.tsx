import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
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

  // Load a stream track when it changes; stop the stream engine otherwise
  // (the YT engine in MiniPlayer owns YouTube tracks).
  useEffect(() => {
    const track = currentTrack;
    const streamUrl = track?.hlsUrl || track?.audioUrl;

    if (!streamUrl) {
      stopStream();
      return;
    }

    if (streamUrlRef.current === streamUrl) return;

    setIsLoading(true);
    setCurrentTime(0);
    setDuration(track?.duration || 0);
    loadStream(streamUrl, playingRef.current);
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
