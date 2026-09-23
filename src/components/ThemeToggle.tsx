import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/theme-store';
import { cn } from '@/lib/utils';

/**
 * Small floating light/dark toggle. Sits above the mini player on mobile
 * and above the floating player card on desktop.
 */
export default function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggle}
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
  );
}
