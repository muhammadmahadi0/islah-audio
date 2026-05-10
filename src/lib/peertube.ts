/**
 * PeerTube API Service
 * Fetches videos from PeerTube instances using the v1 API
 */

const PEERTUBE_INSTANCE = process.env.NEXT_PUBLIC_PEERTUBE_INSTANCE || 'https://framatube.org';
const PEERTUBE_API = `${PEERTUBE_INSTANCE}/api/v1`;

export interface PeerTubeChannel {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  createdAt: string;
  updatedAt: string;
  ownerAccount: {
    id: number;
    displayName: string;
    name: string;
  };
}

export interface PeerTubeVideo {
  id: number;
  uuid: string;
  name: string;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  embedUrl: string;
  duration: number;
  publishedAt: string;
  description: string;
  channel: {
    id: number;
    name: string;
    displayName: string;
    avatarUrl: string | null;
  };
  files: PeerTubeFile[];
  streamingPlaylists: PeerTubeStreamingPlaylist[];
}

export interface PeerTubeFile {
  id: number;
  uuid: string;
  filename: string;
  size: number;
  resolution: {
    id: number;
    label: string;
  };
  fps: number | null;
  bitrate: number;
  magnetUri?: string;
  torrentUrl?: string;
  fileUrl?: string;
}

export interface PeerTubeStreamingPlaylist {
  id: number;
  displayName: string;
  tag: string;
  playlistUrl: string;
  segmentsSha256Url: string | null;
}

export interface PeerTubeVideoResponse {
  data: PeerTubeVideo[];
  total: number;
  count: number;
  currentPage: number;
  pageSize: number;
}

class PeerTubeService {
  private baseUrl: string;
  private apiBase: string;

  constructor(instanceUrl: string = PEERTUBE_INSTANCE) {
    this.baseUrl = instanceUrl;
    this.apiBase = `${instanceUrl}/api/v1`;
  }

  /**
   * Search for a channel by name/handle
   * Handles both direct names and @handle format
   */
  async searchChannels(query: string): Promise<PeerTubeChannel[]> {
    try {
      // Clean the query - remove @ prefix if present
      const cleanQuery = query.replace(/^@/, '');

      const response = await fetch(
        `${this.apiBase}/search/channels?search=${encodeURIComponent(cleanQuery)}`
      );

      if (!response.ok) {
        console.error('Search channels failed:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Search channels error:', error);
      return [];
    }
  }

  /**
   * Get channel by name (handles both channel name and @handle)
   */
  async getChannel(channelName: string): Promise<PeerTubeChannel | null> {
    try {
      // Clean the name - remove @ prefix if present
      const cleanName = channelName.replace(/^@/, '');

      const response = await fetch(`${this.apiBase}/video-channels/${cleanName}`);

      if (!response.ok) {
        console.error('Get channel failed:', response.status, response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Get channel error:', error);
      return null;
    }
  }

  /**
   * Get videos from a video channel
   */
  async getChannelVideos(
    channelName: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<PeerTubeVideoResponse> {
    const { page = 1, limit = 30 } = options;

    try {
      // Clean channel name
      const cleanName = channelName.replace(/^@/, '');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: Math.min(limit, 100).toString(), // Cap at 100
        sort: '-publishedAt',
      });

      const response = await fetch(
        `${this.apiBase}/video-channels/${cleanName}/videos?${params}`
      );

      if (!response.ok) {
        console.error('Get channel videos failed:', response.status, response.statusText);
        return { data: [], total: 0, count: 0, currentPage: 1, pageSize: limit };
      }

      return await response.json();
    } catch (error) {
      console.error('Get channel videos error:', error);
      return { data: [], total: 0, count: 0, currentPage: 1, pageSize: limit };
    }
  }

  /**
   * Get video details including streaming playlists
   */
  async getVideo(videoId: string): Promise<PeerTubeVideo | null> {
    try {
      const response = await fetch(`${this.apiBase}/videos/${videoId}`);

      if (!response.ok) {
        console.error('Get video failed:', response.status, response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Get video error:', error);
      return null;
    }
  }

  /**
   * Get the HLS streaming playlist URL
   * Returns the .m3u8 manifest URL for hls.js
   */
  getHlsStreamUrl(video: PeerTubeVideo): string | null {
    // Prefer streaming playlists (HLS)
    if (video.streamingPlaylists && video.streamingPlaylists.length > 0) {
      return video.streamingPlaylists[0].playlistUrl;
    }
    return null;
  }

  /**
   * Get direct audio/video file URL (lowest bitrate for audio-only)
   * This is a fallback for videos without HLS
   */
  getLowestBitrateFileUrl(video: PeerTubeVideo): string | null {
    if (!video.files || video.files.length === 0) return null;

    // Sort by bitrate (ascending) to get lowest quality for audio-only
    const sortedFiles = [...video.files].sort((a, b) => a.bitrate - b.bitrate);

    // Find the first file with a direct URL
    for (const file of sortedFiles) {
      if (file.fileUrl) {
        return file.fileUrl;
      }
    }

    return null;
  }

  /**
   * Check if a video has HLS streaming available
   */
  hasHlsSupport(video: PeerTubeVideo): boolean {
    return (video.streamingPlaylists?.length ?? 0) > 0;
  }

  /**
   * Format duration from seconds to HH:MM:SS or MM:SS
   */
  formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format date for display
   */
  formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Get instance URL
   */
  getInstanceUrl(): string {
    return this.baseUrl;
  }
}

export const peertubeService = new PeerTubeService();

/**
 * Create a Track object from a PeerTube video for the player store
 */
export function createTrackFromPeerTubeVideo(video: PeerTubeVideo): {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channelName: string;
  videoId: string;
  audioUrl?: string;
  hlsUrl?: string;
  publishedAt: string;
  description: string;
} {
  const hlsUrl = peertubeService.getHlsStreamUrl(video);
  const audioUrl = peertubeService.getLowestBitrateFileUrl(video);

  return {
    id: video.uuid,
    title: video.name,
    thumbnail: video.thumbnailUrl || video.previewUrl || '',
    duration: video.duration,
    channelName: video.channel.displayName,
    videoId: video.uuid,
    hlsUrl: hlsUrl || undefined,
    audioUrl: audioUrl || undefined,
    publishedAt: video.publishedAt,
    description: video.description,
  };
}

/**
 * Get API base URL for proxy
 */
export function getApiBase(): string {
  return PEERTUBE_API;
}