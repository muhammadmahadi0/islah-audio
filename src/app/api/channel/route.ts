/**
 * Channel API - YouTube Data API v3 with Invidious fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChannelVideosYT, TARGET_CHANNEL_ID } from '@/lib/youtube';
import { getChannelVideos, DEFAULT_CHANNEL_ID } from '@/lib/invidious';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get('id') || TARGET_CHANNEL_ID;

  console.log(`[Channel API] Requested: ${channelId}`);

  // Try YouTube Data API v3 first (requires YOUTUBE_API_KEY in .env.local)
  try {
    const channel = await getChannelVideosYT(channelId);

    if (channel && channel.videos.length > 0) {
      console.log(`[Channel API] YouTube API success: ${channel.videos.length} videos`);

      return NextResponse.json({
        success: true,
        source: 'youtube',
        channel: { name: channel.name, avatar: channel.avatar },
        videos: channel.videos.map((v) => ({
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail,
          publishedAt: v.publishedAt,
        })),
      });
    }
  } catch (error) {
    console.error('[Channel API] YouTube API failed:', error);
  }

  // Fallback to Invidious
  console.log('[Channel API] Falling back to Invidious');

  try {
    const channel = await getChannelVideos(channelId);

    if (!channel) {
      return NextResponse.json(
        { error: 'All sources failed. Please try again later.' },
        { status: 502 }
      );
    }

    console.log(`[Channel API] Invidious success: ${channel.videos.length} videos`);

    return NextResponse.json({
      success: true,
      source: 'invidious',
      channel: { name: channel.title, avatar: channel.avatar },
      videos: channel.videos,
    });
  } catch (error) {
    console.error('[Channel API] Invidious failed:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}