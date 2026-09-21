/**
 * Live status API — proxies islahbd.com's public live-status endpoint
 * so the client never hits CORS issues.
 *
 * GET /api/live → { success, live: LiveStatus }
 */

import { NextResponse } from 'next/server';
import type { LiveStatus } from '@/lib/live';

export const dynamic = 'force-dynamic';

const STATUS_URL = 'https://api.islahbd.com/api/live/status/';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(STATUS_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: 'Live status unavailable' }, { status: 502 });
    }

    const data = await res.json();
    const rec = data?.recording;

    const live: LiveStatus = {
      isLive: !!data?.isLive,
      title: data?.title || '',
      speaker: data?.speaker || '',
      listeners: data?.listeners ?? data?.real_listeners ?? 0,
      streamUrl: data?.streamUrl || data?.hlsUrl || '',
      recording:
        rec?.audioUrl != null
          ? {
              title: rec.title || '',
              speaker: rec.speaker || '',
              audioUrl: rec.audioUrl,
              durationSeconds: rec.durationSeconds || 0,
            }
          : null,
    };

    const response = NextResponse.json({ success: true, live });
    // Live state changes fast — cache briefly at the CDN only
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    return response;
  } catch (error) {
    console.error('[Live API] Error:', error);
    return NextResponse.json({ error: 'Live status unavailable' }, { status: 502 });
  }
}
