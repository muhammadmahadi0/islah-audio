import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('light', theme === 'light');
}

/**
 * First-visit default: follow the OS / browser color scheme.
 * Only applies when there is no saved choice — afterwards the
 * persisted value wins. Mirrored by the pre-paint script in
 * `Layout.astro` so there is no flash.
 */
export function defaultTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return 'dark';
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: defaultTheme(),
      setTheme: (theme) => {
        if (get().theme === theme) return;
        applyTheme(theme);
        set({ theme });
      },
      toggle: () => {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: 'islah-theme',
      onRehydrateStorage: () => (state) => {
        // Apply persisted theme; on true first visit (nothing stored)
        // fall back to the live system scheme instead of hardcoded dark.
        if (state) applyTheme(state.theme);
        else applyTheme(defaultTheme());
      },
    }
  )
);
