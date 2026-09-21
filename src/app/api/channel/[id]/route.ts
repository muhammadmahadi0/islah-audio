/**
 * Channel API (path-param variant) — BETA: InnerTube first.
 *
 * NOTE: Query strings are unreliable on our hosting (Netlify drops them
 * before function invocation), so the channel ID travels in the path.
 * The old query-based `/api/channel?id=` route is kept for compatibility.
 *
 * BETA: tries keyless InnerTube listing first (no quota), falls back to
 * the YouTube Data API when InnerTube fails or returns nothing.
 *
 * GET /api/channel/[id] → { success, channel, videos, nextPageToken, total, source }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChannelVideos, hasApiKey, getChannelVideoCount } from '@/lib/youtube';
import {
  getInnertubeChannelVideos,
  type InnertubeVideo,
} from '@/lib/innertube';

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
  // Cache at the CDN for an hour to save quota / upstream load.
  response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return response;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const channelId = decodeURIComponent(rawId);

  console.log(`[Channel API] Fetching: ${channelId}`);

  // 1. InnerTube (keyless, quota-free)
  try {
    const inner = await getInnertubeChannelVideos(channelId);

    if (inner.videos.length > 0) {
      console.log(`[Channel API] InnerTube success: ${inner.videos.length} videos`);

      // Total count via Data API statistics (1 unit) when a key exists;
      // otherwise the client shows "Showing N" without a total.
      let total: number | null = null;
      if (hasApiKey()) {
        try {
          total = await getChannelVideoCount(channelId);
        } catch {
          // ignore — total stays unknown
        }
      }

      return cached({
        success: true,
        channel: { name: inner.name, avatar: inner.avatar },
        videos: inner.videos.map(toApiVideo),
        nextPageToken: inner.nextToken,
        total,
        source: 'innertube',
      });
    }

    console.log('[Channel API] InnerTube returned no videos, trying Data API');
  } catch (error) {
    console.error('[Channel API] InnerTube failed, trying Data API:', error);
  }

  // 2. Data API fallback (needs key + quota)
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: 'Missing API Key. Add YOUTUBE_API_KEY to environment variables.' },
      { status: 400 }
    );
  }

  try {
    const channel = await getChannelVideos(channelId);

    if (!channel || channel.videos.length === 0) {
      return NextResponse.json(
        {
          error: 'No videos found for this channel.',
          hint: 'Check if channel exists and has public uploads. Verify API key has YouTube Data API v3 enabled.',
        },
        { status: 404 }
      );
    }

    console.log(`[Channel API] Data API success: ${channel.videos.length} videos`);

    return cached({
      success: true,
      channel: { name: channel.name, avatar: channel.avatar },
      videos: channel.videos,
      nextPageToken: channel.nextPageToken,
      total: channel.total,
      source: 'data-api',
    });
  } catch (error) {
    console.error('[Channel API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
