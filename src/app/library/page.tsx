'use client';

import { usePlayerStore, type Track } from '@/store/player-store';
import { Play, Pause, Music, Clock, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function LibraryPage() {
  const { playlist, currentTrack, isPlaying, playTrack, setIsPlaying } = usePlayerStore();

  const handlePlayTrack = (track: Track, index: number) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      playTrack(track, playlist, index);
    }
  };

  return (
    <main className="flex-1 overflow-auto bg-gradient-to-b from-[#181818] to-[#121212] pb-24 md:pb-0">
      {/* Header */}
      <header className="p-4">
        <h1 className="text-2xl font-bold text-white">Your Library</h1>
      </header>

      {/* Content */}
      <div className="p-4">
        {playlist.length > 0 ? (
          <div className="space-y-1">
            {playlist.map((track, index) => (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(track, index)}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-[#282828] transition-colors',
                  currentTrack?.id === track.id && 'bg-[#282828]'
                )}
              >
                <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-[#333333]">
                  {track.thumbnail ? (
                    <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music size={16} className="text-[#727272]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    currentTrack?.id === track.id ? 'text-[#1DB954]' : 'text-white'
                  )}>
                    {track.title}
                  </p>
                  <p className="text-[#727272] text-xs truncate">{track.channelName}</p>
                </div>
                <span className="text-[#727272] text-xs">{formatDuration(track.duration)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-[#b3b3b3] py-12">
            <Music size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Your library is empty</p>
            <p className="text-sm">Play some lectures to see them here</p>
          </div>
        )}

        {/* Recently Played Section Placeholder */}
        {playlist.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={20} className="text-[#b3b3b3]" />
              <h2 className="text-lg font-bold text-white">Recently Played</h2>
            </div>
            <p className="text-[#727272] text-sm">Your listening history will appear here</p>
          </div>
        )}

        {/* Favorites Section Placeholder */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={20} className="text-[#b3b3b3]" />
            <h2 className="text-lg font-bold text-white">Favorites</h2>
          </div>
          <p className="text-[#727272] text-sm">Save your favorite lectures</p>
        </div>
      </div>
    </main>
  );
}