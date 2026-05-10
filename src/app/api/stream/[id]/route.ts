/**
 * Stream API - Uses Cobalt for audio extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAudioStream } from '@/lib/cobalt';

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
    const stream = await getAudioStream(videoId);

    if (!stream) {
      return NextResponse.json(
        { error: 'Could not extract audio' },
        { status: 502 }
      );
    }

    console.log(`[Stream API] Success: ${videoId}`);

    const response = NextResponse.json({
      success: true,
      data: {
        url: stream.url,
        title: stream.title,
        thumbnail: stream.thumbnail,
        duration: stream.duration,
      },
    });

    response.headers.set('Cache-Control', 'public, max-age=3600');
    return response;
  } catch (error) {
    console.error('[Stream API] Error:', error);
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