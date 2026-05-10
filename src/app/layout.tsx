import type { Metadata, Viewport } from 'next';
import './globals.css';
import AudioPlayer from '@/components/AudioPlayer';
import FloatingPlayer from '@/components/FloatingPlayer';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'Islah Audio',
  description: 'Islamic lectures audio player',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-black">
        <div className="flex flex-col h-screen">
          <div className="flex-1 flex overflow-hidden">
            {children}
          </div>

          <FloatingPlayer />
          <AudioPlayer />
          <BottomNav />
        </div>
      </body>
    </html>
  );
}