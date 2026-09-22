/**
 * Channel Playlists API — BETA.
 *
 * The channel ID is fixed (TARGET_CHANNEL_ID), so no parameters are needed
 * at all — query strings are unreliable on our hosting anyway.
 *
 * GET /api/playlists → { success, playlists }
 */

import { NextResponse } from 'next/server';
import {
  getChannelPlaylists,
  hasApiKey,
  TARGET_CHANNEL_ID,
} from '@/lib/youtube';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: 'Missing API Key. Add YOUTUBE_API_KEY to environment variables.' },
      { status: 400 }
    );
  }

  try {
    const playlists = await getChannelPlaylists(TARGET_CHANNEL_ID);

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
