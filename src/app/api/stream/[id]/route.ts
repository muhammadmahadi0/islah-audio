/**
 * Audio Stream Proxy - Multiple Piped instances
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PIPED_INSTANCES = [
  'https://api.piped.victr.me',
  'https://pipedapi.kavin.rocks',
  'https://yewtu.be',
  'https://watchapi.whatever.social',
];

interface PipedStream {
  url: string;
  format: string;
  codec: string;
  bitrate?: string;
}

interface StreamData {
  audioStreams: PipedStream[];
}

async function fetchStreams(videoId: string): Promise<StreamData | null> {
  for (const baseUrl of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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

  const scored = streams.map(s => ({
    url: s.url,
    score: (s.format?.includes('m4a') ? 100 : s.format?.includes('mp4') ? 80 : 0) +
           (s.codec?.includes('opus') ? 50 : 0) +
           Math.min(parseInt(s.bitrate?.replace(/\D/g, '') || '0') / 10, 100)
  }));

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
    const audioUrl = streams?.audioStreams ? selectBestAudio(streams.audioStreams) : null;

    if (!audioUrl) {
      return NextResponse.json({ error: 'No audio available' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { audioUrl }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
}