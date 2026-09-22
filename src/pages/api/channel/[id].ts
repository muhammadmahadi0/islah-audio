import type { APIRoute } from 'astro';
import { getChannelVideos, hasApiKey, getChannelVideoCount } from '@/lib/youtube';
import { getInnertubeChannelVideos, INNERTUBE_TIMEOUT_MS, type InnertubeVideo } from '@/lib/innertube';
import { withTimeout } from '@/lib/fetch-timeout';

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

function json(data: unknown, status = 200, cache = 'public, s-maxage=3600, stale-while-revalidate=86400') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
  });
}

export const GET: APIRoute = async ({ params }) => {
  const channelId = decodeURIComponent(params.id as string);
  console.log(`[Channel API] Fetching: ${channelId}`);

  // 1. InnerTube (keyless, quota-free) with a hard budget —
  // a stalled upstream must fall back fast, not hang the function.
  try {
    const inner = await withTimeout(
      getInnertubeChannelVideos(channelId),
      INNERTUBE_TIMEOUT_MS,
      'innertube-channel'
    );
    if (inner.videos.length > 0) {
      console.log(`[Channel API] InnerTube success: ${inner.videos.length} videos`);
      let total: number | null = null;
      if (hasApiKey()) {
        try {
          total = await getChannelVideoCount(channelId);
        } catch {
          // ignore — total stays unknown
        }
      }
      return json({
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
    return json(
      { error: 'Missing API Key. Add YOUTUBE_API_KEY to environment variables.' },
      400
    );
  }

  try {
    const channel = await getChannelVideos(channelId);
    if (!channel || channel.videos.length === 0) {
      return json(
        {
          error: 'No videos found for this channel.',
          hint: 'Check if channel exists and has public uploads. Verify API key has YouTube Data API v3 enabled.',
        },
        404
      );
    }
    console.log(`[Channel API] Data API success: ${channel.videos.length} videos`);
    return json({
      success: true,
      channel: { name: channel.name, avatar: channel.avatar },
      videos: channel.videos,
      nextPageToken: channel.nextPageToken,
      total: channel.total,
      source: 'data-api',
    });
  } catch (error) {
    console.error('[Channel API] Error:', error);
    return json({ error: 'Server error' }, 500);
  }
};
