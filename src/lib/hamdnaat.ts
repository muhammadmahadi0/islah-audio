/**
 * Hamd-Naat catalog from the IslahBD API (`api.islahbd.com/api/nasheeds/`).
 *
 * Two shapes from one list: `audio` items carry a direct MP3 (stream engine,
 * downloadable, like Boyan) and `video` items carry a `youtubeId` (YouTube
 * embed, shareable via /watch — like lectures). Fully keyless — no auth, no
 * quota. The upstream has no pagination or search, so we fetch the whole
 * list once (~17KB, ~50 items) and filter client-side. Single source of
 * truth for the /api/hamdnaat route and the Track mapping used by
 * HamdNaatView.
 */

import type { Track } from '@/store/player-store';

export type HamdNaatType = 'audio' | 'video';

export interface HamdNaatItem {
  id: number;
  title: string;
  type: HamdNaatType;
  audioUrl: string;
  youtubeId: string;
  artist: string;
  lyricist: string;
  composer: string;
  writingPlace: string;
  writingDate: string;
  createdAt: string;
}

const NASHEEDS_URL = 'https://api.islahbd.com/api/nasheeds/';
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

function sanitizeItem(item: any): HamdNaatItem | null {
  if (!item) return null;
  const type: HamdNaatType = item.type === 'video' ? 'video' : 'audio';
  const audioUrl = typeof item.audioUrl === 'string' ? item.audioUrl : '';
  const youtubeId = typeof item.youtubeId === 'string' ? item.youtubeId : '';
  // Keep items playable by at least one engine; drop dead rows.
  if (type === 'audio' && !audioUrl) return null;
  if (type === 'video' && !youtubeId) return null;
  return {
    id: Number(item.id) || 0,
    title: String(item.title || 'Untitled hamd-naat'),
    type,
    audioUrl,
    youtubeId,
    artist: String(item.artist || ''),
    lyricist: String(item.lyricist || ''),
    composer: String(item.composer || ''),
    writingPlace: String(item.writingPlace || ''),
    writingDate: String(item.writingDate || ''),
    createdAt: String(item.createdAt || ''),
  };
}

/** Whole catalog, newest first (upstream returns ascending ids). */
export async function getHamdNaatItems(): Promise<HamdNaatItem[]> {
  const data = await fetchJson<any[]>(NASHEEDS_URL);
  if (!Array.isArray(data)) return [];
  return data
    .map(sanitizeItem)
    .filter((a): a is HamdNaatItem => a !== null)
    .sort((a, b) => b.id - a.id);
}

/** ISO date → "3 weeks ago"; passes through unparseable values. */
export function formatHamdNaatDate(iso: string): string {
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

/** Hamd-Naat → player Track. Audio items ride the stream engine (direct
 * MP3, artwork fallback, download button picks them up automatically);
 * video items ride the YouTube embed (shareable, Up-next duration fills
 * in) — same shapes as recording / lecture tracks. */
export function toHamdNaatTrack(item: HamdNaatItem): Track {
  if (item.type === 'video') {
    return {
      id: `hamdnaat-${item.id}`,
      title: item.title,
      thumbnail: `https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`,
      duration: 0,
      channelName: item.artist || 'Islah',
      videoId: item.youtubeId,
      location: item.writingPlace || '',
      publishedAt: item.createdAt || '',
      description: [item.lyricist, item.composer].filter(Boolean).join(' • '),
    };
  }
  return {
    id: `hamdnaat-${item.id}`,
    title: item.title,
    thumbnail: '',
    duration: 0,
    channelName: item.artist || 'Islah',
    videoId: '',
    audioUrl: item.audioUrl,
    location: item.writingPlace || '',
    publishedAt: item.createdAt || '',
    description: [item.lyricist, item.composer].filter(Boolean).join(' • '),
  };
}
