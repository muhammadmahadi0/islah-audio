'use client';

import { usePathname } from 'next/navigation';
import { Home, Search, Library } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Library, label: 'Library', href: '/library' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-white/10 flex justify-around items-center z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <button
            key={item.href}
            onClick={() => (window.location.href = item.href)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-6 py-2 transition-colors',
              isActive ? 'text-[#1DB954]' : 'text-gray-400 hover:text-white'
            )}
          >
            <Icon size={24} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
      {/* Safe area padding for iPhone notch */}
      <div className="pb-env(safe-area-inset-bottom)" />
    </nav>
  );
}