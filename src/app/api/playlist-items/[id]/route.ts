/**
 * Playlist items API (path-param variant) — BETA: InnerTube first.
 *
 * Playlist ID travels in the path — query strings are dropped by hosting.
 *
 * GET /api/playlist-items/[id] → { success, videos, source }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPlaylistVideosPaged,
  hasApiKey,
  MORE_PAGES,
} from '@/lib/youtube';
import {
  getInnertubePlaylistItems,
  INNERTUBE_TIMEOUT_MS,
  type InnertubeVideo,
} from '@/lib/innertube';
import { withTimeout } from '@/lib/fetch-timeout';

export const dynamic = 'force-dynamic';

const YT_PLAYLIST_ID = /^[a-zA-Z0-9_-]{13,64}$/;

function toApiVideo(v: InnertubeVideo) {
  return {
    id: v.videoId,
    videoId: v.videoId,
    title: v.title,
    thumbnail: v.thumbnail,
    publishedAt: v.publishedAt,
    duration: v.duration,
    views: v.views,
  };
}

function cached(data: unknown) {
  const response = NextResponse.json(data);
  response.headers.set(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400'
  );
  return response;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const playlistId = decodeURIComponent(id);

  if (!YT_PLAYLIST_ID.test(playlistId)) {
    return NextResponse.json({ error: 'Invalid playlist ID' }, { status: 400 });
  }

  // 1. InnerTube (keyless, first ~200 items) with a hard budget —
  // a stalled upstream must fall back fast, not hang the function.
  try {
    const { videos } = await withTimeout(
      getInnertubePlaylistItems(playlistId, 2),
      INNERTUBE_TIMEOUT_MS,
      'innertube-items'
    );

    if (videos.length > 0) {
      console.log(`[Playlist Items API] InnerTube success: ${videos.length} videos`);
      return cached({
        success: true,
        videos: videos.map(toApiVideo),
        source: 'innertube',
      });
    }

    console.log('[Playlist Items API] InnerTube empty, trying Data API');
  } catch (error) {
    console.error('[Playlist Items API] InnerTube failed, trying Data API:', error);
  }

  // 2. Data API fallback (needs key + quota)
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: 'Missing API Key. Add YOUTUBE_API_KEY to environment variables.' },
      { status: 400 }
    );
  }

  try {
    const { videos } = await getPlaylistVideosPaged(playlistId, undefined, 1);

    return cached({ success: true, videos, source: 'data-api' });
  } catch (error) {
    console.error('[Playlist Items API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
