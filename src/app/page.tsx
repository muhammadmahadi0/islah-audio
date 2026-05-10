'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { usePlayerStore, type Track } from '@/store/player-store';
import { Play, Pause, Music, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Configuration
const CHANNEL_HANDLE = 'islahbd';

interface ChannelVideo {
  title: string;
  videoId: string;
  thumbnail: string;
  duration: number;
  uploaderName: string;
  views: number;
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
  video: ChannelVideo;
  onPlay: (video: ChannelVideo) => void;
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
  const [channelName, setChannelName] = useState<string>('');
  const [channelAvatar, setChannelAvatar] = useState<string>('');
  const [channelDesc, setChannelDesc] = useState<string>('');
  const [channelSubs, setChannelSubs] = useState<number>(0);
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { playTrack, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();

  const fetchChannelData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Search for the channel
      const searchUrl = `/api/piped?path=${encodeURIComponent(`/search?q=${CHANNEL_HANDLE}&filter=channels`)}`;
      const searchRes = await fetch(searchUrl);

      if (!searchRes.ok) {
        throw new Error('Failed to search for channel');
      }

      const searchData = await searchRes.json();

      if (!searchData.items || searchData.items.length === 0) {
        setError(`Channel "${CHANNEL_HANDLE}" not found`);
        return;
      }

      // Get first channel result
      const channelItem = searchData.items[0];
      const channelUrl = channelItem.url;
      const channelIdMatch = channelUrl.match(/\/channel\/([a-zA-Z0-9_-]+)/);

      if (!channelIdMatch) {
        setError('Could not parse channel ID');
        return;
      }

      const channelId = channelIdMatch[1];
      setChannelName(channelItem.name);
      setChannelAvatar(channelItem.avatar || '');

      // Step 2: Get channel details
      const channelUrl2 = `/api/piped?path=${encodeURIComponent(`/channel/${channelId}`)}`;
      const channelRes = await fetch(channelUrl2);

      if (!channelRes.ok) {
        throw new Error('Failed to fetch channel');
      }

      const channelData = await channelRes.json();

      setChannelName(channelData.name || channelItem.name);
      setChannelAvatar(channelData.avatar || channelItem.avatar);
      setChannelDesc(channelData.description || '');
      setChannelSubs(channelData.subscriberCount || 0);

      // Get videos from relatedStreams
      const videoList: ChannelVideo[] = (channelData.relatedStreams || []).map((v: {
        title: string;
        videoId: string;
        thumbnail: string;
        duration: number;
        uploaderName: string;
        views: number;
      }) => ({
        title: v.title,
        videoId: v.videoId,
        thumbnail: v.thumbnail,
        duration: v.duration,
        uploaderName: v.uploaderName,
        views: v.views || 0,
      }));

      setVideos(videoList);
    } catch (err) {
      console.error('Failed to fetch channel:', err);
      setError('Failed to load channel data. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannelData();
  }, [fetchChannelData]);

  const handlePlayVideo = useCallback((video: ChannelVideo) => {
    const track: Track = {
      id: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      duration: video.duration,
      channelName: video.uploaderName,
      videoId: video.videoId,
    };

    const trackList: Track[] = videos.map((v) => ({
      id: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      duration: v.duration,
      channelName: v.uploaderName,
      videoId: v.videoId,
    }));

    const currentIndex = videos.findIndex((v) => v.videoId === video.videoId);
    playTrack(track, trackList, currentIndex >= 0 ? currentIndex : 0);
  }, [videos, playTrack]);

  const handleTogglePlay = useCallback(() => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  }, [currentTrack, isPlaying, setIsPlaying]);

  // Mobile-first layout
  return (
    <main className="flex-1 overflow-auto bg-gradient-to-b from-[#181818] to-[#121212] pb-24 md:pb-0">
      {/* Header - Hidden on mobile */}
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
        {channelName && !isLoading && !error && (
          <div className="hidden md:flex items-end gap-6 mb-8">
            <div className="w-40 h-40 lg:w-52 lg:h-52 flex-shrink-0 rounded-lg overflow-hidden shadow-xl">
              {channelAvatar ? (
                <img src={channelAvatar} alt={channelName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                  <Music size={48} className="text-[#727272]" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white mb-2">Channel</p>
              <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4">{channelName}</h1>
              {channelDesc && (
                <p className="text-[#b3b3b3] text-sm mt-2 max-w-xl line-clamp-2">{channelDesc}</p>
              )}
              <p className="text-[#727272] text-sm mt-2">{formatSubscribers(channelSubs)} subscribers</p>
            </div>
          </div>
        )}

        {/* Mobile: Simple channel header */}
        {channelName && !isLoading && !error && (
          <div className="md:hidden flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-[#282828] flex-shrink-0">
              {channelAvatar && (
                <img src={channelAvatar} alt={channelName} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#b3b3b3]">Channel</p>
              <h1 className="text-lg font-bold text-white truncate">{channelName}</h1>
            </div>
          </div>
        )}

        {/* Play Button */}
        {!error && !isLoading && videos.length > 0 && (
          <div className="mb-6">
            <button
              onClick={
                currentTrack
                  ? handleTogglePlay
                  : () => handlePlayVideo(videos[0])
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
              {channelName ? 'Lectures' : 'Latest Videos'}
            </h2>
          </div>
        )}

        {/* Video Grid */}
        {!error && !isLoading && videos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
            {videos.map((video) => (
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
        {!error && !isLoading && videos.length === 0 && (
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