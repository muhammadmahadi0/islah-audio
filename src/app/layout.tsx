import type { Metadata, Viewport } from 'next';
import './globals.css';
import AudioPlayer from '@/components/AudioPlayer';
import BottomNav from '@/components/BottomNav';
import MiniPlayer from '@/components/Player/MiniPlayer';

export const metadata: Metadata = {
  title: 'Islah Audio',
  description: 'Stream Islamic audio content from YouTube via Piped',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#121212',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#121212]">
        <div className="flex flex-col h-screen">
          <div className="flex-1 flex overflow-hidden">
            {children}
          </div>

          {/* Persistent Mini Player - Shows above bottom nav on mobile, at bottom on desktop */}
          <MiniPlayer />

          {/* Persistent Audio Player - Handles actual audio playback */}
          <AudioPlayer />

          {/* Bottom Navigation - Only visible on mobile */}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}