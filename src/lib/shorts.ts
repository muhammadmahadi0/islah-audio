/**
 * Short clips catalog from the IslahBD API (`api.islahbd.com/api/clips/`).
 *
 * Short-form clips (~194 items): `audio` items carry a direct MP3 (stream
 * engine, downloadable, like Boyan) and `video` items carry a `youtubeId`
 * (YouTube embed, shareable via /watch — like lectures). Fully keyless —
 * no auth, no quota. The upstream has no pagination or search, so we fetch
 * the whole list once and filter client-side. Single source of truth for
 * the /api/shorts route and the Track mapping used by ShortsView.
 */

import type { Track } from '@/store/player-store';

export type ShortClipType = 'audio' | 'video';

export interface ShortClip {
  id: number;
  title: string;
  type: ShortClipType;
  audioUrl: string;
  youtubeId: string;
  createdAt: string;
}

const CLIPS_URL = 'https://api.islahbd.com/api/clips/';
const FETCH_TIMEOUT_MS = 10000;

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function sanitizeClip(item: any): ShortClip | null {
  if (!item) return null;
  const audioUrl = typeof item.audioUrl === 'string' ? item.audioUrl : '';
  const youtubeId = typeof item.youtubeId === 'string' ? item.youtubeId : '';
  // Video clips ride the YouTube embed; everything else rides the stream
  // engine. Drop rows playable by neither engine.
  if (youtubeId) {
    return {
      id: Number(item.id) || 0,
      title: String(item.title || 'Untitled short'),
      type: 'video',
      audioUrl: '',
      youtubeId,
      createdAt: String(item.createdAt || ''),
    };
  }
  if (!audioUrl) return null;
  return {
    id: Number(item.id) || 0,
    title: String(item.title || 'Untitled short'),
    type: 'audio',
    audioUrl,
    youtubeId: '',
    createdAt: String(item.createdAt || ''),
  };
}

/** Whole catalog, newest first (upstream returns ascending ids). */
export async function getShortClips(): Promise<ShortClip[]> {
  const data = await fetchJson<any[]>(CLIPS_URL);
  if (!Array.isArray(data)) return [];
  return data
    .map(sanitizeClip)
    .filter((c): c is ShortClip => c !== null)
    .sort((a, b) => b.id - a.id);
}

/** ISO date → "3 weeks ago"; passes through unparseable values. */
export function formatShortDate(iso: string): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return iso;
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

/** Short clip → player Track. Audio items ride the stream engine (direct
 * MP3, artwork fallback, download button picks them up automatically);
 * video items ride the YouTube embed (shareable, Up-next duration fills
 * in) — same shapes as hamd-naat tracks. */
export function toShortTrack(clip: ShortClip): Track {
  if (clip.type === 'video') {
    return {
      id: `short-${clip.id}`,
      title: clip.title,
      thumbnail: `https://i.ytimg.com/vi/${clip.youtubeId}/hqdefault.jpg`,
      duration: 0,
      channelName: 'Islah',
      videoId: clip.youtubeId,
      publishedAt: clip.createdAt || '',
    };
  }
  return {
    id: `short-${clip.id}`,
    title: clip.title,
    thumbnail: '',
    duration: 0,
    channelName: 'Islah',
    videoId: '',
    audioUrl: clip.audioUrl,
    publishedAt: clip.createdAt || '',
  };
}
