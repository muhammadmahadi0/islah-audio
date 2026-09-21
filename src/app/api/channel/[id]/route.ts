/**
 * Channel API (path-param variant).
 *
 * NOTE: Query strings are unreliable on our hosting (Netlify drops them
 * before function invocation), so the channel ID travels in the path.
 * The old query-based `/api/channel?id=` route is kept for compatibility.
 *
 * GET /api/channel/[id] → { success, channel, videos }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChannelVideos, hasApiKey } from '@/lib/youtube';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: channelId } = await params;

  if (!hasApiKey()) {
    return NextResponse.json(
      { error: 'Missing API Key. Add YOUTUBE_API_KEY to environment variables.' },
      { status: 400 }
    );
  }

  console.log(`[Channel API] Fetching: ${channelId}`);

  try {
    const channel = await getChannelVideos(decodeURIComponent(channelId));

    if (!channel || channel.videos.length === 0) {
      return NextResponse.json(
        {
          error: 'No videos found for this channel.',
          hint: 'Check if channel exists and has public uploads. Verify API key has YouTube Data API v3 enabled.',
        },
        { status: 404 }
      );
    }

    console.log(`[Channel API] Success: ${channel.videos.length} videos`);

    const response = NextResponse.json({
      success: true,
      channel: { name: channel.name, avatar: channel.avatar },
      videos: channel.videos,
      nextPageToken: channel.nextPageToken,
      total: channel.total,
    });

    // Cache at the CDN for an hour to save YouTube API quota.
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return response;
  } catch (error) {
    console.error('[Channel API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
