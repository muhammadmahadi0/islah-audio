import type { APIRoute } from 'astro';
import { getChannelPlaylists, hasApiKey } from '@/lib/youtube';
import { CHANNELS } from '@/lib/channels';

const CHANNEL_ID = /^UC[a-zA-Z0-9_-]{22}$/;

export const GET: APIRoute = async ({ params }) => {
  const channelId = decodeURIComponent(params.channel as string);

  if (!CHANNEL_ID.test(channelId) || !CHANNELS.some((c) => c.id === channelId)) {
    return new Response(JSON.stringify({ error: 'Unknown channel' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!hasApiKey()) {
    return new Response(
      JSON.stringify({ error: 'Missing API Key. Add YOUTUBE_API_KEY to environment variables.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const playlists = await getChannelPlaylists(channelId);
    return new Response(JSON.stringify({ success: true, playlists }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[Playlists API] Error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
