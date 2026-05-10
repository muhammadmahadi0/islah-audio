/**
 * CORS Proxy API Route
 * Bypasses cross-origin restrictions when fetching HLS manifests and segments
 * from PeerTube instances
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing "url" parameter' },
      { status: 400 }
    );
  }

  // Validate URL to prevent SSRF attacks
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: 'Invalid URL protocol' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: '*/*',
        'User-Agent': 'IslahAudio/1.0 (Next.js Media Player)',
        // Forward relevant headers for HLS
        'Accept-Encoding': 'gzip, deflate, br',
      },
      // Handle CORS for streaming
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get content type from origin
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Build CORS headers
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Range, Accept-Encoding');
    headers.set('Access-Control-Max-Age', '86400');
    headers.set('Content-Type', contentType);

    // Handle byte ranges for HLS segments
    const range = request.headers.get('range');
    if (range && contentType.includes('application/octet-stream')) {
      headers.set('Accept-Ranges', 'bytes');
    }

    // Return the response body
    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range, Accept-Encoding',
      'Access-Control-Max-Age': '86400',
    },
  });
}