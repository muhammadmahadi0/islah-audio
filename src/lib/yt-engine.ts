/**
 * Shared YouTube-embed engine (BETA video mode).
 *
 * Owns the single YT.Player instance plus playback mode.
 * - `audio` mode (default): iframe hidden, lowest quality (data saver).
 * - `video` mode (opt-in via the video toggle): iframe shown in the
 *   artwork slot, same player, no restart.
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

interface EngineState {
  player: any | null;
  ready: boolean;
  mode: VideoMode;
}

const engine: EngineState = {
  player: null,
  ready: false,
  mode: 'audio',
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

let cachedSnapshot: { mode: VideoMode; ready: boolean } | null = null;

export function getEngineSnapshot(): { mode: VideoMode; ready: boolean } {
  // useSyncExternalStore compares by reference — a fresh object every call
  // looks like changed state and infinite-loops the subscriber. Cache it.
  const next = { mode: engine.mode, ready: engine.ready };
  if (
    !cachedSnapshot ||
    cachedSnapshot.mode !== next.mode ||
    cachedSnapshot.ready !== next.ready
  ) {
    cachedSnapshot = next;
  }
  return cachedSnapshot;
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

/** Show or hide the video frame; audio mode drops to lowest quality. */
export function setVideoMode(mode: VideoMode) {
  engine.mode = mode;
  const player = engine.player;
  if (player) {
    try {
      if (mode === 'audio') {
        player.setPlaybackQuality('tiny');
      }
    } catch {
      // player may be tearing down
    }
  }
  emit();
}
