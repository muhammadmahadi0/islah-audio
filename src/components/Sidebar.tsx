'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Library, label: 'Library', href: '/library' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 lg:w-72 shrink-0 flex-col border-r border-white/[0.06] bg-ink-900/60 px-4 py-6">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-3 px-2 mb-8 group">
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand via-brand-dark to-emerald-950 flex items-center justify-center shadow-glow ring-1 ring-gold/40 group-hover:scale-105 transition-transform">
          <span className="text-[#E7C55A] text-2xl font-bold leading-none">إ</span>
        </span>
        <span className="min-w-0">
          <span className="block text-white font-extrabold tracking-tight leading-tight">
            Islah Audio
          </span>
          <span className="block text-[11px] uppercase tracking-[0.2em] text-gold/90">
            Bayan • Waz • Nasheed
          </span>
        </span>
      </Link>

      {/* Nav */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-brand/[0.12] text-white'
                  : 'text-mist hover:text-white hover:bg-white/[0.05]'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-gradient-to-b from-gold-light to-gold" />
              )}
              <Icon
                size={19}
                className={isActive ? 'text-brand-light' : 'text-mist-dark'}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Live channel card */}
      <div className="mt-8 rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-transparent p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-mist">
            Source
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center">
            <Radio size={16} className="text-brand-light" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">Islah Channel</p>
            <p className="text-xs text-mist-dark truncate">youtube.com/@islahbd</p>
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {/* Footer */}
      <p className="px-2 text-[11px] leading-relaxed text-mist-dark">
        Audio streaming from public YouTube lectures. For listening &amp; learning.
      </p>
    </aside>
  );
}
