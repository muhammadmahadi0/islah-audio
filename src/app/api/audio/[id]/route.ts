/**
 * Audio Stream API using Consumet
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVideoInfo } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json(
      { error: 'Invalid video ID' },
      { status: 400 }
    );
  }

  console.log(`[Audio API] Fetching stream for: ${videoId}`);

  try {
    const stream = await getVideoInfo(videoId);

    if (!stream || !stream.audioUrl) {
      console.error(`[Audio API] No stream found for: ${videoId}`);
      return NextResponse.json(
        { error: 'No audio stream available for this video' },
        { status: 502 }
      );
    }

    console.log(`[Audio API] Success: ${videoId} - ${stream.title}`);

    return NextResponse.json({
      success: true,
      data: {
        url: stream.audioUrl,
        title: stream.title,
        thumbnail: stream.thumbnail,
        duration: stream.duration,
      },
    });
  } catch (error) {
    console.error(`[Audio API] Error fetching ${videoId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch audio stream' },
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