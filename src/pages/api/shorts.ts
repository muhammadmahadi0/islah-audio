import type { APIRoute } from 'astro';
import { getShortClips } from '@/lib/shorts';

/**
 * Short clips catalog from the IslahBD API (`api.islahbd.com/api/clips/`).
 * Fully keyless, no auth. The whole list is small and changes rarely, so it
 * is CDN-cached for an hour — clients search/filter locally.
 */

export const GET: APIRoute = async () => {
  const json = (data: unknown, status = 200, cache = 'public, s-maxage=3600, stale-while-revalidate=86400') =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
    });

  try {
    const clips = await getShortClips();
    return json({ success: true, clips, source: 'islahbd' });
  } catch (error) {
    console.error('[Shorts API] Error:', error);
    return json({ error: 'Could not load shorts catalog right now.' }, 502, 'public, s-maxage=60');
  }
};
