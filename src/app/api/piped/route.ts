/**
 * Robust Piped API Proxy with fallback instances
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Fallback instances - use the most reliable ones
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.victr.me',
];

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
 * Fetch from a single Piped instance with timeout
 */
async function fetchFromInstance<T>(baseUrl: string, path: string): Promise<T | null> {
  const url = `${baseUrl}${path}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'IslahAudio/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Try all instances until one works
 */
async function fetchWithFallback<T>(path: string): Promise<{ data: T; baseUrl: string } | null> {
  for (const baseUrl of PIPED_INSTANCES) {
    const data = await fetchFromInstance<T>(baseUrl, path);
    if (data) {
      return { data, baseUrl };
    }
  }
  return null;
}

/**
 * GET /api/piped?path=/search&q=islahbd&filter=channels
 * GET /api/piped?path=/channel/{channelId}
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json(
      { error: 'Missing "path" parameter' },
      { status: 400 }
    );
  }

  // Sanitize path - remove any leading issues
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  try {
    const result = await fetchWithFallback<PipedChannel | SearchResult>(cleanPath);

    if (!result) {
      // Return a more helpful error
      return NextResponse.json(
        {
          error: 'Piped service unavailable. Try again later.',
          tried: PIPED_INSTANCES,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Piped Proxy] Error:', error);
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
    },
  });
}