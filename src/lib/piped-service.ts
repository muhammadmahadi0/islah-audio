const getPipedInstances = (): string[] => {
  const primary = process.env.NEXT_PUBLIC_PIPED_API || '';
  const fallback = process.env.NEXT_PUBLIC_PIPED_FALLBACK || '';
  const instances: string[] = [primary, ...fallback.split(',').filter(Boolean)];
  return instances.filter((url): url is string => Boolean(url));
};

const PIPED_INSTANCES = getPipedInstances();

const CHANNEL_HANDLE = process.env.NEXT_PUBLIC_CHANNEL_HANDLE || '@islahbd';

export interface PipedStream {
  url: string;
  format: string;
  quality: string;
  codec: string;
  bitrate: string;
  language: string;
}

export interface PipedVideo {
  title: string;
  videoId: string;
  thumbnail: string;
  duration: number;
  uploaded: string;
  views: number;
  uploaderName: string;
  uploaderAvatar: string;
  uploaderId: string;
}

export interface PipedChannel {
  name: string;
  banner: string;
  avatar: string;
  description: string;
  subscriberCount: number;
  verified: boolean;
  videos: PipedVideo[];
  relatedStreams: PipedVideo[];
  playlists?: PipedPlaylist[];
}

export interface PipedPlaylist {
  name: string;
  playlistId: string;
  thumbnail: string;
  videos: PipedVideo[];
}

export interface PipedStreamsResponse {
  title: string;
  videoId: string;
  thumbnail: string;
  audioStreams: PipedStream[];
  videoStreams: PipedStream[];
  subtitles: unknown[];
  live: boolean;
  duration: number;
}

export interface PipedSearchResult {
  results: {
    id: number;
    url: string;
    title: string;
    thumbnail: string;
    type: 'channel' | 'video' | 'playlist';
  }[];
}

class PipedService {
  private currentInstanceIndex = 0;

  private get baseUrl(): string {
    return PIPED_INSTANCES[this.currentInstanceIndex] || PIPED_INSTANCES[0];
  }

  private async fetchWithTimeout<T>(url: string, timeout = 10000): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async tryFetchWithFallback<T>(path: string): Promise<T | null> {
    for (let i = 0; i < PIPED_INSTANCES.length; i++) {
      const instance = PIPED_INSTANCES[(this.currentInstanceIndex + i) % PIPED_INSTANCES.length];
      try {
        const data = await this.fetchWithTimeout<T>(`${instance}${path}`);
        this.currentInstanceIndex = (this.currentInstanceIndex + i) % PIPED_INSTANCES.length;
        return data;
      } catch (error) {
        console.warn(`Failed to fetch from ${instance}, trying next...`);
        continue;
      }
    }
    return null;
  }

  async searchChannels(query: string): Promise<PipedChannel[]> {
    try {
      const data = await this.tryFetchWithFallback<{ items: PipedChannel[] }>(
        `/search?q=${encodeURIComponent(query)}&filter=channels`
      );
      return data?.items || [];
    } catch (error) {
      console.error('Failed to search channels:', error);
      return [];
    }
  }

  async getChannel(channelId: string): Promise<PipedChannel | null> {
    try {
      const data = await this.tryFetchWithFallback<PipedChannel>(
        `/channel/${channelId}`
      );
      return data;
    } catch (error) {
      console.error('Failed to get channel:', error);
      return null;
    }
  }

  async getStreams(videoId: string): Promise<PipedStreamsResponse | null> {
    try {
      const data = await this.tryFetchWithFallback<PipedStreamsResponse>(
        `/streams/${videoId}`
      );
      return data;
    } catch (error) {
      console.error('Failed to get streams:', error);
      return null;
    }
  }

  async searchVideos(query: string, channelId?: string): Promise<PipedVideo[]> {
    try {
      const data = await this.tryFetchWithFallback<PipedSearchResult>(
        `/search?q=${encodeURIComponent(query)}`
      );
      return data?.results
        ?.filter(r => r.type === 'video')
        .map(r => ({
          title: r.title,
          videoId: r.url.split('watch?v=')[1]?.split('&')[0] || '',
          thumbnail: r.thumbnail,
          duration: 0,
          uploaded: '',
          views: 0,
          uploaderName: '',
          uploaderAvatar: '',
          uploaderId: '',
        })) || [];
    } catch (error) {
      console.error('Failed to search videos:', error);
      return [];
    }
  }

  /**
   * Get channel by handle (e.g., @islahbd)
   * Piped API uses /channels/{channelId} endpoint
   */
  async getChannelByHandle(handle: string): Promise<PipedChannel | null> {
    try {
      // First, search for the channel to get the channelId
      const cleanHandle = handle.replace(/^@/, '');
      const searchResults = await this.tryFetchWithFallback<{
        items: Array<{ url: string; name: string }>;
      }>(`/search?q=${encodeURIComponent(cleanHandle)}&filter=channels`);

      if (!searchResults?.items || searchResults.items.length === 0) {
        console.error('Channel not found:', handle);
        return null;
      }

      // Extract channelId from URL (e.g., "/channel/UCxxxx")
      const channelUrl = searchResults.items[0].url;
      const channelIdMatch = channelUrl.match(/\/channel\/([a-zA-Z0-9_-]+)/);

      if (!channelIdMatch) {
        console.error('Invalid channel URL:', channelUrl);
        return null;
      }

      const channelId = channelIdMatch[1];
      return this.getChannel(channelId);
    } catch (error) {
      console.error('Failed to get channel by handle:', error);
      return null;
    }
  }

  /**
   * Get videos from a specific channel
   */
  async getChannelVideos(channelId: string, options: { page?: number; limit?: number } = {}): Promise<PipedVideo[]> {
    try {
      const { page = 1, limit = 50 } = options;

      // Piped uses the channel endpoint which includes relatedStreams
      const channel = await this.getChannel(channelId);

      if (!channel) {
        return [];
      }

      // Return the related streams (videos) from the channel
      return channel.relatedStreams || [];
    } catch (error) {
      console.error('Failed to get channel videos:', error);
      return [];
    }
  }

  /**
   * Get channel ID from handle
   */
  async resolveChannelId(handle: string): Promise<string | null> {
    try {
      const cleanHandle = handle.replace(/^@/, '');
      const searchResults = await this.tryFetchWithFallback<{
        items: Array<{ url: string; name: string }>;
      }>(`/search?q=${encodeURIComponent(cleanHandle)}&filter=channels`);

      if (!searchResults?.items || searchResults.items.length === 0) {
        return null;
      }

      const channelUrl = searchResults.items[0].url;
      const channelIdMatch = channelUrl.match(/\/channel\/([a-zA-Z0-9_-]+)/);

      return channelIdMatch ? channelIdMatch[1] : null;
    } catch (error) {
      console.error('Failed to resolve channel ID:', error);
      return null;
    }
  }

  /**
   * Get the default channel handle from environment
   */
  getDefaultChannelHandle(): string {
    return CHANNEL_HANDLE;
  }

  getBestAudioStream(streams: PipedStream[]): string | null {
    if (!streams || streams.length === 0) return null;

    // Priority: m4a format > opus > other
    // Then by quality/bitrate
    const scored = streams.map(stream => {
      let score = 0;

      // Prefer m4a for browser compatibility
      if (stream.format?.toLowerCase().includes('m4a')) score += 100;
      if (stream.format?.toLowerCase().includes('mp4')) score += 80;

      // Prefer opus (usually better quality)
      if (stream.codec?.toLowerCase().includes('opus')) score += 50;

      // Parse bitrate (e.g., "128kbps" -> 128)
      const bitrate = parseInt(stream.bitrate?.replace(/\D/g, '') || '0');
      score += bitrate;

      // Parse quality (e.g., "128kbps" -> 128)
      const quality = parseInt(stream.quality?.replace(/\D/g, '') || '0');
      score += quality;

      return { stream, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.stream?.url || null;
  }
}

export const pipedService = new PipedService();