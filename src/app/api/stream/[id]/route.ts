/**
 * Audio Stream Proxy - Simplified with faster fallback
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.victr.me',
];

interface PipedStream {
  url: string;
  format: string;
  quality: string;
  codec: string;
  bitrate?: string;
}

interface PipedStreamsResponse {
  title: string;
  videoId: string;
  thumbnail: string;
  audioStreams: PipedStream[];
  duration: number;
}

async function fetchStreams(videoId: string): Promise<PipedStreamsResponse | null> {
  for (const baseUrl of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${baseUrl}/streams/${videoId}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }
    } catch {
      continue;
    }
  }
  return null;
}

function selectBestAudio(streams: PipedStream[]): string | null {
  if (!streams?.length) return null;

  const scored = streams.map((s) => {
    let score = 0;
    if (s.format?.toLowerCase().includes('m4a')) score += 100;
    else if (s.format?.toLowerCase().includes('mp4')) score += 80;
    if (s.codec?.toLowerCase().includes('opus')) score += 50;
    const bitrate = parseInt(s.bitrate?.replace(/\D/g, '') || '0');
    score += Math.min(bitrate / 10, 100);
    return { url: s.url, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.url || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
  }

  try {
    const streams = await fetchStreams(videoId);

    if (!streams) {
      return NextResponse.json(
        { error: 'Stream unavailable. Try again later.' },
        { status: 502 }
      );
    }

    const audioUrl = selectBestAudio(streams.audioStreams);

    if (!audioUrl) {
      return NextResponse.json({ error: 'No audio available' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        videoId: streams.videoId,
        title: streams.title,
        thumbnail: streams.thumbnail,
        duration: streams.duration,
        audioUrl,
      },
    });
  } catch (error) {
    console.error('[Stream] Error:', error);
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