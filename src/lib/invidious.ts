/**
 * Invidious API Fetcher with Instance Rotation
 * Tries multiple Invidious instances until one works
 */

export interface InvidiousVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
  views: number;
  published: string;
}

export interface InvidiousChannel {
  title: string;
  banner: string;
  avatar: string;
  description: string;
  subscriberCount: number;
  videos: InvidiousVideo[];
}

export interface InvidiousStream {
  title: string;
  thumbnail: string;
  duration: number;
  audioUrl: string;
}

// Primary Invidious instances (decentralized, more reliable)
const INVIDIOUS_INSTANCES = [
  'https://yewtu.be',
  'https://invidious.nerdvpn.de',
  'https://invidious.projectsegfau.lt',
  'https://iv.ggtyler.dev',
];

/**
 * Fetch from Invidious with instance rotation and timeout
 */
async function fetchFromInvidious<T>(path: string): Promise<{ data: T; instance: string } | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const url = `${instance}${path}`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'IslahAudio/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`[Invidious] Success: ${instance}${path}`);
        const data = await response.json();
        return { data, instance };
      } else if (response.status === 404) {
        // Specific video not found - don't try other instances
        console.log(`[Invidious] Not found: ${instance}${path}`);
        return null;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'timeout';
      console.log(`[Invidious] Failed: ${instance}${path} - ${msg}`);
    }
  }
  console.error(`[Invidious] All instances failed for: ${path}`);
  return null;
}

/**
 * Get channel videos
 */
export async function getChannelVideos(channelId: string): Promise<InvidiousChannel | null> {
  const result = await fetchFromInvidious<any>(`/api/v1/channels/${channelId}`);
  if (!result) return null;

  const { data } = result;

  return {
    title: data.title || '',
    banner: data.banner || '',
    avatar: data.avatar || '',
    description: data.description || '',
    subscriberCount: data.subscriberCount || 0,
    videos: (data.latestVideos || []).map((v: any) => ({
      videoId: v.videoId,
      title: v.title,
      thumbnail: v.thumbnails?.[0]?.url || v.thumbnail || '',
      duration: v.lengthSeconds || 0,
      views: 0,
      published: v.published || '',
    })),
  };
}

/**
 * Get video info with audio streams
 */
export async function getVideoStream(videoId: string): Promise<InvidiousStream | null> {
  const result = await fetchFromInvidious<any>(`/api/v1/videos/${videoId}`);
  if (!result) return null;

  const { data } = result;

  // Find audio-only streams (adaptiveFormats with audio)
  const audioStreams = (data.adaptiveFormats || [])
    .filter((f: any) => f.type?.startsWith('audio/'))
    .map((f: any) => ({
      url: f.url,
      bitrate: f.bitrate || 0,
      type: f.type,
    }));

  if (audioStreams.length === 0) {
    console.log(`[Invidious] No audio-only streams for: ${videoId}`);
    return null;
  }

  // Sort by bitrate (highest quality first)
  audioStreams.sort((a: any, b: any) => b.bitrate - a.bitrate);

  return {
    title: data.title || '',
    thumbnail: data.thumbnails?.[0]?.url || data.thumbnail || '',
    duration: data.lengthSeconds || 0,
    audioUrl: audioStreams[0].url,
  };
}

// Hardcoded Channel ID for Islah BD
export const DEFAULT_CHANNEL_ID = 'UCGv3nK48XG7f5O7fR05M90g';