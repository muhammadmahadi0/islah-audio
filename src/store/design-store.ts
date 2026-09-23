import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DesignMode = 'liquid' | 'material';

interface DesignState {
  mode: DesignMode;
  setMode: (mode: DesignMode) => void;
  toggle: () => void;
}

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  // iPadOS 13+ reports as MacIntel — touch points give it away.
  return (
    navigator.platform === 'MacIntel' &&
    (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints > 1
  );
}

function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mobile|Tablet|Touch|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent || ''
  );
}

/**
 * Smart default: Liquid Glass ON for iOS + desktop, OFF (Material 3) for
 * other mobile devices (Android etc.). Only applies on first visit —
 * afterwards the persisted choice wins. The pre-paint script in
 * `Layout.astro` mirrors this logic so there is no flash.
 */
export function defaultDesignMode(): DesignMode {
  if (typeof navigator === 'undefined') return 'liquid';
  if (isAndroidDevice()) return 'material';
  if (isIOSDevice()) return 'liquid';
  if (isMobileDevice()) return 'material';
  return 'liquid';
}

function applyDesign(mode: DesignMode) {
  if (typeof document === 'undefined') return;
  // Material mode flattens every glass surface into solid M3 surfaces
  // (see the `html.material` overrides in globals.css).
  document.documentElement.classList.toggle('material', mode === 'material');
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => ({
      mode: defaultDesignMode(),
      setMode: (mode) => {
        applyDesign(mode);
        set({ mode });
      },
      toggle: () => {
        const next: DesignMode = get().mode === 'liquid' ? 'material' : 'liquid';
        applyDesign(next);
        set({ mode: next });
      },
    }),
    {
      name: 'islah-design',
      onRehydrateStorage: () => (state) => {
        // Apply persisted design as soon as the store hydrates (client-side).
        if (state) applyDesign(state.mode);
      },
    }
  )
);
