import type { Metadata, Viewport } from 'next';
import './globals.css';
import AudioPlayer from '@/components/AudioPlayer';
import MiniPlayer from '@/components/Player/MiniPlayer';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-ink-950 text-white">
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

          {/* Hidden playback engine */}
          <AudioPlayer />
        </div>
      </body>
    </html>
  );
}
