'use client';

import { useEffect, useState, useMemo } from 'react';
import { pipedService, type PipedChannel, type PipedVideo } from '@/lib/piped-service';
import { usePlayerStore, type Track } from '@/store/player-store';
import { Play, Pause, Music, Loader2, RefreshCw, Home as HomeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Configuration
const CHANNEL_HANDLE = process.env.NEXT_PUBLIC_CHANNEL_HANDLE || '@islahbd';
const PIPED_API = process.env.NEXT_PUBLIC_PIPED_API || 'https://pipedapi.kavin.rocks';

// Helper functions
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

function formatViews(views: number): string {
  if (!views) return '0';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
}

function formatSubscribers(count: number): string {
  if (!count) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
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

  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay(video)}
    >
      <div className="relative aspect-video mb-3 overflow-hidden rounded-md">
        <img
          src={video.thumbnail}
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
              'w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg transition-transform',
              isCurrentTrack && isPlaying ? 'bg-[#1DB954]' : 'bg-[#1DB954] hover:scale-105'
            )}
          >
            {isCurrentTrack && isPlaying ? (
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-3 md:h-4 bg-black rounded-full animate-pulse" />
                <span className="w-1 h-3 md:h-4 bg-black rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <span className="w-1 h-3 md:h-4 bg-black rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            ) : (
              <Play size={24} fill="black" className="text-black ml-1" />
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

// Main Page Component
export default function HomePage() {
  const [channel, setChannel] = useState<PipedChannel | null>(null);
  const [videos, setVideos] = useState<PipedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { playTrack, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();

  const fetchChannelData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const channelId = await pipedService.resolveChannelId(CHANNEL_HANDLE);
      if (!channelId) {
        setError(`Channel "${CHANNEL_HANDLE}" not found`);
        return;
      }

      const channelData = await pipedService.getChannel(channelId);
      if (!channelData) {
        setError(`Failed to fetch channel data for "${CHANNEL_HANDLE}"`);
        return;
      }

      setChannel(channelData);
      setVideos(channelData.relatedStreams || []);
    } catch (err) {
      console.error('Failed to fetch channel:', err);
      setError('Failed to load channel data. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelData();
  }, []);

  const filteredVideos = useMemo(() => videos, [videos]);

  const handlePlayVideo = (video: PipedVideo) => {
    const track: Track = {
      id: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      duration: video.duration,
      channelName: video.uploaderName,
      videoId: video.videoId,
    };

    const trackList: Track[] = filteredVideos.map((v) => ({
      id: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      duration: v.duration,
      channelName: v.uploaderName,
      videoId: v.videoId,
    }));

    const currentIndex = filteredVideos.findIndex((v) => v.videoId === video.videoId);
    playTrack(track, trackList, currentIndex >= 0 ? currentIndex : 0);
  };

  const handleTogglePlay = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  // Mobile-first layout - no sidebar, full width content
  return (
    <main className="flex-1 overflow-auto bg-gradient-to-b from-[#181818] to-[#121212] pb-24 md:pb-0">
      {/* Header - Hidden on mobile, visible on desktop */}
      <header className="hidden md:sticky md:top-0 md:z-10 md:bg-gradient-to-b md:from-[#181818]/95 md:to-transparent md:p-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">{CHANNEL_HANDLE}</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 md:p-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-[#b3b3b3]">
              <Loader2 size={24} className="animate-spin" />
              <span>Loading lectures...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-[#1DB954] text-center">
              <p className="text-lg mb-2">{error}</p>
              <button
                onClick={fetchChannelData}
                className="flex items-center gap-2 text-[#727272] text-sm hover:text-white mx-auto"
              >
                <RefreshCw size={16} />
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Channel Hero - Hidden on mobile */}
        {channel && !isLoading && !error && (
          <div className="hidden md:flex items-end gap-6 mb-8">
            <div className="w-40 h-40 lg:w-52 lg:h-52 flex-shrink-0 rounded-lg overflow-hidden shadow-xl">
              {channel.avatar ? (
                <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                  <Music size={48} className="text-[#727272]" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white mb-2">Channel</p>
              <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4">{channel.name}</h1>
              {channel.description && (
                <p className="text-[#b3b3b3] text-sm mt-2 max-w-xl line-clamp-2">{channel.description}</p>
              )}
              <p className="text-[#727272] text-sm mt-2">{formatSubscribers(channel.subscriberCount)} subscribers</p>
            </div>
          </div>
        )}

        {/* Mobile: Simple channel header */}
        {channel && !isLoading && !error && (
          <div className="md:hidden flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-[#282828] flex-shrink-0">
              {channel.avatar && (
                <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#b3b3b3]">Channel</p>
              <h1 className="text-lg font-bold text-white truncate">{channel.name}</h1>
            </div>
          </div>
        )}

        {/* Play Button */}
        {!error && !isLoading && filteredVideos.length > 0 && (
          <div className="mb-6">
            <button
              onClick={
                currentTrack
                  ? handleTogglePlay
                  : () => handlePlayVideo(filteredVideos[0])
              }
              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#1DB954] flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            >
              {isPlaying && currentTrack ? (
                <Pause size={24} fill="black" className="text-black" />
              ) : (
                <Play size={24} fill="black" className="text-black ml-1" />
              )}
            </button>
          </div>
        )}

        {/* Section Header */}
        {!error && !isLoading && (
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              {channel ? 'Lectures' : 'Latest Videos'}
            </h2>
          </div>
        )}

        {/* Video Grid */}
        {!error && !isLoading && filteredVideos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.videoId}
                video={video}
                onPlay={handlePlayVideo}
                isPlaying={isPlaying}
                isCurrentTrack={currentTrack?.videoId === video.videoId}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!error && !isLoading && filteredVideos.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-[#b3b3b3] text-center">
              <Music size={48} className="mx-auto mb-4 opacity-50" />
              <p>No lectures found</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}