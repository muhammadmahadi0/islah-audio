import { useCallback, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore, type Theme } from '@/store/theme-store';
import { useLanguageStore } from '@/store/language-store';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface Wrap {
  x: number;
  y: number;
  /** Theme being wrapped TO (overlay paints in the incoming theme's base). */
  to: 'dark' | 'light';
  size: number;
  key: number;
}

/**
 * Light/dark toggle with an on-click wrapping effect: a circle blooms from
 * the tap point and wraps the screen in the incoming theme's base color
 * while the theme flips mid-expansion, then fades out. Respects
 * prefers-reduced-motion (plain switch, no overlay). Opts out of the
 * site-wide droplet ripple (`data-no-ripple`) so the two effects don't stack.
 *
 * Two variants: `floating` (default — the floating glass pill) and
 * `sidebar` (settings row with a Dark/Light segmented pill, same shape as
 * the Language row).
 */
export default function ThemeToggle({ variant = 'floating' }: { variant?: 'floating' | 'sidebar' }) {
  const { theme, setTheme, toggle } = useThemeStore();
  const { lang } = useLanguageStore();
  const s = t(lang);
  const isLight = theme === 'light';
  const [wrap, setWrap] = useState<Wrap | null>(null);

  const bloom = useCallback(
    (e: React.MouseEvent<HTMLElement>, to: Theme, apply: () => void) => {
      if (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ) {
        apply();
        return;
      }
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;
      try {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        x = typeof e.clientX === 'number' && e.clientX > 0 ? e.clientX : rect.left + rect.width / 2;
        y = typeof e.clientY === 'number' && e.clientY > 0 ? e.clientY : rect.top + rect.height / 2;
      } catch {
        // fall back to the viewport center above
      }
      const size = Math.hypot(window.innerWidth, window.innerHeight) * 2.2;
      setWrap({ x, y, to, size, key: Date.now() });
      // Flip the theme mid-expansion so the wrap reads as the new theme
      // arriving; overlay fades on top of it.
      window.setTimeout(apply, 180);
      window.setTimeout(() => setWrap(null), 680);
    },
    []
  );

  const handleFloatingClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const to: Theme = theme === 'dark' ? 'light' : 'dark';
      bloom(e, to, toggle);
    },
    [theme, toggle, bloom]
  );

  const handleSegmentClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, to: Theme) => {
      if (to === theme) return;
      bloom(e, to, () => setTheme(to));
    },
    [theme, setTheme, bloom]
  );

  const wrapEl = wrap && (
    <span
      key={wrap.key}
      aria-hidden="true"
      className={cn('theme-wrap', wrap.to === 'light' ? 'theme-wrap-light' : 'theme-wrap-dark')}
      style={{
        left: wrap.x,
        top: wrap.y,
        width: wrap.size,
        height: wrap.size,
      }}
    />
  );

  if (variant === 'sidebar') {
    return (
      <>
        <div className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 border border-transparent">
          <span className="liquid-gold w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
            <span className="relative block h-4 w-4">
              <Sun
                size={16}
                className={cn(
                  'absolute inset-0 transition-all duration-300',
                  isLight ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'
                )}
              />
              <Moon
                size={16}
                className={cn(
                  'absolute inset-0 transition-all duration-300',
                  isLight ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'
                )}
              />
            </span>
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-semibold text-white">
              {s.themeLabel}
            </span>
            <span className="block text-[11px] text-mist-dark">
              {isLight ? s.themeLightSub : s.themeDarkSub}
            </span>
          </span>
          {/* Segmented Dark / Light pill — gold gradient on the active side */}
          <span
            role="group"
            aria-label={s.themeLabel}
            className="relative flex shrink-0 rounded-full p-0.5 bg-white/10 ring-1 ring-white/25 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
          >
            {(['dark', 'light'] as const).map((v) => (
              <button
                key={v}
                onClick={(e) => handleSegmentClick(e, v)}
                data-no-ripple
                aria-pressed={theme === v}
                aria-label={v === 'dark' ? s.darkMode : s.lightMode}
                className={cn(
                  'px-3 py-1 rounded-full text-[11px] font-bold transition-all',
                  theme === v
                    ? 'text-[#1a1405] bg-[linear-gradient(135deg,#cba135_0%,#e8c96c_50%,#a07e28_100%)] shadow'
                    : 'text-white/70 hover:text-white'
                )}
              >
                {v === 'dark' ? s.pillDark : s.pillLight}
              </button>
            ))}
          </span>
        </div>
        {wrapEl}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleFloatingClick}
        data-no-ripple
        aria-label={isLight ? s.toDark : s.toLight}
        title={isLight ? s.darkMode : s.lightMode}
        className={cn(
          'fixed z-40 flex h-11 w-11 items-center justify-center rounded-full',
          'liquid-glass transition-all',
          'hover:scale-105 active:scale-95',
          'bottom-[148px] right-4 md:bottom-24 md:right-6'
        )}
      >
        <span className="relative block h-5 w-5 text-gold">
          <Sun
            size={20}
            className={cn(
              'absolute inset-0 transition-all duration-300',
              isLight ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'
            )}
          />
          <Moon
            size={20}
            className={cn(
              'absolute inset-0 transition-all duration-300',
              isLight ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'
            )}
          />
        </span>
      </button>
      {wrapEl}
    </>
  );
}
