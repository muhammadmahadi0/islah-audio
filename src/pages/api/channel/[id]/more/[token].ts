import type { APIRoute } from 'astro';
import { getChannelDetails, getPlaylistVideosPaged, hasApiKey, MORE_PAGES } from '@/lib/youtube';
import { getInnertubeMore, isInnertubeToken, INNERTUBE_TIMEOUT_MS, type InnertubeVideo } from '@/lib/innertube';
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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

export const GET: APIRoute = async ({ params }) => {
  const id = decodeURIComponent(params.id as string);
  const decodedToken = decodeURIComponent(params.token as string);

  // 1. InnerTube continuation (keyless) with a hard budget.
  if (isInnertubeToken(decodedToken)) {
    try {
      const { videos, nextToken } = await withTimeout(
        getInnertubeMore(decodedToken, 2),
        INNERTUBE_TIMEOUT_MS,
        'innertube-more'
      );
      console.log(`[Channel More API] InnerTube success: ${videos.length} videos`);
      return json({
        success: true,
        videos: videos.map(toApiVideo),
        nextPageToken: nextToken,
        source: 'innertube',
      });
    } catch (error) {
      console.error('[Channel More API] InnerTube failed:', error);
      return json({ error: 'Could not load more videos right now.' }, 502);
    }
  }

  // 2. Data API page token (needs key + quota)
  if (!hasApiKey()) {
    return json(
      { error: 'Missing API Key. Add YOUTUBE_API_KEY to environment variables.' },
      400
    );
  }

  try {
    const details = await getChannelDetails(id);
    if (!details) {
      return json({ error: 'Channel not found' }, 404);
    }
    const { videos, nextPageToken } = await getPlaylistVideosPaged(
      details.uploadsPlaylistId,
      decodedToken,
      MORE_PAGES
    );
    return json({ success: true, videos, nextPageToken, source: 'data-api' });
  } catch (error) {
    console.error('[Channel More API] Error:', error);
    return json({ error: 'Server error' }, 500);
  }
};
