import type { APIRoute } from 'astro';
import { getHamdNaatItems } from '@/lib/hamdnaat';

/**
 * Hamd-Naat catalog from the IslahBD API (`api.islahbd.com/api/nasheeds/`).
 * Fully keyless, no auth. The whole list is tiny (~17KB). CDN-cached for
 * 5 min (editors publish often — clients also poll silently, so fresh
 * tracks surface without a reload).
 */

export const GET: APIRoute = async () => {
  const json = (data: unknown, status = 200, cache = 'public, s-maxage=300, stale-while-revalidate=600') =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
    });

  try {
    const items = await getHamdNaatItems();
    return json({ success: true, items, source: 'islahbd' });
  } catch (error) {
    console.error('[HamdNaat API] Error:', error);
    return json({ error: 'Could not load hamd-naat catalog right now.' }, 502, 'public, s-maxage=60');
  }
};
