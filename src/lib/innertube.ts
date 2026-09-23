/**
 * Fully keyless InnerTube listing (no API key, no quota) — the only listing
 * path since the Data API fallback was removed (full-keyless migration).
 *
 * Uses youtubei.js against YouTube's private InnerTube API (the same one
 * youtube.com uses), like the Flow Android app does. Keyless, unlimited —
 * but unofficial, so it can break when YouTube changes things.
 *
 * Only LISTING goes through InnerTube (uploads, playlists, continuations).
 * Playback still uses the official embed and needs no extraction.
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

export interface InnertubePlaylist {
  id: string;
  title: string;
  thumbnail: string;
  itemCount: number;
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
 * Throws when InnerTube is unreachable — routes return an error.
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

/**
 * A channel's public playlists via its Playlists tab (params are stable —
 * channel-scoped, not per-video, so this needs no key at all).
 * Returns [] when the tab is unreachable — routes surface "none yet".
 */
export async function getInnertubeChannelPlaylists(
  channelId: string
): Promise<InnertubePlaylist[]> {
  const yt = await getSession();

  // Discover the channel's Playlists tab (params differ per channel).
  const channel = await yt.getChannel(channelId);
  const tabs = channel.memo.getType(YTNodes.Tab);
  const playlistsTab = tabs.find(
    (t: any) => (t.title?.toString?.() || t.title || '') === 'Playlists'
  );
  const params: string | undefined = playlistsTab?.endpoint?.payload?.params;
  if (!params) return [];

  const raw = await yt.actions.execute('/browse', { browseId: channelId, params });
  const { Parser } = await import('youtubei.js');
  const memo = Parser.parseResponse(raw.data).contents_memo;
  const lockups = memo
    .getType(YTNodes.LockupView)
    .filter((p: any) => p.content_type === 'PLAYLIST');

  return lockups
    .map((p: any): InnertubePlaylist | null => {
      try {
        const id: string = p.content_id;
        if (!id) return null;
        const title: string = p.metadata?.title?.text || 'Untitled playlist';
        const thumbnail: string = p.content_image?.primary_thumbnail?.image?.[0]?.url || '';
        // "54 videos" badge on the thumbnail overlay.
        const badges: any[] =
          p.content_image?.primary_thumbnail?.overlays?.flatMap?.(
            (o: any) => o.badges || []
          ) || [];
        const countText: string = badges.map((b: any) => b.text || '').join(' ');
        const count = parseInt(countText.replace(/[^0-9]/g, ''), 10);
        return {
          id,
          title,
          thumbnail,
          itemCount: Number.isFinite(count) ? count : 0,
        };
      } catch {
        return null;
      }
    })
    .filter((p: InnertubePlaylist | null): p is InnertubePlaylist => p !== null);
}

/**
 * Channel name + avatar only (no video listing) for the Sidebar switcher.
 * Best-effort — empty strings when the lookup fails, UI falls back to the
 * channel registry + monogram.
 */
export async function getInnertubeChannelMeta(
  channelId: string
): Promise<{ name: string; avatar: string }> {
  const yt = await getSession();
  const channel = await yt.getChannel(channelId).catch(() => null);
  if (!channel) return { name: '', avatar: '' };

  let name: string = channel?.metadata?.title || '';
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
  return { name, avatar };
}

/** Single-video metadata for `/watch/[id]` + `/api/stream/[id]` — keyless.
 * Tries `getBasicInfo` first (full metadata), falls back to oEmbed
 * (title/author/thumbnail — enough for the watch page + OG tags).
 * oEmbed matters because Netlify IPs intermittently get blank player
 * responses for BasicInfo while browse endpoints keep working
 * (proven in prod: valid videos returned empty title). */
export async function getInnertubeVideoMetadata(videoId: string): Promise<{
  found: boolean;
  title: string;
  thumbnail: string;
  duration: number;
  channelName: string;
  description: string;
  publishedAt: string;
  views: number;
}> {
  const empty = {
    found: false,
    title: '',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: 0,
    channelName: '',
    description: '',
    publishedAt: '',
    views: 0,
  };
  // 1. Full metadata via BasicInfo.
  try {
    const yt = await getSession();
    // getBasicInfo throws on unknown/removed videos (caller 404s).
    // NOTE: never pass `{ client }` — youtubei.js errors on several client
    // names with "Invalid video ID" even for valid videos.
    const info = await yt.getBasicInfo(videoId);
    const basic: any = info.basic_info;
    if (basic?.id || basic?.title) {
      const thumbs: any[] = basic.thumbnail || [];
      const best = thumbs[thumbs.length - 1];
      const title: string = basic.title || '';
      // A response with neither id nor title is a blank/blocked payload,
      // not a real video — fall through to oEmbed instead of claiming found.
      if (basic?.id || title) {
        return {
          found: true,
          title,
          thumbnail: best?.url || empty.thumbnail,
          duration: Number(basic.duration) || 0,
          channelName: basic.channel?.name || basic.author || '',
          description: basic.short_description || '',
          publishedAt: basic.publish_date || info.primary_info?.published?.text || '',
          views: Number(basic.view_count) || 0,
        };
      }
    }
  } catch {
    // Unknown/removed video or blocked player response — try oEmbed next.
  }
  // 2. oEmbed fallback: lightweight, rarely blocked, no key.
  // Returns 404 for genuinely unknown IDs, so `found` stays a real signal.
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
        { headers: { Accept: 'application/json' }, signal: controller.signal }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.title) {
          return {
            ...empty,
            found: true,
            title: data.title || '',
            channelName: data.author_name || '',
            thumbnail: data.thumbnail_url || empty.thumbnail,
          };
        }
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    // oEmbed unreachable — caller 404s.
  }
  return empty;
}

/**
 * Client-safe token wrapping.
 *
 * Raw InnerTube tokens contain `%` sequences — once the client percent-encodes
 * them for the URL path (`%` → `%25`), Astro-on-Netlify matches NO route and
 * answers 404 (proven in prod: the "Show more" wall at 100 videos). So the
 * server hands the client `it1_`-prefixed base64url instead (path-safe
 * `[A-Za-z0-9_-]` only) and the more-route unwraps it. Short Data API page
 * tokens pass through untouched.
 */
const CLIENT_TOKEN_PREFIX = 'it1_';

export function toClientToken(token: string | null): string | null {
  if (!token) return null;
  if (!isInnertubeToken(token)) return token;
  return CLIENT_TOKEN_PREFIX + Buffer.from(token, 'utf8').toString('base64url');
}

export function fromClientToken(token: string): string {
  if (token.startsWith(CLIENT_TOKEN_PREFIX)) {
    try {
      const raw = Buffer.from(token.slice(CLIENT_TOKEN_PREFIX.length), 'base64url').toString('utf8');
      if (isInnertubeToken(raw)) return raw;
    } catch {
      // Corrupt wrapping — fall through and use the token as-is.
    }
  }
  return token;
}

/** Budget for one InnerTube operation inside a serverless invocation. */
export const INNERTUBE_TIMEOUT_MS = 8000;
