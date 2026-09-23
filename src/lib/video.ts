/**
 * Single-video metadata, shared by `/api/stream/[id]` and `/watch/[id]`.
 *
 * Fully keyless: InnerTube `getBasicInfo` gives title, thumbnail, duration,
 * channel, description, publish date and views — no key, no quota.
 * Never throws — unknown IDs come back with `found: false` and callers
 * render fallbacks / 404.
 */

export interface VideoMetadata {
  videoId: string;
  /** False when InnerTube didn't know this ID. */
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

export async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const { getInnertubeVideoMetadata } = await import('./innertube');
  const meta = await getInnertubeVideoMetadata(videoId);
  return {
    ...meta,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
  };
}
