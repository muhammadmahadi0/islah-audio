'use client';

import { useEffect, useState, useRef } from 'react';
import { pipedService, type PipedChannel, type PipedVideo, type PipedStreamsResponse } from '@/lib/piped-service';
import { usePlayerStore, type Track } from '@/store/player-store';
import { Home, Search, Library, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

// Sidebar Component
function Sidebar() {
  const [activeTab, setActiveTab] = useState('home');

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'library', icon: Library, label: 'Your Library' },
  ];

  return (
    <aside className="w-60 bg-black flex flex-col h-full">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-spotify-accent text-2xl font-bold flex items-center gap-2">
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
                ? 'bg-spotify-bg-tertiary text-white'
                : 'text-spotify-text-secondary hover:text-white'
            )}
          >
            <item.icon size={22} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Channel Playlists */}
      <div className="mt-6 px-3">
        <h2 className="px-4 text-xs font-semibold text-spotify-text-muted uppercase tracking-wider mb-3">
          Playlists
        </h2>
        <div className="px-4 py-2">
          <p className="text-spotify-text-secondary text-sm hover:text-white cursor-pointer">
            Islah BD Latest
          </p>
        </div>
      </div>
    </aside>
  );
}

// Video Card Component
function VideoCard({
  video,
  index,
  onPlay,
}: {
  video: PipedVideo;
  index: number;
  onPlay: (video: PipedVideo, index: number) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay(video, index)}
    >
      <div className="relative aspect-square mb-3 overflow-hidden rounded-md">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Play button overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="w-14 h-14 rounded-full bg-spotify-accent flex items-center justify-center shadow-lg">
            <Play size={28} className="text-black ml-1" fill="black" />
          </div>
        </div>
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-medium">
          {formatDuration(video.duration)}
        </div>
      </div>
      <h3 className="text-white text-sm font-medium line-clamp-2 mb-1 group-hover:text-spotify-accent transition-colors">
        {video.title}
      </h3>
      <p className="text-spotify-text-muted text-xs">{formatDate(video.uploaded)}</p>
    </div>
  );
}

// Video Grid Component
function VideoGrid({
  videos,
  isLoading,
  onPlayVideo,
}: {
  videos: PipedVideo[];
  isLoading: boolean;
  onPlayVideo: (video: PipedVideo, index: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-spotify-text-secondary">Loading...</div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-spotify-text-secondary">No videos found</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {videos.map((video, index) => (
        <VideoCard
          key={video.videoId}
          video={video}
          index={index}
          onPlay={onPlayVideo}
        />
      ))}
    </div>
  );
}

// Player Component
function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    setCurrentTrack,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    playNext,
    playPrevious,
  } = usePlayerStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setVolume(volume === 0 ? 0.8 : 0);
  };

  if (!currentTrack) {
    return (
      <div className="h-[90px] bg-spotify-bg-secondary border-t border-spotify-bg-tertiary flex items-center justify-center">
        <p className="text-spotify-text-muted text-sm">Select a track to start playing</p>
      </div>
    );
  }

  return (
    <div className="h-[90px] bg-spotify-bg-secondary border-t border-spotify-bg-tertiary flex items-center px-4">
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={playNext}
      />

      {/* Track Info - Left */}
      <div className="flex items-center gap-4 w-1/4 min-w-0">
        {currentTrack.thumbnail && (
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="w-14 h-14 rounded object-cover"
          />
        )}
        <div className="min-w-0">
          <h4 className="text-white text-sm font-medium truncate">{currentTrack.title}</h4>
          <p className="text-spotify-text-muted text-xs truncate">{currentTrack.channelName}</p>
        </div>
      </div>

      {/* Controls - Center */}
      <div className="flex flex-col items-center flex-1 max-w-[40%]">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={playPrevious}
            className="text-spotify-text-secondary hover:text-white transition-colors"
          >
            <SkipBack size={20} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" className="ml-0.5" />}
          </button>
          <button
            onClick={playNext}
            className="text-spotify-text-secondary hover:text-white transition-colors"
          >
            <SkipForward size={20} />
          </button>
        </div>
        <div className="w-full flex items-center gap-2 player-progress">
          <span className="text-xs text-spotify-text-muted w-10 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1"
          />
          <span className="text-xs text-spotify-text-muted w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume - Right */}
      <div className="flex items-center gap-3 w-1/4 justify-end">
        <button
          onClick={toggleMute}
          className="text-spotify-text-secondary hover:text-white transition-colors"
        >
          {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-24"
        />
      </div>
    </div>
  );
}

// Main Page Component
export default function HomePage() {
  const [channel, setChannel] = useState<PipedChannel | null>(null);
  const [videos, setVideos] = useState<PipedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { setPlaylist, playTrack, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();

  useEffect(() => {
    async function fetchChannelData() {
      try {
        setIsLoading(true);
        setError(null);

        // Search for islahbd channel
        const channels = await pipedService.searchChannels('islahbd');

        if (channels.length === 0) {
          setError('Channel not found');
          return;
        }

        // Find the islahbd channel
        const targetChannel = channels.find(
          (c) => c.name.toLowerCase().includes('islah') || c.name.toLowerCase().includes('islahbd')
        ) || channels[0];

        setChannel(targetChannel);

        // Get channel details with videos
        const channelData = await pipedService.getChannel(targetChannel.name);

        if (channelData) {
          const allVideos = [...(channelData.videos || []), ...(channelData.relatedStreams || [])];
          setVideos(allVideos);
        }
      } catch (err) {
        console.error('Failed to fetch channel:', err);
        setError('Failed to load channel data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchChannelData();
  }, []);

  const handlePlayVideo = async (video: PipedVideo, index: number) => {
    try {
      const streams: PipedStreamsResponse | null = await pipedService.getStreams(video.videoId);

      if (!streams || !streams.audioStreams || streams.audioStreams.length === 0) {
        console.error('No audio streams available');
        return;
      }

      const audioUrl = pipedService.getBestAudioStream(streams.audioStreams);

      if (!audioUrl) {
        console.error('No audio URL found');
        return;
      }

      const track: Track = {
        id: video.videoId,
        title: video.title,
        thumbnail: video.thumbnail,
        duration: video.duration,
        channelName: video.uploaderName,
        videoId: video.videoId,
        audioUrl,
      };

      const trackList: Track[] = videos.map((v) => ({
        id: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail,
        duration: v.duration,
        channelName: v.uploaderName,
        videoId: v.videoId,
      }));

      playTrack(track, trackList, index);
    } catch (err) {
      console.error('Failed to play video:', err);
    }
  };

  const handleTogglePlay = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex h-screen bg-spotify-bg">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gradient-to-b from-spotify-bg-secondary to-spotify-bg">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-gradient-to-b from-spotify-bg-secondary/95 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:scale-105 transition-transform">
                ←
              </button>
              <button className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:scale-105 transition-transform">
                →
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-1.5 rounded-full bg-white text-black font-medium text-sm hover:scale-105 transition-transform">
                Explore Premium
              </button>
              <div className="w-8 h-8 rounded-full bg-spotify-accent flex items-center justify-center text-black font-bold text-sm">
                M
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Channel Hero */}
          {channel && (
            <div className="flex items-end gap-6 mb-8">
              <div className="w-52 h-52 flex-shrink-0 rounded-lg overflow-hidden shadow-xl">
                <img
                  src={channel.avatar}
                  alt={channel.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white mb-2">Channel</p>
                <h1 className="text-5xl font-bold text-white mb-4">{channel.name}</h1>
                <p className="text-spotify-text-secondary text-sm">
                  {channel.subscriberCount.toLocaleString()} subscribers
                </p>
              </div>
            </div>
          )}

          {/* Play Button */}
          <div className="mb-8">
            <button
              onClick={currentTrack ? handleTogglePlay : () => videos[0] && handlePlayVideo(videos[0], 0)}
              className="w-14 h-14 rounded-full bg-spotify-accent flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
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
            <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">Latest Videos</h2>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-spotify-accent text-center">
                <p className="text-lg mb-2">⚠️ {error}</p>
                <p className="text-spotify-text-muted text-sm">Please check your connection and try again</p>
              </div>
            </div>
          )}

          {/* Video Grid */}
          {!error && <VideoGrid videos={videos} isLoading={isLoading} onPlayVideo={handlePlayVideo} />}
        </div>
      </main>

      {/* Player */}
      <Player />
    </div>
  );
}