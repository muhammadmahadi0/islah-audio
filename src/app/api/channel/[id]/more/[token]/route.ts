/**
 * Channel "load more" API (path-param variant) — BETA: InnerTube first.
 *
 * The uploads playlist is chronological, so older videos load chunk by chunk.
 * IDs and page tokens travel in the path — query strings are dropped by hosting.
 * Long tokens are InnerTube continuations, short ones are Data API page tokens.
 *
 * GET /api/channel/[id]/more/[token] → { success, videos, nextPageToken, source }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getChannelDetails,
  getPlaylistVideosPaged,
  hasApiKey,
  MORE_PAGES,
} from '@/lib/youtube';
import {
  getInnertubeMore,
  isInnertubeToken,
  INNERTUBE_TIMEOUT_MS,
  type InnertubeVideo,
} from '@/lib/innertube';
import { withTimeout } from '@/lib/fetch-timeout';

export const dynamic = 'force-dynamic';

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
  { params }: { params: Promise<{ id: string; token: string }> }
) {
  const { id, token } = await params;
  const decodedToken = decodeURIComponent(token);

  // 1. InnerTube continuation (keyless) with a hard budget.
  if (isInnertubeToken(decodedToken)) {
    try {
      const { videos, nextToken } = await withTimeout(
        getInnertubeMore(decodedToken, 2),
        INNERTUBE_TIMEOUT_MS,
        'innertube-more'
      );

      console.log(`[Channel More API] InnerTube success: ${videos.length} videos`);

      return cached({
        success: true,
        videos: videos.map(toApiVideo),
        nextPageToken: nextToken,
        source: 'innertube',
      });
    } catch (error) {
      console.error('[Channel More API] InnerTube failed:', error);
      return NextResponse.json(
        { error: 'Could not load more videos right now.' },
        { status: 502 }
      );
    }
  }

  // 2. Data API page token (needs key + quota)
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: 'Missing API Key. Add YOUTUBE_API_KEY to environment variables.' },
      { status: 400 }
    );
  }

  try {
    const details = await getChannelDetails(decodeURIComponent(id));
    if (!details) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const { videos, nextPageToken } = await getPlaylistVideosPaged(
      details.uploadsPlaylistId,
      decodedToken,
      MORE_PAGES
    );

    return cached({ success: true, videos, nextPageToken, source: 'data-api' });
  } catch (error) {
    console.error('[Channel More API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
