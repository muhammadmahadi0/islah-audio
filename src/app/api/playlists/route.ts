/**
 * Channel Playlists API — the channel's real YouTube playlists.
 *
 * GET /api/playlists?id=<channelId|@handle>  → { success, playlists }
 * GET /api/playlists?playlistId=<id>         → { success, videos }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getChannelPlaylists,
  getPlaylistItems,
  hasApiKey,
  TARGET_CHANNEL_ID,
} from '@/lib/youtube';

export const dynamic = 'force-dynamic';

const YT_PLAYLIST_ID = /^[a-zA-Z0-9_-]{13,64}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playlistId = searchParams.get('playlistId');

  if (!hasApiKey()) {
    return NextResponse.json(
      { error: 'Missing API Key. Add YOUTUBE_API_KEY to environment variables.' },
      { status: 400 }
    );
  }

  try {
    // Items of one playlist (lazy-loaded when a card expands)
    if (playlistId) {
      if (!YT_PLAYLIST_ID.test(playlistId)) {
        return NextResponse.json({ error: 'Invalid playlist ID' }, { status: 400 });
      }

      const videos = await getPlaylistItems(playlistId);
      const response = NextResponse.json({ success: true, videos });
      response.headers.set(
        'Cache-Control',
        'public, s-maxage=3600, stale-while-revalidate=86400'
      );
      return response;
    }

    // List of the channel's playlists
    const channelId = searchParams.get('id') || TARGET_CHANNEL_ID;
    const playlists = await getChannelPlaylists(channelId);

    const response = NextResponse.json({ success: true, playlists });
    // Playlists change rarely — cache longer to save quota
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=21600, stale-while-revalidate=86400'
    );
    return response;
  } catch (error) {
    console.error('[Playlists API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
