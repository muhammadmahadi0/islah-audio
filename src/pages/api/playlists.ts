import type { APIRoute } from 'astro';
import { getChannelPlaylists, hasApiKey, TARGET_CHANNEL_ID } from '@/lib/youtube';

export const GET: APIRoute = async () => {
  if (!hasApiKey()) {
    return new Response(
      JSON.stringify({ error: 'Missing API Key. Add YOUTUBE_API_KEY to environment variables.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const playlists = await getChannelPlaylists(TARGET_CHANNEL_ID);
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
