/**
 * Playlist items API (path-param variant).
 *
 * NOTE: Query strings are unreliable on our hosting (Netlify drops them
 * before function invocation), so the playlist ID travels in the path.
 *
 * GET /api/playlist-items/[id] → { success, videos }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPlaylistItems, hasApiKey } from '@/lib/youtube';

export const dynamic = 'force-dynamic';

const YT_PLAYLIST_ID = /^[a-zA-Z0-9_-]{13,64}$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playlistId } = await params;

  if (!hasApiKey()) {
    return NextResponse.json(
      { error: 'Missing API Key. Add YOUTUBE_API_KEY to environment variables.' },
      { status: 400 }
    );
  }

  if (!playlistId || !YT_PLAYLIST_ID.test(decodeURIComponent(playlistId))) {
    return NextResponse.json({ error: 'Invalid playlist ID' }, { status: 400 });
  }

  try {
    const videos = await getPlaylistItems(decodeURIComponent(playlistId));
    const response = NextResponse.json({ success: true, videos });
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
    return response;
  } catch (error) {
    console.error('[Playlist Items API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
