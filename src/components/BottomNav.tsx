'use client';

import { usePathname } from 'next/navigation';
import { Home, Search, Library, Compass, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: <Home size={24} />, label: 'Home', href: '/' },
  { icon: <Search size={24} />, label: 'Search', href: '/search' },
  { icon: <Library size={24} />, label: 'Library', href: '/library' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#121212] border-t border-white/10 flex justify-around items-center md:hidden z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <button
            key={item.href}
            onClick={() => (window.location.href = item.href)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-6 py-2 transition-colors',
              isActive ? 'text-[#1DB954]' : 'text-[#b3b3b3] hover:text-white'
            )}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}