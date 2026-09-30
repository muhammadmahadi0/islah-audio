import { useCallback, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/theme-store';
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
 * Floating light/dark toggle. Sits above the mini player on mobile
 * and above the floating player card on desktop.
 *
 * On-click wrapping effect: a circle blooms from the tap point and wraps
 * the screen in the incoming theme's base color while the theme flips
 * mid-expansion, then fades out. Respects prefers-reduced-motion (plain
 * toggle, no overlay). Opts out of the site-wide droplet ripple
 * (`data-no-ripple`) so the two effects don't stack.
 */
export default function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  const isLight = theme === 'light';
  const [wrap, setWrap] = useState<Wrap | null>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const to: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark';
      if (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ) {
        toggle();
        return;
      }
      let x = window.innerWidth - 38;
      let y = window.innerHeight - 170;
      try {
        const rect = e.currentTarget.getBoundingClientRect();
        x = typeof e.clientX === 'number' && e.clientX > 0 ? e.clientX : rect.left + rect.width / 2;
        y = typeof e.clientY === 'number' && e.clientY > 0 ? e.clientY : rect.top + rect.height / 2;
      } catch {
        // fall back to the default position above
      }
      const size = Math.hypot(window.innerWidth, window.innerHeight) * 2.2;
      setWrap({ x, y, to, size, key: Date.now() });
      // Flip the theme mid-expansion so the wrap reads as the new theme
      // arriving; overlay fades on top of it.
      window.setTimeout(toggle, 180);
      window.setTimeout(() => setWrap(null), 680);
    },
    [theme, toggle]
  );

  return (
    <>
      <button
        onClick={handleClick}
        data-no-ripple
        aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        title={isLight ? 'Dark mode' : 'Light mode'}
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
      {wrap && (
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
      )}
    </>
  );
}
