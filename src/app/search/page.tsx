'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { usePlayerStore, type Track } from '@/store/player-store';
import { Search as SearchIcon, Play, Pause, Music, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_CHANNEL_ID } from '@/lib/invidious';

interface ChannelVideo {
  videoId: string;
  id?: string;
  title: string;
  thumbnail: string;
  duration: number;
  publishedAt?: string;
}

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
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { playTrack, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();

  // Load the channel catalog once — search filters it client-side.
  // (Previously this used the Piped API, whose public instances are dead.)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/channel?id=${DEFAULT_CHANNEL_ID}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.success && Array.isArray(data.videos)) {
          setVideos(data.videos);
        }
      } catch (error) {
        console.error('Search catalog load error:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(query.trim());
  }, [query]);

  const results = useMemo(() => {
    const q = submittedQuery.toLowerCase();
    if (!q) return [];
    return videos.filter((v) => v.title.toLowerCase().includes(q));
  }, [videos, submittedQuery]);

  const toTrack = (video: ChannelVideo): Track => ({
    id: video.videoId || video.id || '',
    title: video.title,
    thumbnail: video.thumbnail,
    duration: video.duration || 0,
    channelName: 'Islah',
    videoId: video.videoId || video.id || '',
  });

  const handlePlayVideo = (video: ChannelVideo) => {
    const trackList: Track[] = results.map(toTrack);
    const currentIndex = results.findIndex(
      (v) => (v.videoId || v.id) === (video.videoId || video.id)
    );
    playTrack(toTrack(video), trackList, currentIndex >= 0 ? currentIndex : 0);
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
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={24} className="animate-spin text-[#b3b3b3]" />
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-2">
            {results.map((video) => {
              const videoId = video.videoId || video.id || '';
              return (
                <div
                  key={videoId}
                  onClick={() => handlePlayVideo(video)}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-[#282828] transition-colors',
                    currentTrack?.videoId === videoId && 'bg-[#282828]'
                  )}
                >
                  <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-[#333333]">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      currentTrack?.videoId === videoId ? 'text-[#1DB954]' : 'text-white'
                    )}>
                      {video.title}
                    </p>
                    <p className="text-[#727272] text-xs">Islah</p>
                  </div>
                  {video.duration > 0 && (
                    <span className="text-[#727272] text-xs">{formatDuration(video.duration)}</span>
                  )}
                  {currentTrack?.videoId === videoId && isPlaying && (
                    <div className="flex items-center gap-0.5">
                      <span className="w-1 h-3 bg-[#1DB954] rounded-full animate-pulse" />
                      <span className="w-1 h-3 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1 h-3 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && submittedQuery && results.length === 0 && (
          <div className="text-center text-[#b3b3b3] py-8">
            <SearchIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p>No results found for "{submittedQuery}"</p>
          </div>
        )}

        {!isLoading && !submittedQuery && (
          <div className="text-center text-[#b3b3b3] py-8">
            <SearchIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p>Search for lectures</p>
          </div>
        )}
      </div>
    </main>
  );
}
