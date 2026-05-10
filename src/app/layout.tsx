import type { Metadata } from 'next';
import './globals.css';
import AudioPlayer from '@/components/AudioPlayer';

export const metadata: Metadata = {
  title: 'Islah Audio',
  description: 'Stream Islamic audio content from YouTube via Piped',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex flex-col h-screen">
          <div className="flex-1 flex overflow-hidden">
            {children}
          </div>
          {/* Persistent Audio Player - outside children so it doesn't remount on navigation */}
          <AudioPlayer />
        </div>
      </body>
    </html>
  );
}