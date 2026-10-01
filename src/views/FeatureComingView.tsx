import { Sparkles, BookOpen, CalendarDays, ScrollText, MoonStar, ArrowLeft } from 'lucide-react';
import { useLanguageStore } from '@/store/language-store';
import { t, type I18nKey } from '@/lib/i18n';

export type ComingIcon = 'amal' | 'dua' | 'calendar' | 'wazifa' | 'durood';

const ICONS = {
  amal: Sparkles,
  dua: BookOpen,
  calendar: CalendarDays,
  wazifa: ScrollText,
  durood: MoonStar,
} as const;

/**
 * Placeholder for the new Islamic sections (Amal / Dua / Calendar /
 * Wazifa / Durood). Buttons exist and routes work — real functions
 * come later, per the owner's plan.
 */
export default function FeatureComingView({
  icon,
  titleKey,
  subKey,
}: {
  icon: ComingIcon;
  titleKey: I18nKey;
  subKey: I18nKey;
}) {
  const { lang } = useLanguageStore();
  const s = t(lang);
  const Icon = ICONS[icon];

  return (
    <main className="pb-44 md:pb-36">
      <div className="mx-auto max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
        <a
          href="/more"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-mist-dark hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          {s.navMore}
        </a>
        <div className="relative text-center py-16 liquid-glass rounded-[28px] overflow-hidden animate-fade-up">
          <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          <span className="relative w-16 h-16 rounded-2xl liquid-gold flex items-center justify-center mx-auto mb-4">
            <Icon size={26} />
          </span>
          <p className="text-white font-bold text-lg">{s[titleKey]}</p>
          <p className="text-mist-dark text-sm mt-1">{s[subKey]}</p>
          <p className="mt-3 inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-gold rounded-full px-4 py-1.5 liquid-chip">
            {s.comingSoon}
          </p>
          <p className="text-mist-dark text-xs mt-3 max-w-xs mx-auto">{s.comingSoonSub}</p>
        </div>
      </div>
    </main>
  );
}
