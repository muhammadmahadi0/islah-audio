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
    <nav className="md:hidden fixed bottom-3 inset-x-4 z-50 rounded-full glass border border-white/10 shadow-card safe-bottom">
      <div className="grid grid-cols-3 px-4 py-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-semibold transition-colors',
                isActive ? 'text-brand-light' : 'text-mist-dark'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.4 : 2} fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.25 : 0} />
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
