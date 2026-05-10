/**
 * Channel API - Uses Invidious with fallback instances
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChannelVideos, DEFAULT_CHANNEL_ID } from '@/lib/invidious';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get('id') || DEFAULT_CHANNEL_ID;

  console.log(`[Channel API] Fetching: ${channelId}`);

  try {
    const channel = await getChannelVideos(channelId);

    if (!channel) {
      return NextResponse.json(
        { error: 'All Invidious instances failed. Please try again later.' },
        { status: 502 }
      );
    }

    console.log(`[Channel API] Success: ${channel.videos.length} videos`);

    return NextResponse.json({
      success: true,
      channel: { name: channel.title, avatar: channel.avatar },
      videos: channel.videos,
    });
  } catch (error) {
    console.error(`[Channel API] Error:`, error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}