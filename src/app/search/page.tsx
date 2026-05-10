'use client';

import { useState, useMemo } from 'react';
import { pipedService, type PipedVideo } from '@/lib/piped-service';
import { usePlayerStore, type Track } from '@/store/player-store';
import { Search as SearchIcon, Play, Pause, Music, Loader2 } from 'lucide-react';
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

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PipedVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { playTrack, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // Search via Piped API
      const channelId = await pipedService.resolveChannelId('@islahbd');
      if (channelId) {
        const channel = await pipedService.getChannel(channelId);
        if (channel?.relatedStreams) {
          const filtered = channel.relatedStreams.filter((v) =>
            v.title.toLowerCase().includes(query.toLowerCase())
          );
          setResults(filtered);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayVideo = (video: PipedVideo) => {
    const track: Track = {
      id: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      duration: video.duration,
      channelName: video.uploaderName,
      videoId: video.videoId,
    };

    const trackList: Track[] = results.map((v) => ({
      id: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      duration: v.duration,
      channelName: v.uploaderName,
      videoId: v.videoId,
    }));

    const currentIndex = results.findIndex((v) => v.videoId === video.videoId);
    playTrack(track, trackList, currentIndex >= 0 ? currentIndex : 0);
  };

  return (
    <main className="flex-1 overflow-auto bg-gradient-to-b from-[#181818] to-[#121212] pb-24 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#181818] p-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727272]" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lectures..."
              className="w-full bg-[#282828] text-white placeholder-[#727272] rounded-full py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
            />
          </div>
        </form>
      </header>

      {/* Results */}
      <div className="p-4">
        {isSearching && (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={24} className="animate-spin text-[#b3b3b3]" />
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="space-y-2">
            {results.map((video) => (
              <div
                key={video.videoId}
                onClick={() => handlePlayVideo(video)}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-[#282828] transition-colors',
                  currentTrack?.videoId === video.videoId && 'bg-[#282828]'
                )}
              >
                <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-[#333333]">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    currentTrack?.videoId === video.videoId ? 'text-[#1DB954]' : 'text-white'
                  )}>
                    {video.title}
                  </p>
                  <p className="text-[#727272] text-xs">{video.uploaderName}</p>
                </div>
                {video.duration > 0 && (
                  <span className="text-[#727272] text-xs">{formatDuration(video.duration)}</span>
                )}
                {currentTrack?.videoId === video.videoId && isPlaying && (
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-[#1DB954] rounded-full animate-pulse" />
                    <span className="w-1 h-3 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1 h-3 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isSearching && query && results.length === 0 && (
          <div className="text-center text-[#b3b3b3] py-8">
            <SearchIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p>No results found for "{query}"</p>
          </div>
        )}

        {!isSearching && !query && (
          <div className="text-center text-[#b3b3b3] py-8">
            <SearchIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p>Search for lectures</p>
          </div>
        )}
      </div>
    </main>
  );
}