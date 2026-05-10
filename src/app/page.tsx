'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePlayerStore, type Track } from '@/store/player-store';
import { Play, Pause, Music, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_CHANNEL_ID } from '@/lib/invidious';
import { motion, AnimatePresence } from 'framer-motion';

const CHANNEL_ID = DEFAULT_CHANNEL_ID;

interface VideoItem {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
  views: number;
}

// Skeleton Loader
function VideoSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video bg-[#282828] rounded-md mb-3" />
      <div className="h-4 bg-[#282828] rounded w-3/4 mb-2" />
      <div className="h-3 bg-[#282828] rounded w-1/2" />
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
    <motion.div
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay(video)}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative aspect-video mb-3 overflow-hidden rounded-md">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <motion.div
          className={cn(
            'absolute inset-0 bg-black/50 flex items-center justify-center',
            isHovered || isCurrentTrack ? 'opacity-100' : 'opacity-0'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered || isCurrentTrack ? 1 : 0 }}
        >
          <div
            className={cn(
              'w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg',
              isCurrentTrack && isPlaying ? 'bg-[#1DB954]' : 'bg-[#1DB954]'
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
        </motion.div>
        {video.duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-medium">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>
      <h3
        className={cn(
          'text-sm font-medium line-clamp-2 mb-1',
          isCurrentTrack ? 'text-[#1DB954]' : 'text-white group-hover:text-[#1DB954]'
        )}
      >
        {video.title}
      </h3>
    </motion.div>
  );
}

// Error Screen
function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex-1 flex items-center justify-center bg-black">
      <motion.div
        className="text-center p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 rounded-full bg-[#1DB954]/20 flex items-center justify-center mx-auto mb-6">
          <WifiOff size={40} className="text-[#1DB954]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Server Busy</h1>
        <p className="text-[#b3b3b3] mb-6 max-w-md">All streaming services are currently unavailable. Please try again later.</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 mx-auto px-6 py-3 bg-[#1DB954] text-black rounded-full font-medium hover:scale-105 transition-transform"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      </motion.div>
    </main>
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

      console.log('[Page] Fetching channel videos...');

      const res = await fetch(`/api/channel?id=${CHANNEL_ID}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();

      if (!data.success || !data.videos) {
        throw new Error(data.error || 'No videos found');
      }

      setVideos(data.videos);
      if (data.channel?.name) setChannelName(data.channel.name);

      console.log(`[Page] Loaded ${data.videos.length} videos`);
    } catch (err) {
      console.error('[Page] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
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
      channelName,
      videoId: video.videoId,
    };

    const trackList: Track[] = videos.map((v) => ({
      id: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      duration: v.duration,
      channelName,
      videoId: v.videoId,
    }));

    const currentIndex = videos.findIndex((v) => v.videoId === video.videoId);
    playTrack(track, trackList, currentIndex >= 0 ? currentIndex : 0);
  }, [videos, channelName, playTrack]);

  const handleTogglePlay = useCallback(() => {
    if (currentTrack) setIsPlaying(!isPlaying);
  }, [currentTrack, isPlaying, setIsPlaying]);

  if (error && !isLoading) {
    return <ErrorScreen onRetry={fetchVideos} />;
  }

  return (
    <main className="flex-1 overflow-auto bg-gradient-to-b from-[#181818] to-black pb-24 md:pb-0">
      <div className="p-4 md:p-6">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <VideoSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Mobile Header */}
        {!isLoading && !error && (
          <motion.div
            className="flex items-center gap-3 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-14 h-14 rounded-full bg-[#1DB954] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">إ</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#b3b3b3]">Channel</p>
              <h1 className="text-lg font-bold text-white truncate">{channelName}</h1>
            </div>
          </motion.div>
        )}

        {/* Play Button */}
        {!error && !isLoading && videos.length > 0 && (
          <motion.div className="mb-6" whileTap={{ scale: 0.95 }}>
            <button
              onClick={currentTrack ? handleTogglePlay : () => handlePlayVideo(videos[0])}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg"
            >
              {isPlaying && currentTrack ? (
                <Pause size={24} fill="black" className="text-black" />
              ) : (
                <Play size={24} fill="black" className="text-black ml-1" />
              )}
            </button>
          </motion.div>
        )}

        {/* Section Header */}
        {!error && !isLoading && (
          <motion.div
            className="mb-4 md:mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="text-xl md:text-2xl font-bold text-white">Lectures</h2>
          </motion.div>
        )}

        {/* Video Grid */}
        {!error && !isLoading && videos.length > 0 && (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {videos.map((video, index) => (
              <motion.div
                key={video.videoId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <VideoCard
                  video={video}
                  onPlay={handlePlayVideo}
                  isPlaying={isPlaying}
                  isCurrentTrack={currentTrack?.videoId === video.videoId}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty */}
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