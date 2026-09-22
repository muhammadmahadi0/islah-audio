/**
 * Shared YouTube-embed engine (BETA video mode).
 *
 * Owns the single hidden YT.Player instance plus playback mode + quality.
 * - `audio` mode (minimized player): iframe hidden, lowest quality (data saver).
 * - `video` mode (expanded player): iframe shown in the artwork slot at the
 *   user's chosen quality.
 *
 * MiniPlayer renders the persistent mount node; AudioPlayer never touches it.
 */

/**
 * Name of the window CustomEvent used to request a seek.
 * UI components dispatch:
 *   window.dispatchEvent(new CustomEvent(SEEK_EVENT, { detail: seconds }))
 */
export const SEEK_EVENT = 'islah:seek';

export type VideoMode = 'audio' | 'video';

export const QUALITY_LABELS: Record<string, string> = {
  auto: 'Auto',
  hd1080: '1080p',
  hd720: '720p',
  large: '480p',
  medium: '360p',
  small: '240p',
  tiny: '144p',
};

const QUALITY_ORDER = ['hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'];
const QUALITY_KEY = 'islah-quality';

interface EngineState {
  player: any | null;
  ready: boolean;
  mode: VideoMode;
  /** 'auto' or a YT quality level. */
  quality: string;
}

const engine: EngineState = {
  player: null,
  ready: false,
  mode: 'audio',
  quality:
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(QUALITY_KEY) || 'auto'
      : 'auto',
};

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore listener errors
    }
  });
}

export function subscribeEngine(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getEngineSnapshot(): { mode: VideoMode; quality: string; ready: boolean } {
  return { mode: engine.mode, quality: engine.quality, ready: engine.ready };
}

let apiPromise: Promise<any> | null = null;

export function loadYouTubeAPI(): Promise<any> {
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

    setTimeout(() => {
      if (!window.YT?.Player) {
        apiPromise = null;
        reject(new Error('YouTube player timed out'));
      }
    }, 15000);
  });

  return apiPromise;
}

export function setEnginePlayer(player: any | null) {
  engine.player = player;
  engine.ready = !!player;
  emit();
}

/** Show or hide the video frame; minimized always drops to lowest quality. */
export function setVideoMode(mode: VideoMode) {
  engine.mode = mode;
  const player = engine.player;
  if (player) {
    try {
      if (mode === 'video') {
        applyQuality();
      } else {
        player.setPlaybackQuality('tiny');
      }
    } catch {
      // player may be tearing down
    }
  }
  emit();
}

function applyQuality() {
  const player = engine.player;
  if (!player) return;
  try {
    player.setPlaybackQuality(engine.quality === 'auto' ? 'default' : engine.quality);
  } catch {
    // ignore
  }
}

export function setQuality(quality: string) {
  engine.quality = quality;
  try {
    localStorage.setItem(QUALITY_KEY, quality);
  } catch {
    // private mode etc.
  }
  if (engine.mode === 'video') applyQuality();
  emit();
}

/** Levels the current video actually offers, high → low. Empty when unknown. */
export function getAvailableQualities(): string[] {
  try {
    const levels: string[] = engine.player?.getAvailableQualityLevels?.() || [];
    const known = levels.filter((l) => QUALITY_ORDER.includes(l));
    return [...known].sort(
      (a, b) => QUALITY_ORDER.indexOf(a) - QUALITY_ORDER.indexOf(b)
    );
  } catch {
    return [];
  }
}
