/**
 * HLS proxy with CORS fallback.
 *
 * Some live origins don't send CORS headers, which blocks hls.js in the
 * browser. This route fetches manifests server-side, rewrites every nested
 * URI to point back here, and streams media segments with `*` CORS headers.
 *
 * GET /api/hls?url=<manifest-or-media-url>
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isManifest(url: string, contentType: string | null): boolean {
  if (contentType?.includes('mpegurl') || contentType?.includes('m3u8')) return true;
  return /\.m3u8(\?|$)/i.test(url);
}

function proxied(base: string, uri: string): string {
  // Leave absolute proxy URLs, data URIs and key URIs handled by the client
  const absolute = new URL(uri, base).toString();
  return `/api/hls?url=${encodeURIComponent(absolute)}`;
}

function rewriteManifest(text: string, base: string): string {
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      // Pass through comments — except URI attributes inside tags
      if (trimmed === '' || trimmed.startsWith('#EXTM3U')) return line;
      if (trimmed.startsWith('#')) {
        // Rewrite URI="..." attributes (e.g. EXT-X-KEY, EXT-X-MAP, EXT-X-MEDIA)
        return line.replace(/URI="([^"]+)"/g, (_m, uri) => `URI="${proxied(base, uri)}"`);
      }
      // Plain URI line (segment or nested playlist)
      if (/^[a-zA-Z0-9]/.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('http')) {
        return proxied(base, trimmed);
      }
      return line;
    })
    .join('\n');
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get('url');

  if (!target) {
    return NextResponse.json({ error: 'Missing "url" parameter' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        Accept: '*/*',
        'User-Agent': 'IslahAudio/1.0 (HLS proxy)',
      },
      cache: 'no-store',
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Upstream error: ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get('content-type');

    // Manifest → rewrite URIs so all sub-requests stay proxied (+CORS open)
    if (isManifest(parsed.toString(), contentType)) {
      const text = await upstream.text();
      const rewritten = rewriteManifest(text, parsed.toString());
      return new NextResponse(rewritten, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      });
    }

    // Media segment → stream bytes through with open CORS
    const headers = new Headers();
    headers.set(
      'Content-Type',
      contentType || 'application/octet-stream'
    );
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=60');
    return new NextResponse(upstream.body, { headers });
  } catch (error) {
    console.error('[HLS proxy] Error:', error);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 502 });
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
