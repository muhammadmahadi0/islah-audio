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
  Settings2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  loadYouTubeAPI,
  setEnginePlayer,
  setVideoMode,
  setQuality,
  getAvailableQualities,
  subscribeEngine,
  getEngineSnapshot,
  QUALITY_LABELS,
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

const FALLBACK_LEVELS = ['hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'];

export default function MiniPlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [menuLevels, setMenuLevels] = useState<string[]>([]);
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
  // The node stays mounted across expand/collapse so playback never stops;
  // if React ever recycles the node (e.g. after stop cleared the track),
  // the track effect below detects the detached iframe and rebinds.
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
                  // explicitly opens video via the gear button.
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
          // Pause (not stopVideo — that can fire ENDED and auto-advance).
          p.pauseVideo();
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
      const iframe = player.getIframe?.();
      if (iframe && !iframe.isConnected && ytMountRef.current && window.YT?.Player) {
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
      player.setVolume(Math.round(volume * 100));
    } catch {
      // ignore
    }
  }, [volume]);

  // Collapsing always returns to audio-only. Video mode is strictly
  // opt-in via the gear button — playback never starts as video.
  useEffect(() => {
    if (!isExpanded) {
      setQualityMenuOpen(false);
      setVideoMode('audio');
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

  if (!currentTrack) return null;

  const isLive = !!currentTrack.isLive;
  const queueTotal = playlist.length;
  const queuePos = playlistIndex >= 0 ? playlistIndex + 1 : null;

  const openQualityMenu = () => {
    const levels = getAvailableQualities();
    setMenuLevels(levels.length > 0 ? levels : FALLBACK_LEVELS);
    setQualityMenuOpen((v) => !v);
  };

  // Gear: first tap switches audio → video, further taps open qualities.
  const handleGear = () => {
    if (engine.mode !== 'video') {
      setVideoMode('video');
      return;
    }
    openQualityMenu();
  };

  return (
    <>
      {/* ---------------- Full-screen player (Material 3) ---------------- */}
      {/* Kept mounted (visibility-gated) so the video node never unmounts */}
      <div
        className={cn(
          'fixed inset-0 z-[60] flex flex-col overflow-hidden bg-ink-950 transition-opacity duration-200',
          !isExpanded && 'invisible pointer-events-none opacity-0'
        )}
        aria-hidden={!isExpanded}
      >
        {/* Blurred artwork backdrop + tonal scrim */}
        {currentTrack.thumbnail && (
          <>
            <img
              src={currentTrack.thumbnail}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-25 blur-[80px] scale-125"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-ink-950/80 to-ink-950" />
          </>
        )}

        <div className="relative mx-auto flex h-full w-full max-w-md flex-col px-5 pb-8 pt-3 safe-bottom">
          {/* M3 top app bar: collapse • title • stop */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15 active:scale-95"
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
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-500 transition-colors hover:bg-red-500/25 active:scale-95"
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
              <div className="relative w-full overflow-hidden rounded-[20px] shadow-card ring-1 ring-white/15 bg-black aspect-video">
                <div ref={ytMountRef} className={cn('h-full w-full', !showVideo && 'hidden')} />
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
                {/* Gear: first tap opens the video, further taps pick quality */}
                <button
                  onClick={handleGear}
                  className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition-colors hover:bg-black/90"
                  aria-label={engine.mode === 'video' ? 'Playback quality' : 'Watch video'}
                  title={engine.mode === 'video' ? 'Quality' : 'Watch video'}
                >
                  <Settings2 size={18} />
                </button>
                {qualityMenuOpen && engine.mode === 'video' && (
                  <>
                    <button
                      aria-label="Close quality menu"
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setQualityMenuOpen(false)}
                    />
                    <div className="absolute bottom-12 right-2 z-20 w-44 overflow-hidden rounded-2xl glass border border-white/15 shadow-card py-1.5 animate-fade-up">
                      <p className="px-3.5 pt-1.5 pb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-mist-dark">
                        Quality
                      </p>
                      {['auto', ...menuLevels.filter((l) => l !== 'auto')].map((level) => (
                        <button
                          key={level}
                          onClick={() => {
                            setQuality(level);
                            setQualityMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          <span className="w-4 shrink-0">
                            {engine.quality === level && (
                              <Check size={15} className="text-brand-light" strokeWidth={3} />
                            )}
                          </span>
                          {QUALITY_LABELS[level] || level}
                          {level === 'auto' && (
                            <span className="ml-auto text-[11px] text-mist-dark">data saver off</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="aspect-square max-h-full overflow-hidden rounded-[28px] shadow-card ring-1 ring-white/15">
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
            )}
          </div>

          {/* Title block */}
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                Live
              </span>
            )}
            <h2 className="clamp-2 text-[22px] font-bold leading-snug tracking-tight text-white">
              {currentTrack.title}
            </h2>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-gold/90">
            {currentTrack.channelName}
          </p>

          {/* M3 slider */}
          <div className="pt-3">
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

          {/* Controls: tonal side buttons + FAB */}
          <div className="flex items-center justify-between px-1 pt-2">
            <button
              onClick={playPrevious}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/15 active:scale-95"
              aria-label="Previous"
            >
              <SkipBack size={24} fill="currentColor" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br from-brand-light to-brand-dark text-ink-950 shadow-glow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
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
              className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/15 active:scale-95"
              aria-label="Next"
            >
              <SkipForward size={24} fill="currentColor" />
            </button>
          </div>

          {/* M3 volume row */}
          <div className="flex items-center gap-3 px-1 pt-4">
            <button
              onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-mist transition-colors hover:bg-white/15 hover:text-white"
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
          className="glass relative overflow-hidden rounded-[28px] border border-white/10 shadow-card px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-brand/40 transition-colors"
        >
          {/* Progress hairline */}
          <span className="absolute top-0 left-3 right-3 h-[2px] rounded-full bg-white/10 overflow-hidden">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-gold-light to-gold transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </span>

          <div className="w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-brand/15 ring-1 ring-white/10">
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

          <div className="flex-1 min-w-0">
            <p className="flex items-center gap-1.5 text-white text-sm font-semibold truncate">
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
            className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-light to-brand-dark flex items-center justify-center shrink-0 shadow-glow hover:scale-105 active:scale-95 transition-transform"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
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
            className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center shrink-0 text-mist-dark hover:text-white hover:border-white/30 hover:bg-white/10 transition-colors"
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
