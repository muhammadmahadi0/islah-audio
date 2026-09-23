/**
 * Single-video metadata, shared by `/api/stream/[id]` and `/watch/[id]`.
 *
 * Prefers the YouTube Data API when a key exists (title, thumbnail,
 * duration, channel, description, publish date, views), otherwise falls back
 * to the keyless oEmbed endpoint (title, author, thumbnail). Never throws —
 * unknown fields come back empty and callers render fallbacks.
 */

export interface VideoMetadata {
  videoId: string;
  /** False when neither the Data API nor oEmbed knew this ID. */
  found: boolean;
  title: string;
  thumbnail: string;
  duration: number;
  channelName: string;
  description: string;
  publishedAt: string;
  views: number;
  url: string;
  embedUrl: string;
}

const VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;

export function isVideoId(value: unknown): value is string {
  return typeof value === 'string' && VIDEO_ID.test(value);
}

function apiKey(): string {
  return process.env.YOUTUBE_API_KEY || (import.meta as any).env?.YOUTUBE_API_KEY || '';
}

/** `PT1H2M3S` → seconds. */
function parseDuration(iso: string): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (
    parseInt(m[1] || '0', 10) * 3600 +
    parseInt(m[2] || '0', 10) * 60 +
    parseInt(m[3] || '0', 10)
  );
}

function empty(videoId: string): VideoMetadata {
  return {
    videoId,
    found: false,
    title: '',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: 0,
    channelName: '',
    description: '',
    publishedAt: '',
    views: 0,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
  };
}

export async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const meta = empty(videoId);
  const key = apiKey();

  try {
    if (key) {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.searchParams.set('key', key);
      url.searchParams.set('part', 'snippet,contentDetails,statistics');
      url.searchParams.set('id', videoId);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(url.toString(), {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (res.ok) {
          const item = (await res.json())?.items?.[0];
          if (item) {
            meta.found = true;
            meta.title = item.snippet?.title || '';
            meta.thumbnail =
              item.snippet?.thumbnails?.medium?.url ||
              item.snippet?.thumbnails?.default?.url ||
              meta.thumbnail;
            meta.channelName = item.snippet?.channelTitle || '';
            meta.description = item.snippet?.description || '';
            meta.publishedAt = item.snippet?.publishedAt || '';
            meta.duration = parseDuration(item.contentDetails?.duration || '');
            meta.views = parseInt(item.statistics?.viewCount || '0', 10) || 0;
          }
        }
      } finally {
        clearTimeout(timeout);
      }
      return meta;
    }

    // Keyless path: oEmbed gives title + author + thumbnail, no key, no quota.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { headers: { Accept: 'application/json' }, signal: controller.signal }
      );
      if (res.ok) {
        const data = await res.json();
        meta.found = true;
        meta.title = data?.title || '';
        meta.channelName = data?.author_name || '';
        meta.thumbnail = data?.thumbnail_url || meta.thumbnail;
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('[Video] metadata fetch failed:', error);
  }

  return meta;
}
