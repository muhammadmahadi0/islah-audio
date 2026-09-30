import type { AppLang } from '@/store/language-store';

/**
 * Chrome-level i18n (phase 1): sidebar + bottom nav + toggles only.
 * Video titles stay as-is (they come from YouTube / IslahBD APIs).
 * Add new keys here as more surfaces get translated — views read via `t(lang)`.
 */
const dict = {
  en: {
    navHome: 'Home',
    navSearch: 'Search',
    navLibrary: 'Library',
    navBoyan: 'Boyan',
    navHamdNaat: 'Hamd-Naat',
    channels: 'Channels',
    liquidGlass: 'Liquid Glass',
    liquidGlassOn: 'iPhone-style frosted look',
    liquidGlassOff: 'Off — Material 3 solid look',
    language: 'Language',
    languageSub: 'Choose app language',
    footer: 'Audio streaming from public YouTube lectures. For listening & learning.',
  },
  bn: {
    navHome: 'হোম',
    navSearch: 'সার্চ',
    navLibrary: 'লাইব্রেরি',
    navBoyan: 'বয়ান',
    navHamdNaat: 'হামদ-নাত',
    channels: 'চ্যানেলসমূহ',
    liquidGlass: 'লিকুইড গ্লাস',
    liquidGlassOn: 'আইফোন-স্টাইল ফ্রস্টেড লুক',
    liquidGlassOff: 'বন্ধ — ম্যাটেরিয়াল ৩ সলিড লুক',
    language: 'ভাষা',
    languageSub: 'অ্যাপের ভাষা বেছে নিন',
    footer: 'পাবলিক ইউটিউব লেকচার থেকে অডিও স্ট্রিমিং। শোনা ও শেখার জন্য।',
  },
} as const;

export type I18nKey = keyof (typeof dict)['en'];

export function t(lang: AppLang): Record<I18nKey, string> {
  return dict[lang] ?? dict.en;
}
