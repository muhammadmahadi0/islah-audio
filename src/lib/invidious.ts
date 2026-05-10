/**
 * Invidious API Helper with Instance Rotation
 * API-KEY-FREE, tries multiple instances until one works
 */

export interface InvidiousVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
}

export interface InvidiousChannel {
  title: string;
  avatar: string;
  videos: InvidiousVideo[];
}

export interface InvidiousStream {
  title: string;
  thumbnail: string;
  duration: number;
  audioUrl: string;
}

// Stable Invidious instances (decentralized)
const INVIDIOUS_INSTANCES = [
  'https://yewtu.be',
  'https://invidious.lunar.icu',
  'https://iv.ggtyler.dev',
  'https://invidious.flokinet.to',
  'https://invidious.nerdvpn.de',
];

/**
 * Fetch with fallback - tries each instance until one works
 */
async function fetchWithFallback<T>(path: string): Promise<{ data: T; instance: string } | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${instance}${path}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      // Check if response is JSON (not HTML)
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.log(`[Invidious] ${instance} returned non-JSON, trying next...`);
        continue;
      }

      const data = await response.json();
      console.log(`[Invidious] Success: ${instance}${path}`);
      return { data, instance };
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
  const result = await fetchWithFallback<any>(`/api/v1/channels/${channelId}`);

  if (!result) return null;

  const { data } = result;

  return {
    title: data.title || '',
    avatar: data.avatar || '',
    videos: (data.latestVideos || []).map((v: any) => ({
      videoId: v.videoId,
      title: v.title,
      thumbnail: v.thumbnails?.[0]?.url || v.thumbnail || '',
      duration: v.lengthSeconds || 0,
    })),
  };
}

/**
 * Get video stream with audio-only URL
 */
export async function getVideoStream(videoId: string): Promise<InvidiousStream | null> {
  const result = await fetchWithFallback<any>(`/api/v1/videos/${videoId}`);

  if (!result) return null;

  const { data } = result;

  // Filter for audio-only formats
  const audioFormats = (data.adaptiveFormats || [])
    .filter((f: any) => f.type?.startsWith('audio/'))
    .map((f: any) => ({ url: f.url, bitrate: f.bitrate || 0 }))
    .sort((a: any, b: any) => b.bitrate - a.bitrate);

  if (audioFormats.length === 0) return null;

  return {
    title: data.title || '',
    thumbnail: data.thumbnails?.[0]?.url || '',
    duration: data.lengthSeconds || 0,
    audioUrl: audioFormats[0].url,
  };
}

// Default channel ID
export const DEFAULT_CHANNEL_ID = 'UC8NjCrYUV5YrpK2j6XTwGSA';