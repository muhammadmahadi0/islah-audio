import { useState, useRef, useEffect, useSyncExternalStore } from 'react';
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
  X,
  Volume2,
  VolumeX,
  Video,
  ListMusic,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  loadYouTubeAPI,
  setEnginePlayer,
  setVideoMode,
  subscribeEngine,
  getEngineSnapshot,
  SEEK_EVENT,
} from '@/lib/yt-engine';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function EqBars({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-end gap-[3px] h-4 text-brand-light', className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="eq-bar h-full"
          style={{ animationDelay: `${i * 0.22}s` }}
        />
      ))}
    </span>
  );
}

export default function MiniPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    playlist,
    playlistIndex,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setIsLoading,
    setVolume,
    playTrack,
    playNext,
    playPrevious,
    stop,
  } = usePlayerStore();

  const engine = useSyncExternalStore(subscribeEngine, getEngineSnapshot);

  const touchStartY = useRef<number>(0);
  const touchDeltaY = useRef<number>(0);

  const ytMountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const readyRef = useRef(false);
  const trackIdRef = useRef<string | null>(null);
  const apiFailedRef = useRef(false);

  const storeRef = useRef({ setCurrentTime, setDuration, setIsPlaying, setIsLoading, playNext });
  storeRef.current = { setCurrentTime, setDuration, setIsPlaying, setIsLoading, playNext };
  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;

  const isYtTrack =
    !!currentTrack && !!currentTrack.videoId && !currentTrack.hlsUrl && !currentTrack.audioUrl;
  const showVideo = isExpanded && isYtTrack && engine.mode === 'video';

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaY.current = e.touches[0].clientY - touchStartY.current;
  };
  const handleTouchEnd = () => {
    if (touchDeltaY.current < -50) setIsExpanded(true);
    else if (touchDeltaY.current > 50 && isExpanded) setIsExpanded(false);
    touchDeltaY.current = 0;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    window.dispatchEvent(new CustomEvent(SEEK_EVENT, { detail: time }));
    setCurrentTime(time);
  };

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  // Create the YT player in the persistent mount node.
  // IMPORTANT: YT.Player REPLACES the mount div with an <iframe> (copying
  // its classes at creation). So the mount div's own className must NEVER
  // change afterwards — visibility is toggled on the PARENT wrapper below,
  // which stays under React control. (Toggling `hidden` on the mount div
  // itself left the iframe permanently hidden → blank video.)
  const createPlayer = (YT: any) => {
    if (!ytMountRef.current || playerRef.current) return;

    playerRef.current = new YT.Player(ytMountRef.current, {
          height: '100%',
          width: '100%',
          // Privacy-enhanced host: no tracking cookies, same JS API.
          host: 'https://www.youtube-nocookie.com',
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
              setEnginePlayer(playerRef.current);
              e.target.setVolume(Math.round(usePlayerStore.getState().volume * 100));
              // A track selected before ready loads now. Always load — the
              // track effect may have already recorded this videoId while the
              // player was still being created.
              const track = usePlayerStore.getState().currentTrack;
              if (track?.videoId && !track.hlsUrl && !track.audioUrl) {
                trackIdRef.current = track.videoId;
                storeRef.current.setIsLoading(true);
                try {
                  if (playingRef.current) e.target.loadVideoById(track.videoId);
                  else e.target.cueVideoById(track.videoId);
                  // Audio-first: keep data-saver quality until the user
                  // explicitly opens video via the video toggle.
                  if (getEngineSnapshot().mode !== 'video') {
                    e.target.setPlaybackQuality('tiny');
                  }
                } catch {
                  storeRef.current.setIsLoading(false);
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
  };

  // Mount the player once
  useEffect(() => {
    let cancelled = false;

    loadYouTubeAPI()
      .then((YT) => {
        if (!cancelled) createPlayer(YT);
      })
      .catch((err) => {
        console.error('[MiniPlayer] YT init:', err);
        apiFailedRef.current = true;
        storeRef.current.setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load / cue YT tracks; pause the embed for anything else
  useEffect(() => {
    const track = currentTrack;

    if (!track || track.hlsUrl || track.audioUrl || !track.videoId) {
      trackIdRef.current = null;
      // Back to audio-only for streams / cleared tracks
      setVideoMode('audio');
      const p = playerRef.current;
      if (p && readyRef.current) {
        try {
          const iframe = p.getIframe?.();
          if (!iframe || iframe.isConnected) {
            // Pause (not stopVideo — that can fire ENDED and auto-advance).
            p.pauseVideo();
          }
        } catch {
          // ignore — player may be tearing down
        }
      }
      return;
    }

    if (trackIdRef.current === track.videoId) return;
    trackIdRef.current = track.videoId;

    setIsLoading(true);
    setCurrentTime(0);
    setDuration(track.duration || 0);

    // No player yet (e.g. no track at island mount) — create it now and
    // let onReady load the current track. The mount node renders with the
    // track, so it exists by the time this effect runs.
    if (!playerRef.current) {
      if (apiFailedRef.current) {
        // Embed API itself failed — don't leave the spinner on.
        setIsLoading(false);
      } else if (ytMountRef.current && window.YT?.Player) {
        createPlayer(window.YT);
      } else if (ytMountRef.current) {
        loadYouTubeAPI()
          .then((YT) => createPlayer(YT))
          .catch((err) => {
            console.error('[MiniPlayer] YT lazy init:', err);
            apiFailedRef.current = true;
            storeRef.current.setIsLoading(false);
          });
      }
      return; // onReady loads the current track
    }

    const player = playerRef.current;
    if (player && readyRef.current) {
      // React may have recycled the mount node while no track was active
      // (e.g. after stop) — a detached iframe can't play. Rebind instead.
      // Wrapped in try/catch: a fully destroyed player can throw here.
      let detached = false;
      try {
        const iframe = player.getIframe?.();
        detached = !!iframe && !iframe.isConnected;
      } catch {
        detached = true;
      }
      if (detached && ytMountRef.current && window.YT?.Player) {
        try {
          player.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
        readyRef.current = false;
        setEnginePlayer(null);
        createPlayer(window.YT);
        return; // onReady loads the current track
      }
      try {
        if (playingRef.current) player.loadVideoById(track.videoId);
        else player.cueVideoById(track.videoId);
      } catch (err) {
        console.error('[MiniPlayer] YT load error:', err);
        setIsLoading(false);
      }
    } else if (apiFailedRef.current) {
      // Embed API itself failed — don't leave the spinner on.
      setIsLoading(false);
    }
    // If the player isn't ready yet, onReady picks the track up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.videoId, currentTrack?.hlsUrl, currentTrack?.audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Play / pause for YT tracks
  useEffect(() => {
    const track = currentTrack;
    if (!track || track.hlsUrl || track.audioUrl || !track.videoId) return;
    const player = playerRef.current;
    if (!player || !readyRef.current) return;
    try {
      const iframe = player.getIframe?.();
      if (iframe && !iframe.isConnected) return;
      if (isPlaying) player.playVideo();
      else player.pauseVideo();
    } catch (err) {
      console.error('[MiniPlayer] YT play/pause error:', err);
    }
  }, [isPlaying, currentTrack]);

  // Volume for the YT embed
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !readyRef.current) return;
    try {
      const iframe = player.getIframe?.();
      if (iframe && !iframe.isConnected) return;
      player.setVolume(Math.round(volume * 100));
    } catch {
      // ignore
    }
  }, [volume]);

  // Collapsing always returns to audio-only and closes the queue.
  // Video mode is strictly opt-in via the video toggle — playback never
  // starts as video.
  useEffect(() => {
    if (!isExpanded) {
      setVideoMode('audio');
      setQueueOpen(false);
    }
  }, [isExpanded]);

  // Seek + progress polling for YT tracks
  useEffect(() => {
    const onSeek = (e: Event) => {
      const time = (e as CustomEvent<number>).detail;
      if (typeof time !== 'number' || isNaN(time)) return;
      const track = usePlayerStore.getState().currentTrack;
      if (!track || track.hlsUrl || track.audioUrl || !track.videoId) return;
      const player = playerRef.current;
      if (!player || !readyRef.current) return;
      try {
        player.seekTo(time, true);
        storeRef.current.setCurrentTime(time);
      } catch (err) {
        console.error('[MiniPlayer] YT seek error:', err);
      }
    };

    window.addEventListener(SEEK_EVENT, onSeek as EventListener);

    const id = setInterval(() => {
      const track = usePlayerStore.getState().currentTrack;
      if (!track || track.hlsUrl || track.audioUrl || !track.videoId) return;
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

  // Queue panel: scroll container + active row refs for auto-scroll.
  // NOTE: must stay above `if (!currentTrack) return null` — hooks after
  // an early return change hook order between renders and crash the island.
  const queueScrollRef = useRef<HTMLDivElement>(null);
  const queueActiveRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll the open queue so the now-playing row is visible:
  // jump on open, smooth follow when the track changes.
  const scrollQueueToActive = (smooth: boolean) => {
    const row = queueActiveRef.current;
    const box = queueScrollRef.current;
    if (!row || !box) return;
    const top = row.offsetTop - box.clientHeight / 2 + row.clientHeight / 2;
    box.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (queueOpen) {
      // Wait a frame for the panel to mount before measuring.
      const id = requestAnimationFrame(() => scrollQueueToActive(false));
      return () => cancelAnimationFrame(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueOpen]);

  useEffect(() => {
    if (queueOpen) scrollQueueToActive(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueOpen, playlistIndex, currentTrack?.videoId]);

  if (!currentTrack) return null;

  const isLive = !!currentTrack.isLive;
  const queueTotal = playlist.length;
  const queuePos = playlistIndex >= 0 ? playlistIndex + 1 : null;

  // Video toggle: audio ⇄ video in the same player (no restart).
  const toggleVideo = () => {
    setVideoMode(engine.mode === 'video' ? 'audio' : 'video');
  };

  // Up-next queue row tap: toggle if current, else jump to it.
  const playQueueTrack = (track: (typeof playlist)[number], index: number) => {
    if (index === playlistIndex) setIsPlaying(!isPlaying);
    else playTrack(track, playlist, index);
  };

  return (
    <>
      {/* ---------------- Full-screen player (liquid glass) ---------------- */}
      {/* Kept mounted (visibility-gated) so the video node never unmounts */}
      <div
        className={cn(
          'fixed inset-0 z-[60] flex flex-col overflow-hidden expanded-sheet bg-ink-950/60 backdrop-blur-2xl transform-gpu transition-opacity duration-200',
          !isExpanded && 'invisible pointer-events-none opacity-0'
        )}
        aria-hidden={!isExpanded}
      >
        {/* Blurred artwork backdrop + tonal scrim + refraction blobs.
            Blur radii kept modest — huge blurs repaint on every frame. */}
        {currentTrack.thumbnail && (
          <>
            <img
              src={currentTrack.thumbnail}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-35 blur-[60px] scale-125"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/60 to-ink-950/85" />
          </>
        )}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-brand/20 blur-[80px] transform-gpu" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-gold/10 blur-[80px] transform-gpu" />
        {/* Global diagonal gloss sheen */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.09] via-transparent to-transparent" />

        <div className="relative mx-auto flex h-full w-full max-w-md flex-col px-5 pb-8 pt-3 safe-bottom">
          {/* Liquid-glass top app bar: collapse • title • stop */}
          <div className="liquid-glass relative flex items-center gap-2 rounded-full px-2 py-2">
            <span className="pointer-events-none absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <button
              onClick={() => setIsExpanded(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] backdrop-blur-md border border-white/20 text-white transition-all hover:bg-white/[0.14] hover:border-white/40 active:scale-95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
              aria-label="Collapse player"
            >
              <ChevronDown size={22} />
            </button>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-mist">
                Now playing
              </p>
              {queueTotal > 1 && queuePos !== null && (
                <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-mist-dark">
                  {queuePos} of {queueTotal}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setIsExpanded(false);
                stop();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 backdrop-blur-md border border-red-400/30 text-red-400 transition-all hover:bg-red-500/30 hover:border-red-400/50 active:scale-95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_16px_rgba(239,68,68,0.25)]"
              aria-label="Stop and close player"
              title="Stop"
            >
              <X size={20} />
            </button>
          </div>

          {/* Video frame (YouTube tracks) or artwork.
              The YT mount stays rendered while a YT track is active so the
              player is never destroyed mid-track; hidden = audio-only. */}
          <div className="flex min-h-0 flex-1 items-center justify-center py-4">
            {isYtTrack ? (
              <div className="liquid-glass relative w-full rounded-[28px] p-2">
                <span className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                <span className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/[0.12] via-transparent to-transparent" />
                <div className="relative w-full overflow-hidden rounded-[20px] ring-1 ring-white/15 bg-black aspect-video">
                {/* Wrapper owns visibility (see createPlayer note) — the
                    mount div keeps a constant class so the YT iframe copy
                    never inherits `hidden`. */}
                <div className={cn('h-full w-full', !showVideo && 'hidden')}>
                  <div ref={ytMountRef} className="h-full w-full" />
                </div>
                {!showVideo &&
                  (currentTrack.thumbnail ? (
                    <img
                      src={currentTrack.thumbnail}
                      alt={currentTrack.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-deep to-ink-800">
                      <Music size={48} className="text-brand-light" />
                    </div>
                  ))}
                {/* Video toggle: tap to watch, tap again for audio-only */}
                <button
                  onClick={toggleVideo}
                  className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white transition-colors hover:bg-black/80 hover:border-white/40"
                  aria-label={engine.mode === 'video' ? 'Switch to audio only' : 'Watch video'}
                  title={engine.mode === 'video' ? 'Audio only' : 'Watch video'}
                >
                  {engine.mode === 'video' ? <Music size={18} /> : <Video size={18} />}
                </button>
                </div>
              </div>
            ) : (
              <div className="liquid-glass relative rounded-[32px] p-2 max-h-full">
                <span className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                <span className="pointer-events-none absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/[0.12] via-transparent to-transparent" />
                <div className="relative aspect-square max-h-full overflow-hidden rounded-[24px] ring-1 ring-white/15">
                {currentTrack.thumbnail ? (
                  <img
                    src={currentTrack.thumbnail}
                    alt={currentTrack.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-deep to-ink-800">
                    <Music size={64} className="text-brand-light" />
                  </div>
                )}
                </div>
              </div>
            )}
          </div>

          {/* Liquid-glass control cluster */}
          <div className="liquid-glass relative rounded-[28px] px-5 pt-4 pb-5">
            <span className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <span className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/[0.12] via-transparent to-transparent" />
            <span className="pointer-events-none absolute bottom-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          {/* Title block */}
          <div className="relative flex items-center gap-2">
            {isLive && (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                Live
              </span>
            )}
            <h2 className="clamp-2 text-[22px] font-bold leading-snug tracking-tight text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
              {currentTrack.title}
            </h2>
          </div>
          <p className="relative mt-1 truncate text-sm font-medium text-gold/90">
            {currentTrack.channelName}
          </p>

          {/* Slider */}
          <div className="relative pt-3">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              disabled={isLive}
              className={cn('w-full', isLive && 'opacity-40')}
              style={{ '--fill': `${progress}%` } as React.CSSProperties}
              aria-label="Seek"
            />
            <div className="mt-1 flex justify-between text-xs font-medium tabular-nums text-mist">
              <span>{isLive ? 'LIVE' : formatTime(currentTime)}</span>
              <span>{isLive ? '' : formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls: glass side buttons + glossy gold FAB */}
          <div className="relative flex items-center justify-between px-1 pt-2">
            <button
              onClick={playPrevious}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/[0.07] backdrop-blur-md border border-white/20 text-white transition-all hover:bg-white/[0.14] hover:border-white/40 active:scale-95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
              aria-label="Previous"
            >
              <SkipBack size={24} fill="currentColor" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="relative flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-light to-brand-dark text-ink-950 shadow-glow-lg ring-1 ring-white/30 transition-transform hover:scale-105 active:scale-95"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <span className="pointer-events-none absolute top-0 inset-x-3 h-1/2 rounded-full bg-gradient-to-b from-white/40 to-transparent" />
              {isLoading ? (
                <Loader2 size={32} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={32} fill="currentColor" />
              ) : (
                <Play size={32} fill="currentColor" className="ml-1" />
              )}
            </button>
            <button
              onClick={playNext}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/[0.07] backdrop-blur-md border border-white/20 text-white transition-all hover:bg-white/[0.14] hover:border-white/40 active:scale-95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
              aria-label="Next"
            >
              <SkipForward size={24} fill="currentColor" />
            </button>
          </div>

          {/* Volume row */}
          <div className="relative flex items-center gap-3 px-1 pt-4">
            <button
              onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] backdrop-blur-md border border-white/20 text-mist transition-all hover:bg-white/[0.14] hover:text-white hover:border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            >
              {volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full"
              style={{ '--fill': `${Math.round(volume * 100)}%` } as React.CSSProperties}
              aria-label="Volume"
            />
          </div>
          </div>

          {/* Up-next queue dropdown — the playback queue lives here now,
              not in Library. Panel opens upward as an overlay so layout
              never shifts. */}
          <div className="relative pt-3">
            <button
              onClick={() => setQueueOpen((v) => !v)}
              aria-expanded={queueOpen}
              aria-label="Show playback queue"
              className="relative flex w-full items-center gap-2 overflow-hidden rounded-2xl liquid-chip px-4 py-2.5 text-sm font-bold text-white transition-all"
            >
              <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              <ListMusic size={17} className="text-brand-light shrink-0" />
              <span>Up next</span>
              {queueTotal > 0 && (
                <span className="text-mist-dark font-semibold tabular-nums">({queueTotal})</span>
              )}
              <span className="flex-1" />
              <ChevronDown size={17} className={cn('text-mist-dark transition-transform', queueOpen && 'rotate-180')} />
            </button>
            {queueOpen && (
              <>
                <button
                  aria-label="Close queue"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setQueueOpen(false)}
                />
                <div className="absolute bottom-full mb-2 inset-x-0 z-20 overflow-hidden rounded-2xl liquid-glass">
                  <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                  {/* Now-playing header pinned on top of the scroll list */}
                  {playlist.length > 0 && playlistIndex >= 0 && playlist[playlistIndex] && (
                    <div className="relative border-b border-white/10 bg-black/20 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                        Now playing
                      </p>
                      <p className="mt-0.5 truncate text-[13px] font-semibold text-white">
                        {playlist[playlistIndex].title}
                      </p>
                      <p className="truncate text-[11px] text-mist-dark">
                        {playlist[playlistIndex].channelName}
                        {queueTotal > 1 && queuePos !== null
                          ? ` • ${queuePos} of ${queueTotal}`
                          : ''}
                      </p>
                    </div>
                  )}
                  <div ref={queueScrollRef} className="relative max-h-64 overflow-y-auto p-1.5">
                    {playlist.length === 0 ? (
                      <p className="px-3 py-5 text-center text-[13px] text-mist-dark">
                        Queue is empty — play some lectures and they’ll show up here.
                      </p>
                    ) : (
                      playlist.map((t, i) => {
                        const active = i === playlistIndex;
                        return (
                          <button
                            key={`${t.id}-${i}`}
                            ref={active ? queueActiveRef : undefined}
                            onClick={() => playQueueTrack(t, i)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
                              active ? 'bg-brand/[0.12]' : 'hover:bg-white/[0.06]'
                            )}
                          >
                            <span className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-white/[0.06] ring-1 ring-white/20">
                              {t.thumbnail ? (
                                <img src={t.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center">
                                  <Music size={15} className="text-brand-light" />
                                </span>
                              )}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className={cn('block truncate text-[13px] font-semibold', active ? 'text-brand-light' : 'text-white')}>
                                {t.title}
                              </span>
                              <span className="block truncate text-[11px] text-mist-dark">
                                {t.channelName}
                              </span>
                            </span>
                            {active && isPlaying ? (
                              <EqBars />
                            ) : (
                              <span className="shrink-0 text-[11px] font-medium text-mist-dark tabular-nums">
                                {formatTime(t.duration)}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- Floating mini player ---------------- */}
      <div
        className={cn(
          'fixed z-40',
          // Mobile: floating pill above the bottom nav pill
          'inset-x-4 bottom-[86px]',
          // Desktop: floating card clear of the sidebar
          'md:left-[280px] lg:left-[304px] md:right-6 md:bottom-6 md:inset-x-auto',
          isExpanded && 'invisible pointer-events-none opacity-0'
        )}
      >
        <div
          onClick={() => setIsExpanded(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="liquid-glass relative overflow-hidden rounded-[28px] px-4 py-3 flex items-center gap-3 cursor-pointer transition-all hover:border-white/30 active:scale-[0.99]"
        >
          {/* Specular top edge — iPhone refraction highlight */}
          <span className="pointer-events-none absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          {/* Diagonal gloss sheen */}
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.14] via-transparent to-transparent" />
          {/* Bottom inner reflection */}
          <span className="pointer-events-none absolute bottom-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          {/* Progress hairline */}
          <span className="absolute top-0 left-4 right-4 h-[2px] rounded-full bg-white/10 overflow-hidden">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-gold-light to-gold transition-[width] shadow-[0_0_8px_rgba(231,197,90,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </span>

          <div className="relative w-11 h-11 shrink-0 rounded-2xl overflow-hidden bg-white/10 ring-1 ring-white/25 shadow-[0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)]">
            {currentTrack.thumbnail ? (
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music size={18} className="text-brand-light" />
              </div>
            )}
          </div>

          <div className="relative flex-1 min-w-0">
            <p className="flex items-center gap-1.5 text-white text-sm font-semibold truncate drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
              {isLive && (
                <span className="flex items-center gap-1 rounded-full bg-red-500 px-1.5 py-px text-[9px] font-extrabold uppercase tracking-widest text-white shrink-0">
                  <span className="h-1 w-1 rounded-full bg-white animate-pulse" />
                  Live
                </span>
              )}
              <span className="truncate">{currentTrack.title}</span>
            </p>
            <div className="flex items-center gap-2">
              <p className="text-mist-dark text-xs truncate">{currentTrack.channelName}</p>
              {isPlaying && <EqBars />}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-brand-light to-brand-dark flex items-center justify-center shrink-0 shadow-glow hover:scale-105 active:scale-95 transition-transform ring-1 ring-white/30"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {/* Glossy top highlight on the play button */}
            <span className="pointer-events-none absolute top-0 inset-x-2 h-1/2 rounded-full bg-gradient-to-b from-white/40 to-transparent" />
            {isLoading ? (
              <Loader2 size={16} className="animate-spin text-ink-950" />
            ) : isPlaying ? (
              <Pause size={16} fill="#060D0A" className="text-ink-950" />
            ) : (
              <Play size={16} fill="#060D0A" className="text-ink-950 ml-0.5" />
            )}
          </button>

          {/* Stop everything + dismiss */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
              stop();
            }}
            className="w-7 h-7 rounded-full bg-white/[0.07] backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 text-mist-dark hover:text-white hover:border-white/40 hover:bg-white/[0.14] transition-colors shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
            aria-label="Stop and close player"
            title="Stop"
          >
            <X size={14} />
          </button>

          <span className="hidden sm:flex text-mist-dark">
            <ChevronUp size={18} />
          </span>
        </div>
      </div>
    </>
  );
}
