/**
 * Stream API — metadata endpoint.
 *
 * Playback is handled client-side by the hidden YouTube embed player
 * (see `src/components/AudioPlayer.tsx`), so no audio-URL extraction
 * service is needed here. This route returns the video metadata plus
 * official watch/embed URLs and stays compatible with the previous
 * `{ success, data: { url, title, thumbnail, duration } }` shape.
 *
 * NOTE: The old Cobalt integration (`api.cobalt.tools`) was removed —
 * that public API was shut down in November 2024.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  let title = '';
  let thumbnail = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
  let duration = 0;

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
      // Keyless fallback: public oEmbed endpoint (title only)
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

  const response = NextResponse.json({
    success: true,
    data: {
      // Official playback URLs — the client plays these in the embed player.
      url: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      videoId,
      title,
      thumbnail,
      duration,
    },
  });

  response.headers.set('Cache-Control', 'public, max-age=86400');
  return response;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
