/**
 * Audio Stream Proxy
 * Fetches stream data and returns the best audio URL
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://piped.adminforge.de',
  'https://api.piped.victr.me',
  'https://pipedapi.moomoo.me',
];

interface PipedStream {
  url: string;
  format: string;
  quality: string;
  codec: string;
  bitrate?: string;
  language?: string;
}

interface PipedStreamsResponse {
  title: string;
  videoId: string;
  thumbnail: string;
  audioStreams: PipedStream[];
  videoStreams: PipedStream[];
  subtitles: unknown[];
  live: boolean;
  duration: number;
}

/**
 * Try multiple Piped instances to fetch streams
 */
async function fetchStreams(videoId: string): Promise<PipedStreamsResponse | null> {
  for (const baseUrl of PIPED_INSTANCES) {
    try {
      const url = `${baseUrl}/streams/${videoId}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'IslahAudio/1.0 (Next.js)',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`[Stream Proxy] Success from ${baseUrl} for video ${videoId}`);
        return await response.json();
      }
    } catch (error) {
      console.warn(`[Stream Proxy] Failed ${baseUrl}:`, error instanceof Error ? error.message : 'Unknown');
      continue;
    }
  }
  return null;
}

/**
 * Select the best audio stream
 */
function selectBestAudio(streams: PipedStream[]): string | null {
  if (!streams || streams.length === 0) return null;

  const scored = streams.map((stream) => {
    let score = 0;

    // Prefer m4a for browser compatibility
    if (stream.format?.toLowerCase().includes('m4a')) score += 100;
    else if (stream.format?.toLowerCase().includes('mp4')) score += 80;

    // Prefer opus codec
    if (stream.codec?.toLowerCase().includes('opus')) score += 50;

    // Add bitrate to score
    const bitrate = parseInt(stream.bitrate?.replace(/\D/g, '') || '0');
    score += Math.min(bitrate / 10, 100);

    return { stream, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.stream?.url || null;
}

/**
 * GET /api/stream/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;

  if (!videoId) {
    return NextResponse.json(
      { error: 'Missing video ID' },
      { status: 400 }
    );
  }

  // Validate YouTube video ID format (11 characters)
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json(
      { error: 'Invalid video ID format' },
      { status: 400 }
    );
  }

  try {
    const streams = await fetchStreams(videoId);

    if (!streams) {
      return NextResponse.json(
        { error: 'Could not fetch audio stream. All instances failed.' },
        { status: 502 }
      );
    }

    const audioUrl = selectBestAudio(streams.audioStreams);

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'No audio streams available for this video' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        videoId: streams.videoId,
        title: streams.title,
        thumbnail: streams.thumbnail,
        duration: streams.duration,
        audioUrl,
        isLive: streams.live,
      },
    });
  } catch (error) {
    console.error('[Stream Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
}