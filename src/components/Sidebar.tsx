import { useState, useEffect } from 'react';
import { Home, Search, Library, Radio } from 'lucide-react';
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
 * Desktop sidebar, YouTube-style: compact rows, section dividers,
 * channel card below.
 */
export default function Sidebar() {
  const pathname = usePath();

  return (
    <aside className="hidden md:flex w-60 lg:w-64 shrink-0 flex-col bg-ink-900/60 px-3 py-4 overflow-y-auto">
      {/* Brand */}
      <a href="/" className="flex items-center gap-3 px-3 mb-5 group">
        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand via-brand-dark to-emerald-950 flex items-center justify-center shadow-glow ring-1 ring-gold/40 group-hover:scale-105 transition-transform">
          <span className="text-[#E7C55A] text-xl font-bold leading-none">إ</span>
        </span>
        <span className="min-w-0">
          <span className="block text-white font-extrabold tracking-tight leading-tight">
            Islah Audio
          </span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-gold/90">
            Bayan • Waz • Nasheed
          </span>
        </span>
      </a>

      {/* Nav */}
      <nav className="space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-5 rounded-lg px-3 h-10 text-sm transition-colors',
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/90 hover:bg-white/10 font-normal'
              )}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.2 : 1.8}
                fill={isActive ? 'currentColor' : 'none'}
                fillOpacity={isActive ? 0.2 : 0}
                className="shrink-0"
              />
              {item.label}
            </a>
          );
        })}
      </nav>

      <hr className="border-white/10 my-3" />

      {/* Channel section (YouTube "Subscriptions" style) */}
      <p className="px-3 pb-1 text-sm font-medium text-white">Islah</p>
      <a
        href="/"
        className="flex items-center gap-5 rounded-lg px-3 h-10 text-sm text-white/90 hover:bg-white/10 transition-colors"
      >
        <span className="w-5 h-5 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center shrink-0">
          <Radio size={12} className="text-brand-light" />
        </span>
        <span className="truncate">@islahbd</span>
      </a>

      <hr className="border-white/10 my-3" />

      <div className="flex-1" />

      {/* Footer */}
      <p className="px-3 text-[11px] leading-relaxed text-mist-dark">
        Audio streaming from public YouTube lectures. For listening &amp; learning.
      </p>
    </aside>
  );
}
