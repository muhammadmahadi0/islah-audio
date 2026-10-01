import type { APIRoute } from 'astro';
import { getBoyanAudios, getBoyanCategories } from '@/lib/boyan';

/**
 * Boyan catalog from the IslahBD API (`api.islahbd.com/api/audios/` +
 * `/api/categories/`). Fully keyless, no auth. The whole list is small
 * (~70KB). CDN-cached for 5 min (editors publish often — clients also
 * poll silently, so fresh bayans surface without a reload).
 */

export const GET: APIRoute = async () => {
  const json = (data: unknown, status = 200, cache = 'public, s-maxage=300, stale-while-revalidate=600') =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
    });

  try {
    const [audios, categories] = await Promise.all([
      getBoyanAudios(),
      getBoyanCategories().catch(() => []),
    ]);
    return json({ success: true, audios, categories, source: 'islahbd' });
  } catch (error) {
    console.error('[Boyan API] Error:', error);
    return json({ error: 'Could not load boyan catalog right now.' }, 502, 'public, s-maxage=60');
  }
};
