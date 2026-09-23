import type { APIRoute } from 'astro';
import { getChannelDetails, getChannelDetailsByHandle } from '@/lib/youtube';
import { CHANNELS } from '@/lib/channels';

/**
 * Featherweight channel header: name + avatar only (no video listing).
 * Used by the Sidebar switcher so it never downloads 100-video payloads
 * just to render two avatars. CDN-cached for a day — headers change rarely.
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
  const idOrHandle = known?.id || raw;

  let details = null;
  if (CHANNEL_ID.test(idOrHandle)) {
    details = await getChannelDetails(idOrHandle).catch(() => null);
  } else if (idOrHandle.startsWith('@')) {
    details = await getChannelDetailsByHandle(idOrHandle).catch(() => null);
  }

  if (!details) {
    // No key or lookup failed — the UI falls back to monogram + registry name.
    const fallback = known ? { name: known.name, avatar: '' } : null;
    if (fallback) return json({ success: true, channel: fallback, source: 'registry' });
    return json({ error: 'Channel not found' }, 404);
  }

  return json({
    success: true,
    channel: { name: details.title, avatar: details.thumbnail },
    source: 'data-api',
  });
};
