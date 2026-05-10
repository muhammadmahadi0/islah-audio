/**
 * Channel Videos API - Uses ytdl-core directly
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChannelVideos } from '@/lib/youtube';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get('handle') || '@islahbd';
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    const videos = await getChannelVideos(handle.replace('@', ''), limit);

    if (videos.length === 0) {
      return NextResponse.json(
        { error: 'No videos found for channel' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error('[Channel API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channel videos' },
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