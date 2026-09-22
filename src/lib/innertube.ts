/**
 * BETA ONLY — InnerTube listing (no API key, no quota).
 *
 * Uses youtubei.js against YouTube's private InnerTube API (the same one
 * youtube.com uses), like the Flow Android app does. Keyless, unlimited —
 * but unofficial, so it can break when YouTube changes things. The YouTube
 * Data API remains as fallback in the routes.
 *
 * Only LISTING goes through InnerTube (uploads, continuations). Playback
 * still uses the official embed and needs no extraction.
 */

import { Innertube, YTNodes, YT } from 'youtubei.js';

export interface InnertubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  /** Duration in seconds (0 when unavailable). */
  duration: number;
  /** Approximate view count parsed from "1.8K views" labels. */
  views: number;
  /** Relative label like "6 days ago" (InnerTube has no ISO date here). */
  publishedAt: string;
}

export interface InnertubeChannel {
  name: string;
  avatar: string;
  videos: InnertubeVideo[];
  /** Opaque token for the next chunk (null when exhausted). */
  nextToken: string | null;
}

let sessionPromise: Promise<any> | null = null;

function getSession(): Promise<any> {
  if (!sessionPromise) {
    sessionPromise = Innertube.create({ generate_session_locally: true }).catch(
      (err) => {
        sessionPromise = null;
        throw err;
      }
    );
  }
  return sessionPromise;
}

/** UC channel ID → UU uploads playlist ID. */
export function uploadsPlaylistId(channelId: string): string {
  if (channelId.startsWith('UU')) return channelId;
  if (channelId.startsWith('UC')) return `UU${channelId.slice(2)}`;
  return channelId;
}

function parseViews(text: string): number {
  const m = text.replace(/,/g, '').match(/([\d.]+)\s*([KMB])?\s*views?/i);
  if (!m) return 0;
  const mult = m[2]?.toUpperCase() === 'B' ? 1e9 : m[2]?.toUpperCase() === 'M' ? 1e6 : m[2]?.toUpperCase() === 'K' ? 1e3 : 1;
  return Math.round(parseFloat(m[1]) * mult) || 0;
}

/** "…1 hour, 2 minutes, 3 seconds" (accessibility label) → seconds. */
function parseA11yDuration(label: string): number {
  if (!label) return 0;
  const h = label.match(/(\d+)\s*hours?/i);
  const m = label.match(/(\d+)\s*minutes?/i);
  const s = label.match(/(\d+)\s*seconds?/i);
  return (
    (h ? parseInt(h[1], 10) * 3600 : 0) +
    (m ? parseInt(m[1], 10) * 60 : 0) +
    (s ? parseInt(s[1], 10) : 0)
  );
}

function parseLockup(node: any): InnertubeVideo | null {
  try {
    if (!node || node.type !== 'LockupView') return null;
    if (node.content_type && node.content_type !== 'VIDEO') return null;

    const videoId: string = node.content_id;
    if (!videoId) return null;

    const title: string = node.metadata?.title?.text || '';
    const thumbnail: string = node.content_image?.image?.[0]?.url || '';

    let views = 0;
    let publishedAt = '';
    const rows = node.metadata?.metadata?.metadata_rows || [];
    for (const row of rows) {
      for (const part of row.metadata_parts || []) {
        const t: string = part.text?.text || '';
        if (/views?/i.test(t)) views = parseViews(t);
        else if (/ago|hour|day|week|month|year|streamed|premiere/i.test(t)) publishedAt = t;
      }
    }

    const duration = parseA11yDuration(
      node.renderer_context?.accessibility_context?.label || ''
    );

    return { videoId, title, thumbnail, duration, views, publishedAt };
  } catch {
    return null;
  }
}

function extractItems(feed: any): InnertubeVideo[] {
  const nodes = feed.memo.getType(YTNodes.LockupView);
  const videos: InnertubeVideo[] = [];
  for (const node of nodes) {
    const v = parseLockup(node);
    if (v) videos.push(v);
  }
  return videos;
}

function extractToken(feed: any): string | null {
  const nodes = feed.memo.getType(YTNodes.ContinuationItem, YTNodes.ContinuationItemView);
  return nodes[0]?.endpoint?.payload?.token || null;
}

/** Fetch one continuation page with a fresh stateless session. */
async function fetchContinuationPage(
  token: string
): Promise<{ videos: InnertubeVideo[]; nextToken: string | null }> {
  const yt = await getSession();
  const raw = await yt.actions.execute('/browse', { continuation: token });
  const page = new YT.Playlist(yt.actions, raw, false);
  return { videos: extractItems(page), nextToken: extractToken(page) };
}

/**
 * Latest uploads of a channel (first page ≈ 100 videos).
 * Throws when InnerTube is unreachable — routes fall back to Data API.
 */
export async function getInnertubeChannelVideos(
  channelId: string
): Promise<InnertubeChannel> {
  const yt = await getSession();

  const [playlist, channel] = await Promise.all([
    yt.getPlaylist(uploadsPlaylistId(channelId)),
    yt.getChannel(channelId).catch(() => null),
  ]);

  const videos = extractItems(playlist);

  // Channel name/avatar (best effort — avatar shape varies)
  let name = channel?.metadata?.title || '';
  let avatar = '';
  try {
    const thumbs =
      channel?.header?.author?.thumbnails ||
      channel?.header?.thumbnails ||
      channel?.metadata?.thumbnail ||
      [];
    const list = Array.isArray(thumbs) ? thumbs : thumbs?.thumbnails || [];
    avatar = list[list.length - 1]?.url || list[0]?.url || '';
    if (!name) name = channel?.header?.author?.title?.toString() || '';
  } catch {
    // avatar stays empty — UI falls back to the إ monogram
  }

  return { name, avatar, videos, nextToken: extractToken(playlist) };
}

/** Next chunk(s) of uploads from an InnerTube continuation token. */
export async function getInnertubeMore(
  token: string,
  pages = 2
): Promise<{ videos: InnertubeVideo[]; nextToken: string | null }> {
  const videos: InnertubeVideo[] = [];
  let current: string | null = token;

  for (let i = 0; i < pages && current; i++) {
    try {
      const page = await fetchContinuationPage(current);
      videos.push(...page.videos);
      current = page.nextToken;
    } catch {
      // Past the end (youtubei.js throws on empty continuations) — keep partial.
      current = null;
    }
  }

  return { videos, nextToken: current };
}

/**
 * Items of any (non-uploads) playlist: first page + chained continuations.
 * Used for the channel's YouTube playlists in Library.
 */
export async function getInnertubePlaylistItems(
  playlistId: string,
  pages = 2
): Promise<{ videos: InnertubeVideo[]; nextToken: string | null }> {
  const yt = await getSession();
  const playlist = await yt.getPlaylist(playlistId);

  const videos = extractItems(playlist);
  let current = extractToken(playlist);

  for (let i = 1; i < pages && current; i++) {
    try {
      const page = await fetchContinuationPage(current);
      videos.push(...page.videos);
      current = page.nextToken;
    } catch {
      // Past the end (youtubei.js throws on empty continuations) — keep partial.
      current = null;
    }
  }

  return { videos, nextToken: current };
}

/** InnerTube continuation tokens are long; Data API page tokens are short. */
export function isInnertubeToken(token: string): boolean {
  return token.length > 50;
}

/** Budget for one InnerTube operation inside a serverless invocation. */
export const INNERTUBE_TIMEOUT_MS = 8000;
