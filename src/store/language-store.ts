import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppLang = 'en' | 'bn';

interface LanguageState {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
}

function applyLang(lang: AppLang) {
  if (typeof document === 'undefined') return;
  // Keeps screen readers + browser translation prompts in sync with the UI.
  document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (lang) => {
        applyLang(lang);
        set({ lang });
      },
    }),
    {
      name: 'islah-lang',
      onRehydrateStorage: () => (state) => {
        // Apply persisted language as soon as the store hydrates.
        if (state) applyLang(state.lang);
      },
    }
  )
);
