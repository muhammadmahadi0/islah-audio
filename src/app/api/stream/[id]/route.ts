/**
 * Audio Stream API - Uses ytdl-core
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAudioStream } from '@/lib/youtube';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
  }

  try {
    const stream = await getAudioStream(videoId);

    if (!stream) {
      return NextResponse.json(
        { error: 'Could not get audio stream' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        title: stream.title,
        thumbnail: stream.thumbnail,
        duration: stream.duration,
        audioUrl: stream.audioUrl,
      },
    });
  } catch (error) {
    console.error('[Stream API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get audio stream' },
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