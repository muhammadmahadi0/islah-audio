'use client';

import { useEffect, useState, useMemo } from 'react';
import { pipedService, type PipedChannel, type PipedVideo } from '@/lib/piped-service';
import { usePlayerStore, type Track } from '@/store/player-store';
import { Home, Search, Clock, Play, Pause, Music, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Configuration - Channel to fetch from
const CHANNEL_HANDLE = process.env.NEXT_PUBLIC_CHANNEL_HANDLE || '@islahbd';
const PIPED_API = process.env.NEXT_PUBLIC_PIPED_API || 'https://pipedapi.kavin.rocks';

// Sidebar Component
function Sidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'recent', icon: Clock, label: 'Recent' },
  ];

  return (
    <aside className="w-60 bg-black flex flex-col h-full">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-[#1DB954] text-2xl font-bold flex items-center gap-2">
          <span className="text-3xl">🎵</span>
          Islah Audio
        </h1>
      </div>

      {/* Navigation */}
      <nav className="px-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              'w-full flex items-center gap-4 px-4 py-3 rounded-md text-left transition-colors',
              activeTab === item.id
                ? 'bg-[#282828] text-white'
                : 'text-[#b3b3b3] hover:text-white'
            )}
          >
            <item.icon size={22} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Channel Info */}
      <div className="mt-6 px-3 flex-1 overflow-hidden flex flex-col">
        <h2 className="px-4 text-xs font-semibold text-[#727272] uppercase tracking-wider mb-3">
          Current Channel
        </h2>
        <div className="px-4">
          <p className="text-[#b3b3b3] text-sm font-medium">{CHANNEL_HANDLE}</p>
          <p className="text-[#727272] text-xs mt-1">{PIPED_API.replace('https://', '')}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#282828]">
        <p className="text-xs text-[#727272] text-center">Powered by Piped API</p>
      </div>
    </aside>
  );
}

// Search Component
function SearchBox({ onSearch, isSearching }: { onSearch: (query: string) => void; isSearching: boolean }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727272]" size={18} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search lectures..."
        disabled={isSearching}
        className="w-full bg-[#282828] text-white placeholder-[#727272] rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#1DB954] disabled:opacity-50"
      />
    </form>
  );
}

// Video Card Component
function VideoCard({
  video,
  onPlay,
  isPlaying,
  isCurrentTrack,
}: {
  video: PipedVideo;
  onPlay: (video: PipedVideo) => void;
  isPlaying: boolean;
  isCurrentTrack: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const thumbnail = video.thumbnail || '/placeholder.jpg';

  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay(video)}
    >
      <div className="relative aspect-video mb-3 overflow-hidden rounded-md">
        <img
          src={thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Play button overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200',
            isHovered || isCurrentTrack ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform',
              isCurrentTrack && isPlaying ? 'bg-[#1DB954]' : 'bg-[#1DB954] hover:scale-105'
            )}
          >
            {isCurrentTrack && isPlaying ? (
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-4 bg-black rounded-full animate-pulse" />
                <span className="w-1 h-4 bg-black rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <span className="w-1 h-4 bg-black rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            ) : (
              <Play size={28} fill="black" className="text-black ml-1" />
            )}
          </div>
        </div>
        {/* Duration badge */}
        {video.duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-medium">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>
      <h3
        className={cn(
          'text-sm font-medium line-clamp-2 mb-1 transition-colors',
          isCurrentTrack ? 'text-[#1DB954]' : 'text-white group-hover:text-[#1DB954]'
        )}
      >
        {video.title}
      </h3>
      <p className="text-[#727272] text-xs">{formatViews(video.views)} views</p>
    </div>
  );
}

// Helper function to format duration
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

// Helper function to format views
function formatViews(views: number): string {
  if (!views) return '0';
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
}

// Video Grid Component
function VideoGrid({
  videos,
  isLoading,
  onPlayVideo,
  isPlaying,
  currentTrackId,
}: {
  videos: PipedVideo[];
  isLoading: boolean;
  onPlayVideo: (video: PipedVideo) => void;
  isPlaying: boolean;
  currentTrackId?: string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-[#b3b3b3]">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading lectures...</span>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#b3b3b3] text-center">
          <Music size={48} className="mx-auto mb-4 opacity-50" />
          <p>No lectures found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {videos.map((video) => (
        <VideoCard
          key={video.videoId}
          video={video}
          onPlay={onPlayVideo}
          isPlaying={isPlaying}
          isCurrentTrack={currentTrackId === video.videoId}
        />
      ))}
    </div>
  );
}

// Main Page Component
export default function HomePage() {
  const [channel, setChannel] = useState<PipedChannel | null>(null);
  const [videos, setVideos] = useState<PipedVideo[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { playTrack, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();

  // Fetch channel data
  const fetchChannelData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Resolve channel ID from handle
      const channelId = await pipedService.resolveChannelId(CHANNEL_HANDLE);

      if (!channelId) {
        setError(`Channel "${CHANNEL_HANDLE}" not found`);
        return;
      }

      // Step 2: Get channel details and videos
      const channelData = await pipedService.getChannel(channelId);

      if (!channelData) {
        setError(`Failed to fetch channel data for "${CHANNEL_HANDLE}"`);
        return;
      }

      setChannel(channelData);

      // Get videos from channel (relatedStreams contains the videos)
      const channelVideos = channelData.relatedStreams || [];
      setVideos(channelVideos);

      if (channelVideos.length === 0) {
        console.warn('Channel found but no videos available');
      }
    } catch (err) {
      console.error('Failed to fetch channel:', err);
      setError('Failed to load channel data. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (activeTab === 'home') {
      fetchChannelData();
    }
  }, [activeTab]);

  // Filter videos for search
  const filteredVideos = useMemo(() => {
    return videos;
  }, [videos]);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      fetchChannelData();
      return;
    }

    const lowerQuery = query.toLowerCase();
    const matchedVideos = videos.filter((v) =>
      v.title.toLowerCase().includes(lowerQuery)
    );

    if (matchedVideos.length > 0) {
      setVideos(matchedVideos);
    } else {
      setError('No matching lectures found');
    }
  };

  const handlePlayVideo = (video: PipedVideo) => {
    // Create track with video info
    // The AudioPlayer will fetch the audio stream URL via the API
    const track: Track = {
      id: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      duration: video.duration,
      channelName: video.uploaderName,
      videoId: video.videoId,
    };

    // Build playlist from current videos
    const trackList: Track[] = filteredVideos.map((v) => ({
      id: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      duration: v.duration,
      channelName: v.uploaderName,
      videoId: v.videoId,
    }));

    // Find current index
    const currentIndex = filteredVideos.findIndex((v) => v.videoId === video.videoId);

    playTrack(track, trackList, currentIndex >= 0 ? currentIndex : 0);
  };

  const handleTogglePlay = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleBackToHome = () => {
    setError(null);
    fetchChannelData();
  };

  return (
    <div className="flex h-screen bg-[#121212]">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gradient-to-b from-[#181818] to-[#121212]">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-gradient-to-b from-[#181818]/95 to-transparent p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {error && (
                <button
                  onClick={handleBackToHome}
                  className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:scale-105 transition-transform"
                >
                  <RefreshCw size={16} />
                </button>
              )}
              <div className="w-64">
                <SearchBox onSearch={handleSearch} isSearching={isSearching} />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Channel Hero */}
          {channel && !isLoading && (
            <div className="flex items-end gap-6 mb-8">
              <div className="w-52 h-52 flex-shrink-0 rounded-lg overflow-hidden shadow-xl">
                {channel.avatar ? (
                  <img
                    src={channel.avatar}
                    alt={channel.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                    <Music size={48} className="text-[#727272]" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white mb-2">Channel</p>
                <h1 className="text-5xl font-bold text-white mb-4">{channel.name}</h1>
                {channel.description && (
                  <p className="text-[#b3b3b3] text-sm mt-2 max-w-xl line-clamp-2">
                    {channel.description}
                  </p>
                )}
                <p className="text-[#727272] text-sm mt-2">
                  {formatSubscribers(channel.subscriberCount)} subscribers
                </p>
              </div>
            </div>
          )}

          {/* Play Button */}
          <div className="mb-8">
            <button
              onClick={
                currentTrack
                  ? handleTogglePlay
                  : () => filteredVideos[0] && handlePlayVideo(filteredVideos[0])
              }
              className="w-14 h-14 rounded-full bg-[#1DB954] flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            >
              {isPlaying && currentTrack ? (
                <Pause size={28} fill="black" className="text-black" />
              ) : (
                <Play size={28} fill="black" className="text-black ml-1" />
              )}
            </button>
          </div>

          {/* Section Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">
              {channel ? 'Lectures' : 'Latest Videos'}
            </h2>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center h-64 mb-6">
              <div className="text-[#1DB954] text-center">
                <p className="text-lg mb-2">{error}</p>
                <button
                  onClick={handleBackToHome}
                  className="text-[#727272] text-sm hover:text-white"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Video Grid */}
          {!error && (
            <VideoGrid
              videos={filteredVideos}
              isLoading={isLoading || isSearching}
              onPlayVideo={handlePlayVideo}
              isPlaying={isPlaying}
              currentTrackId={currentTrack?.videoId}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// Helper function to format subscribers
function formatSubscribers(count: number): string {
  if (!count) return '0';
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}