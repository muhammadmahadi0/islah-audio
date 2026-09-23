import type { APIRoute } from 'astro';
import { getInnertubeChannelMeta, INNERTUBE_TIMEOUT_MS } from '@/lib/innertube';
import { withTimeout } from '@/lib/fetch-timeout';
import { CHANNELS } from '@/lib/channels';

/**
 * Featherweight channel header: name + avatar only (no video listing).
 * Used by the Sidebar switcher so it never downloads 100-video payloads
 * just to render two avatars. Fully keyless; CDN-cached for a day —
 * headers change rarely.
 */

const CHANNEL_ID = /^UC[a-zA-Z0-9_-]{22}$/;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}

export const GET: APIRoute = async ({ params }) => {
  const raw = decodeURIComponent(params.id as string);
  const known = CHANNELS.find((c) => c.id === raw || c.handle === raw);

  if (known) {
    try {
      const meta = await withTimeout(
        getInnertubeChannelMeta(known.id),
        INNERTUBE_TIMEOUT_MS,
        'innertube-meta'
      );
      if (meta.name || meta.avatar) {
        return json({ success: true, channel: meta, source: 'innertube' });
      }
    } catch (error) {
      console.error('[Channel Meta] InnerTube failed:', error);
    }
    // Lookup failed — the UI falls back to monogram + registry name.
    return json({ success: true, channel: { name: known.name, avatar: '' }, source: 'registry' });
  }

  if (CHANNEL_ID.test(raw)) {
    try {
      const meta = await withTimeout(
        getInnertubeChannelMeta(raw),
        INNERTUBE_TIMEOUT_MS,
        'innertube-meta'
      );
      if (meta.name || meta.avatar) {
        return json({ success: true, channel: meta, source: 'innertube' });
      }
    } catch (error) {
      console.error('[Channel Meta] InnerTube failed:', error);
    }
  }

  return json({ error: 'Channel not found' }, 404);
};
