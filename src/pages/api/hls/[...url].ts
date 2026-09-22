import type { APIRoute } from 'astro';

/**
 * HLS proxy with CORS fallback. The target URL travels in the path
 * (query strings are unreliable on our hosting).
 *
 * GET /api/hls/<encodeURIComponent(manifest-or-media-url)>
 */

function isManifest(url: string, contentType: string | null): boolean {
  if (contentType?.includes('mpegurl') || contentType?.includes('m3u8')) return true;
  return /\.m3u8(\?|$)/i.test(url);
}

function proxied(base: string, uri: string): string {
  const absolute = new URL(uri, base).toString();
  return `/api/hls/${encodeURIComponent(absolute)}`;
}

function rewriteManifest(text: string, base: string): string {
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#EXTM3U')) return line;
      if (trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri) => `URI="${proxied(base, uri)}"`);
      }
      if (/^[a-zA-Z0-9]/.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('http')) {
        return proxied(base, trimmed);
      }
      return line;
    })
    .join('\n');
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ params }) => {
  const raw = params.url as string | undefined;
  if (!raw) return jsonError('Missing URL parameter', 400);

  let target: string;
  try {
    target = decodeURIComponent(raw);
    const parsed = new URL(target);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return jsonError('Invalid URL protocol', 400);
    }
  } catch {
    return jsonError('Invalid URL', 400);
  }

  try {
    const upstream = await fetch(target, {
      headers: { Accept: '*/*', 'User-Agent': 'IslahAudio/1.0 (HLS proxy)' },
    });

    if (!upstream.ok || !upstream.body) {
      return jsonError(`Upstream error: ${upstream.status}`, 502);
    }

    const contentType = upstream.headers.get('content-type');

    if (isManifest(target, contentType)) {
      const text = await upstream.text();
      return new Response(rewriteManifest(text, target), {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      });
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType || 'application/octet-stream');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=60');
    return new Response(upstream.body, { headers });
  } catch (error) {
    console.error('[HLS proxy] Error:', error);
    return jsonError('Proxy failed', 502);
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
};
