/**
 * Robust Piped API Proxy
 * Tries multiple Piped instances until one works
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// List of Piped instances to try (in order of preference)
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

interface PipedChannel {
  name: string;
  banner: string;
  avatar: string;
  description: string;
  subscriberCount: number;
  verified: boolean;
  relatedStreams: Array<{
    title: string;
    videoId: string;
    thumbnail: string;
    duration: number;
    uploaderName: string;
    uploaderAvatar: string;
    uploaderId: string;
    views: number;
  }>;
}

interface SearchResult {
  items: Array<{
    url: string;
    name: string;
    avatar: string;
  }>;
}

/**
 * Try fetching from a list of instances until one succeeds
 */
async function fetchWithFallback<T>(path: string): Promise<{ data: T; baseUrl: string } | null> {
  const errors: string[] = [];

  for (const baseUrl of PIPED_INSTANCES) {
    try {
      const url = `${baseUrl}${path}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'IslahAudio/1.0 (Next.js)',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`[Piped Proxy] Success from ${baseUrl}${path}`);
        return { data, baseUrl };
      } else {
        errors.push(`${baseUrl}: ${response.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${baseUrl}: ${message}`);
    }
  }

  console.error(`[Piped Proxy] All instances failed for ${path}:`, errors);
  return null;
}

/**
 * GET /api/piped?path=/search?q=islahbd&filter=channels
 * GET /api/piped?path=/channel/{channelId}
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path');

  if (!path) {
    return NextResponse.json(
      { error: 'Missing "path" parameter. Use ?path=/endpoint' },
      { status: 400 }
    );
  }

  // Validate path to prevent SSRF
  if (!path.startsWith('/')) {
    return NextResponse.json(
      { error: 'Path must start with /' },
      { status: 400 }
    );
  }

  // Block dangerous paths
  const dangerousPaths = ['/login', '/register', '/admin', '/settings'];
  if (dangerousPaths.some((p) => path.startsWith(p))) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  try {
    const result = await fetchWithFallback<PipedChannel | SearchResult>(path);

    if (!result) {
      return NextResponse.json(
        { error: 'All Piped instances failed. Please try again later.' },
        { status: 502 }
      );
    }

    return NextResponse.json(result.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Data-Source': result.baseUrl,
      },
    });
  } catch (error) {
    console.error('[Piped Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
}