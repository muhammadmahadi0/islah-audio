'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePlayerStore, type Track } from '@/store/player-store';
import { Play, Pause, Music, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const CHANNEL_HANDLE = '@islahbd';

interface VideoItem {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
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

function VideoCard({
  video,
  onPlay,
  isPlaying,
  isCurrentTrack,
}: {
  video: VideoItem;
  onPlay: (video: VideoItem) => void;
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

export default function HomePage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelName, setChannelName] = useState('Islah');

  const { playTrack, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();

  const fetchVideos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/channel?handle=${encodeURIComponent(CHANNEL_HANDLE)}&limit=50`);

      if (!res.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await res.json();

      if (!data.success || !data.videos) {
        throw new Error(data.error || 'No videos found');
      }

      setVideos(data.videos);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handlePlayVideo = useCallback((video: VideoItem) => {
    const track: Track = {
      id: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      duration: video.duration,
      channelName: CHANNEL_HANDLE.replace('@', ''),
      videoId: video.videoId,
    };

    const trackList: Track[] = videos.map((v) => ({
      id: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      duration: v.duration,
      channelName: CHANNEL_HANDLE.replace('@', ''),
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

  return (
    <main className="flex-1 overflow-auto bg-gradient-to-b from-[#181818] to-[#121212] pb-24 md:pb-0">
      <div className="p-4 md:p-6">
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-[#b3b3b3]">
              <Loader2 size={24} className="animate-spin" />
              <span>Loading lectures...</span>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-[#1DB954] text-center">
              <p className="text-lg mb-2">{error}</p>
              <button
                onClick={fetchVideos}
                className="flex items-center gap-2 text-[#727272] text-sm hover:text-white mx-auto"
              >
                <RefreshCw size={16} />
                Try again
              </button>
            </div>
          </div>
        )}

        {channelName && !isLoading && !error && (
          <div className="md:hidden flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-[#1DB954] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">إ</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#b3b3b3]">Channel</p>
              <h1 className="text-lg font-bold text-white truncate">{channelName}</h1>
            </div>
          </div>
        )}

        {!error && !isLoading && videos.length > 0 && (
          <div className="mb-6">
            <button
              onClick={currentTrack ? handleTogglePlay : () => handlePlayVideo(videos[0])}
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

        {!error && !isLoading && (
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white">Lectures</h2>
          </div>
        )}

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