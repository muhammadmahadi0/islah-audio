import { useState, useEffect } from 'react';
import { Home, Search, Library } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Library, label: 'Library', href: '/library' },
];

function usePath() {
  const [path, setPath] = useState('/');
  useEffect(() => {
    setPath(window.location.pathname);
  }, []);
  return path;
}

/**
 * Mobile bottom bar — very rounded floating pill (YouTube-app style).
 */
export default function BottomNav() {
  const pathname = usePath();

  return (
    <nav className="bottom-nav md:hidden fixed bottom-2.5 inset-x-4 z-50 rounded-full liquid-glass safe-bottom">
      <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-14 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.12] via-transparent to-transparent" />
      <div className="relative grid grid-cols-3 px-3 py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-px rounded-full py-1 text-[9px] font-semibold transition-all',
                isActive
                  ? 'text-brand-light bg-white/[0.08] ring-1 ring-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
                  : 'text-mist-dark'
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.4 : 2} fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.25 : 0} />
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
