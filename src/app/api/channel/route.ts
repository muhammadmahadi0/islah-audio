/**
 * Channel API - YouTube Data API v3 only
 * Returns 400 if API key is missing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChannelVideos, hasApiKey, TARGET_CHANNEL_ID } from '@/lib/youtube';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get('id') || TARGET_CHANNEL_ID;

  // Require API key - return 400 if missing
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: 'Missing API Key. Add YOUTUBE_API_KEY to environment variables.' },
      { status: 400 }
    );
  }

  console.log(`[Channel API] Fetching: ${channelId}`);

  try {
    const channel = await getChannelVideos(channelId);

    console.log('[Channel API] Response:', JSON.stringify(channel, null, 2));

    if (!channel || channel.videos.length === 0) {
      return NextResponse.json(
        {
          error: 'No videos found for this channel.',
          hint: 'Check if channel exists and has public uploads. Verify API key has YouTube Data API v3 enabled.'
        },
        { status: 404 }
      );
    }

    console.log(`[Channel API] Success: ${channel.videos.length} videos`);

    return NextResponse.json({
      success: true,
      channel: { name: channel.name, avatar: channel.avatar },
      videos: channel.videos,
    });
  } catch (error) {
    console.error('[Channel API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}