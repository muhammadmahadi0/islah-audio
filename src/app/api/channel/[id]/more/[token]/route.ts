/**
 * Channel "load more" API (path-param variant).
 *
 * The uploads playlist is chronological, so older videos load chunk by chunk.
 * IDs and page tokens travel in the path — query strings are dropped by hosting.
 *
 * GET /api/channel/[id]/more/[token] → { success, videos, nextPageToken }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getChannelDetails,
  getPlaylistVideosPaged,
  hasApiKey,
  MORE_PAGES,
} from '@/lib/youtube';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; token: string }> }
) {
  const { id, token } = await params;

  if (!hasApiKey()) {
    return NextResponse.json(
      { error: 'Missing API Key. Add YOUTUBE_API_KEY to environment variables.' },
      { status: 400 }
    );
  }

  try {
    const details = await getChannelDetails(decodeURIComponent(id));
    if (!details) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const { videos, nextPageToken } = await getPlaylistVideosPaged(
      details.uploadsPlaylistId,
      decodeURIComponent(token),
      MORE_PAGES
    );

    const response = NextResponse.json({ success: true, videos, nextPageToken });
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
    return response;
  } catch (error) {
    console.error('[Channel More API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
