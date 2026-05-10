/**
 * Channel Videos API using Consumet
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChannel, DEFAULT_CHANNEL_ID } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get('handle') || DEFAULT_CHANNEL_ID;

  console.log(`[Channel API] Fetching: ${handle}`);

  try {
    const channel = await getChannel(handle);

    if (!channel) {
      console.error(`[Channel API] Failed to fetch: ${handle}`);
      return NextResponse.json(
        { error: 'Channel not found or unavailable' },
        { status: 502 }
      );
    }

    const videos = (channel.videos || []).map((v: any) => ({
      videoId: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      duration: v.duration || 0,
      views: v.views || 0,
    }));

    console.log(`[Channel API] Success: ${handle} - ${videos.length} videos`);

    return NextResponse.json({
      success: true,
      channel: {
        name: channel.name,
        avatar: channel.avatar,
        banner: channel.banner,
        subscriberCount: channel.subscriberCount,
      },
      videos,
    });
  } catch (error) {
    console.error(`[Channel API] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch channel. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}