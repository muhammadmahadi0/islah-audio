import type { APIRoute } from 'astro';
import type { LiveStatus } from '@/lib/live';

const STATUS_URL = 'https://api.islahbd.com/api/live/status/';

export const GET: APIRoute = async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(STATUS_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Live status unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const rec = data?.recording;

    const live: LiveStatus = {
      isLive: !!data?.isLive,
      title: data?.title || '',
      speaker: data?.speaker || '',
      location: data?.location || '',
      listeners: data?.listeners ?? data?.real_listeners ?? 0,
      streamUrl: data?.streamUrl || data?.hlsUrl || '',
      recording:
        rec?.audioUrl != null
          ? {
              title: rec.title || '',
              speaker: rec.speaker || '',
              location: rec.location || '',
              audioUrl: rec.audioUrl,
              durationSeconds: rec.durationSeconds || 0,
            }
          : null,
    };

    return new Response(JSON.stringify({ success: true, live }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('[Live API] Error:', error);
    return new Response(JSON.stringify({ error: 'Live status unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
