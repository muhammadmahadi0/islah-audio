/**
 * Audio Stream Proxy API Route
 * Proxies audio streams from Piped API to bypass CORS restrictions
 * and provide a consistent playback endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

const PIPED_API = process.env.NEXT_PUBLIC_PIPED_API || 'https://pipedapi.kavin.rocks';

/**
 * GET /api/audio?videoId={id}
 * Fetches audio streams for a given video ID and returns the best available audio URL
 */
export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json(
      { error: 'Missing "videoId" parameter' },
      { status: 400 }
    );
  }

  try {
    // Validate videoId format (YouTube video IDs are 11 characters)
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json(
        { error: 'Invalid videoId format' },
        { status: 400 }
      );
    }

    // Fetch streams from Piped API
    const streamsResponse = await fetch(`${PIPED_API}/streams/${videoId}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'IslahAudio/1.0 (Next.js Audio Player)',
      },
    });

    if (!streamsResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch streams: ${streamsResponse.status} ${streamsResponse.statusText}` },
        { status: streamsResponse.status }
      );
    }

    const streams: PipedStreamsResponse = await streamsResponse.json();

    // Find the best audio stream
    const audioUrl = selectBestAudioStream(streams.audioStreams);

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'No audio streams available for this video' },
        { status: 404 }
      );
    }

    // Return the audio URL (client will handle the actual streaming)
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
    console.error('Audio proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audio stream' },
      { status: 500 }
    );
  }
}

/**
 * Selects the best available audio stream based on quality and format compatibility
 */
function selectBestAudioStream(audioStreams: PipedStream[]): string | null {
  if (!audioStreams || audioStreams.length === 0) {
    return null;
  }

  // Score each stream based on quality and browser compatibility
  const scoredStreams = audioStreams.map((stream) => {
    let score = 0;

    // Prefer m4a for better browser compatibility
    if (stream.format?.toLowerCase().includes('m4a')) {
      score += 100;
    }
    // Prefer mp4
    else if (stream.format?.toLowerCase().includes('mp4')) {
      score += 80;
    }

    // Prefer opus codec (usually better quality at lower bitrate)
    if (stream.codec?.toLowerCase().includes('opus')) {
      score += 50;
    }

    // Parse bitrate and add to score
    const bitrate = parseInt(stream.bitrate?.replace(/\D/g, '') || '0');
    score += Math.min(bitrate / 10, 100); // Cap bitrate contribution

    // Parse quality (e.g., "128kbps" -> 128)
    const quality = parseInt(stream.quality?.replace(/\D/g, '') || '0');
    score += Math.min(quality / 10, 100);

    return { stream, score };
  });

  // Sort by score descending and return the best
  scoredStreams.sort((a, b) => b.score - a.score);

  return scoredStreams[0]?.stream?.url || null;
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}