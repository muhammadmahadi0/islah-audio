/**
 * Stream API using Invidious
 * Returns highest quality audio-only stream
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVideoStream } from '@/lib/invidious';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
  }

  console.log(`[Stream API] Fetching: ${videoId}`);

  try {
    const stream = await getVideoStream(videoId);

    if (!stream) {
      console.error(`[Stream API] No audio: ${videoId}`);
      return NextResponse.json(
        { error: 'No audio stream available' },
        { status: 502 }
      );
    }

    console.log(`[Stream API] Success: ${videoId}`);

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
    console.error(`[Stream API] Error:`, error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
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