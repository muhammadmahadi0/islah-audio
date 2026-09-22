import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DesignMode = 'liquid' | 'material';

interface DesignState {
  mode: DesignMode;
  setMode: (mode: DesignMode) => void;
  toggle: () => void;
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
      mode: 'liquid',
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
