const PIPED_API_BASE = 'https://pipedapi.kavin.rocks';

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

class PipedService {
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

  async searchChannels(query: string): Promise<PipedChannel[]> {
    try {
      const data = await this.fetchWithTimeout<{ items: PipedChannel[] }>(
        `${PIPED_API_BASE}/search?q=${encodeURIComponent(query)}&filter=channels`
      );
      return data.items || [];
    } catch (error) {
      console.error('Failed to search channels:', error);
      return [];
    }
  }

  async getChannel(channelId: string): Promise<PipedChannel | null> {
    try {
      const data = await this.fetchWithTimeout<PipedChannel>(
        `${PIPED_API_BASE}/channel/${channelId}`
      );
      return data;
    } catch (error) {
      console.error('Failed to get channel:', error);
      return null;
    }
  }

  async getStreams(videoId: string): Promise<PipedStreamsResponse | null> {
    try {
      const data = await this.fetchWithTimeout<PipedStreamsResponse>(
        `${PIPED_API_BASE}/streams/${videoId}`
      );
      return data;
    } catch (error) {
      console.error('Failed to get streams:', error);
      return null;
    }
  }

  getBestAudioStream(streams: PipedStream[]): string | null {
    if (!streams || streams.length === 0) return null;

    // Prefer opus audio streams (usually better quality)
    const opusStreams = streams.filter(s => s.codec?.includes('opus'));
    const targetStreams = opusStreams.length > 0 ? opusStreams : streams;

    // Sort by quality label (assume higher number = better)
    const sorted = [...targetStreams].sort((a, b) => {
      const qualityA = parseInt(a.quality.replace(/\D/g, '') || '0');
      const qualityB = parseInt(b.quality.replace(/\D/g, '') || '0');
      return qualityB - qualityA;
    });

    return sorted[0]?.url || null;
  }
}

export const pipedService = new PipedService();