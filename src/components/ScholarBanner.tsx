import { useDesignStore } from '@/store/design-store';
import { useLanguageStore } from '@/store/language-store';
import { useThemeStore } from '@/store/theme-store';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * Scholar banner at the top of Home, above the prayer timer.
 * Follows the site design instead of a pinned palette: cream/gold card
 * in light theme, liquid-glass with glowing gold title in dark theme,
 * flat solid card in Material mode. Text is translated (`scholar*` keys).
 */
export default function ScholarBanner() {
  const { lang } = useLanguageStore();
  const { theme } = useThemeStore();
  const { mode } = useDesignStore();
  const s = t(lang);

  const isLight = theme === 'light';
  const variant = isLight
    ? 'scholar-banner-cream'
    : mode === 'liquid'
      ? 'liquid-glass scholar-banner-dark'
      : 'scholar-banner-flat';

  return (
    <section aria-label="Scholar banner" className={cn('scholar-banner animate-fade-up', variant)}>
      {!isLight && mode === 'liquid' && (
        <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      )}
      <p className="scholar-banner-top">
        {s.scholarLine1}
        <br />
        {s.scholarLine2}
      </p>
      <h1 className="scholar-banner-title">{s.scholarTitle}</h1>
    </section>
  );
}
