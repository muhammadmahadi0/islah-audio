import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import AudioPlayer from '@/components/AudioPlayer';
import MiniPlayer from '@/components/Player/MiniPlayer';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import BetaBadge from '@/components/BetaBadge';

export const metadata: Metadata = {
  title: 'Islah Audio — Islamic Lectures',
  description: 'Listen to bayans, waz and nasheeds from the Islah channel. Modern audio experience.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#060D0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// Applies the persisted theme before first paint (no dark-mode flash).
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('islah-theme');if(s&&JSON.parse(s).state.theme==='light'){document.documentElement.classList.add('light')}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-ink-950 text-white">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <div className="flex h-dvh overflow-hidden">
          {/* Desktop sidebar */}
          <Sidebar />

          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>

          {/* Floating mini player + mobile nav */}
          <MiniPlayer />
          <BottomNav />

          {/* Floating theme toggle */}
          <ThemeToggle />

          {/* BETA marker (beta branch only) */}
          <BetaBadge />

          {/* Hidden playback engine */}
          <AudioPlayer />
        </div>
      </body>
    </html>
  );
}
