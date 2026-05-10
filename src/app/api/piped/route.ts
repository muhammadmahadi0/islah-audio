/**
 * Piped API Proxy with multiple fallback instances
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// More comprehensive list of Piped instances
const PIPED_INSTANCES = [
  'https://api.piped.victr.me',
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.moomoo.me',
  'https://watchapi.whatever.social',
];

interface PipedChannel {
  name: string;
  avatar: string;
  description: string;
  subscriberCount: number;
  relatedStreams: Array<{
    title: string;
    videoId: string;
    thumbnail: string;
    duration: number;
    uploaderName: string;
    views: number;
  }>;
}

interface SearchItem {
  url: string;
  name: string;
  avatar: string;
}

/**
 * Fetch with aggressive timeout and retries
 */
async function fetchWithRetry<T>(path: string): Promise<T | null> {
  for (const baseUrl of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${baseUrl}${path}`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'IslahAudio/1.0 (Netlify)',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`[Piped] Success: ${baseUrl}${path}`);
        return await response.json();
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'timeout';
      console.log(`[Piped] Failed: ${baseUrl} - ${msg}`);
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '/';

  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  try {
    const result = await fetchWithRetry<PipedChannel | { items: SearchItem[] }>(cleanPath);

    if (!result) {
      return NextResponse.json(
        { error: 'All Piped instances failed. Please try again later.' },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Piped] Error:', error);
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