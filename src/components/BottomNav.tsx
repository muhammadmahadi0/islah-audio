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
    <nav className="md:hidden fixed bottom-2.5 inset-x-4 z-50 rounded-full liquid-glass safe-bottom">
      <div className="grid grid-cols-3 px-3 py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-px rounded-full py-1 text-[9px] font-semibold transition-colors',
                isActive ? 'text-brand-light' : 'text-mist-dark'
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
