/**
 * Boyan catalog from the IslahBD API (`api.islahbd.com/api/audios/`).
 *
 * Direct MP3 lectures (bayan/waz) with title, speaker, category, location
 * and upload date. Fully keyless — no auth, no quota. The upstream has no
 * pagination or search, so we fetch the whole list once (~70KB, ~110 items)
 * and filter client-side. Single source of truth for the /api/boyan route
 * and the Track mapping used by BoyanView.
 */

import type { Track } from '@/store/player-store';

export interface BoyanAudio {
  id: number;
  title: string;
  speaker: string;
  category: string;
  audioUrl: string;
  /** Raw duration string from upstream ("30:23", "00:00" or ""). */
  duration: string;
  uploadDate: string;
  location: string;
}

export interface BoyanCategory {
  id: number;
  name: string;
  order: number;
}

const AUDIOS_URL = 'https://api.islahbd.com/api/audios/';
const CATEGORIES_URL = 'https://api.islahbd.com/api/categories/';
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

function sanitizeAudio(item: any): BoyanAudio | null {
  if (!item || typeof item.audioUrl !== 'string' || !item.audioUrl) return null;
  return {
    id: Number(item.id) || 0,
    title: String(item.title || 'Untitled boyan'),
    speaker: String(item.speaker || ''),
    category: String(item.category || ''),
    audioUrl: item.audioUrl,
    duration: String(item.duration || ''),
    uploadDate: String(item.uploadDate || ''),
    location: String(item.location || ''),
  };
}

/** Whole catalog, newest first (upstream returns ascending ids). */
export async function getBoyanAudios(): Promise<BoyanAudio[]> {
  const data = await fetchJson<any[]>(AUDIOS_URL);
  if (!Array.isArray(data)) return [];
  return data
    .map(sanitizeAudio)
    .filter((a): a is BoyanAudio => a !== null)
    .sort((a, b) => b.id - a.id);
}

export async function getBoyanCategories(): Promise<BoyanCategory[]> {
  const data = await fetchJson<any[]>(CATEGORIES_URL);
  if (!Array.isArray(data)) return [];
  return data
    .filter((c) => c && typeof c.name === 'string' && c.name)
    .map((c) => ({
      id: Number(c.id) || 0,
      name: String(c.name),
      order: Number(c.order) || 0,
    }))
    .sort((a, b) => a.order - b.order || a.id - b.id);
}

/** "30:23" / "1:02:03" → seconds. "" / "00:00" → 0 (element fills in). */
export function parseBoyanDuration(raw: string): number {
  if (!raw) return 0;
  const parts = raw.trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

/** ISO date → "3 weeks ago"; passes through unparseable values. */
export function formatBoyanDate(iso: string): string {
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

/** Boyan → player Track. No videoId/thumbnail — stream engine owns these
 * (same shape as live/recording tracks): artwork fallback, audio element
 * fills in duration, download button picks up the MP3 automatically. */
export function toBoyanTrack(audio: BoyanAudio): Track {
  return {
    id: `boyan-${audio.id}`,
    title: audio.title,
    thumbnail: '',
    duration: parseBoyanDuration(audio.duration),
    channelName: audio.speaker || 'Islah',
    videoId: '',
    audioUrl: audio.audioUrl,
    location: audio.location || '',
    publishedAt: audio.uploadDate || '',
    description: audio.category || '',
  };
}
