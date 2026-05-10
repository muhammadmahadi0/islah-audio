import type { Metadata } from 'next';
import './globals.css';
import Player from '@/components/Player';

export const metadata: Metadata = {
  title: 'Islah Audio',
  description: 'Stream Islamic audio content from PeerTube',
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
          <Player />
        </div>
      </body>
    </html>
  );
}