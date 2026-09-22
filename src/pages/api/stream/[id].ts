import type { APIRoute } from 'astro';

/**
 * Stream metadata endpoint. Playback is client-side (embed / HLS),
 * so this only returns metadata + official URLs.
 */

export const GET: APIRoute = async ({ params }) => {
  const videoId = params.id as string;

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return new Response(JSON.stringify({ error: 'Invalid video ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.YOUTUBE_API_KEY || (import.meta as any).env?.YOUTUBE_API_KEY;
  let title = '';
  let thumbnail = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

  try {
    if (apiKey) {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.searchParams.set('key', apiKey);
      url.searchParams.set('part', 'snippet,contentDetails');
      url.searchParams.set('id', videoId);
      const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        const item = data?.items?.[0];
        if (item) {
          title = item.snippet?.title || '';
          thumbnail =
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            thumbnail;
        }
      }
    } else {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { headers: { Accept: 'application/json' } }
      );
      if (res.ok) {
        const data = await res.json();
        title = data?.title || '';
        thumbnail = data?.thumbnail_url || thumbnail;
      }
    }
  } catch (error) {
    console.error('[Stream API] metadata fetch failed:', error);
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        videoId,
        title,
        thumbnail,
        duration: 0,
      },
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    }
  );
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
};
