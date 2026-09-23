import type { APIRoute } from 'astro';
import { getInnertubeChannelPlaylists, INNERTUBE_TIMEOUT_MS } from '@/lib/innertube';
import { withTimeout } from '@/lib/fetch-timeout';
import { CHANNELS } from '@/lib/channels';

const CHANNEL_ID = /^UC[a-zA-Z0-9_-]{22}$/;

/**
 * A channel's public playlists — fully keyless via the InnerTube
 * Playlists tab. CDN-cached for 6h (playlists change rarely).
 */

export const GET: APIRoute = async ({ params }) => {
  const channelId = decodeURIComponent(params.channel as string);

  if (!CHANNEL_ID.test(channelId) || !CHANNELS.some((c) => c.id === channelId)) {
    return new Response(JSON.stringify({ error: 'Unknown channel' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const playlists = await withTimeout(
      getInnertubeChannelPlaylists(channelId),
      INNERTUBE_TIMEOUT_MS,
      'innertube-playlists'
    );
    return new Response(JSON.stringify({ success: true, playlists, source: 'innertube' }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[Playlists API] Error:', error);
    return new Response(JSON.stringify({ error: 'Could not load channel playlists right now.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
