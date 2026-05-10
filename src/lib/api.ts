/**
 * Consumet API Fetcher for YouTube content
 */

const CONSUMET_BASE = 'https://api.consumet.org/meta/youtube';

// Fallback instances
const CONSUMET_INSTANCES = [
  'https://api.consumet.org',
  'https://api-v2.consumet.org',
];

export interface ConsumetVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
  views: number;
  uploadedAt: string;
  channelName: string;
  channelId: string;
}

export interface ConsumetChannel {
  name: string;
  banner: string;
  avatar: string;
  description: string;
  subscriberCount: string;
  videos: ConsumetVideo[];
}

export interface ConsumetStream {
  title: string;
  thumbnail: string;
  duration: number;
  audioUrl: string;
}

/**
 * Fetch from Consumet with fallback
 */
async function fetchWithFallback<T>(path: string): Promise<T | null> {
  for (const baseUrl of CONSUMET_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${baseUrl}${path}`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'IslahAudio/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log(`[API] Failed: ${baseUrl}${path}`);
    }
  }
  return null;
}

/**
 * Get channel by ID or handle
 */
export async function getChannel(channelIdOrHandle: string): Promise<ConsumetChannel | null> {
  // If it's a handle (@islahbd), convert to channel endpoint
  if (channelIdOrHandle.startsWith('@')) {
    const handle = channelIdOrHandle.replace('@', '');
    return fetchWithFallback<ConsumetChannel>(`/channels/@${handle}`);
  }

  return fetchWithFallback<ConsumetChannel>(`/channels/${channelIdOrHandle}`);
}

/**
 * Get video info with streams
 */
export async function getVideoInfo(videoId: string): Promise<ConsumetStream | null> {
  const data = await fetchWithFallback<any>(`/info?id=${videoId}`);

  if (!data) return null;

  // Find the best audio stream
  const audioFormats = data.audio?.filter((f: any) => f.url) || [];
  const videoFormats = data.video?.filter((f: any) => f.url) || [];

  // Prefer dedicated audio streams, fallback to video with audio
  const allFormats = [...audioFormats, ...videoFormats];

  if (allFormats.length === 0) return null;

  // Sort by bitrate (higher is better quality)
  allFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

  return {
    title: data.title || '',
    thumbnail: data.thumbnail || '',
    duration: data.duration || 0,
    audioUrl: allFormats[0].url,
  };
}

/**
 * Search videos
 */
export async function searchVideos(query: string, limit = 30): Promise<ConsumetVideo[]> {
  const data = await fetchWithFallback<any>(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);

  if (!data?.results) return [];

  return data.results
    .filter((r: any) => r.type === 'video' && r.videoId)
    .map((r: any) => ({
      videoId: r.videoId,
      title: r.title,
      thumbnail: r.thumbnail,
      duration: r.duration || 0,
      views: r.views || 0,
      uploadedAt: r.uploadedAt || '',
      channelName: r.channel?.name || '',
      channelId: r.channel?.channelId || '',
    }));
}

// Default channel ID for Islah BD
export const DEFAULT_CHANNEL_ID = 'UCGv3nK48XG7f5O7fR05M90g';