import type { APIRoute } from 'astro';
import { getInnertubeMore, isInnertubeToken, fromClientToken, toClientToken, INNERTUBE_TIMEOUT_MS, type InnertubeVideo } from '@/lib/innertube';
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

/** Next chunk(s) of uploads from an InnerTube continuation — fully keyless. */
export const GET: APIRoute = async ({ params }) => {
  // Unwrap the client-safe encoding (it1_… → raw InnerTube token).
  const decodedToken = fromClientToken(decodeURIComponent(params.token as string));

  if (!isInnertubeToken(decodedToken)) {
    return json({ error: 'This catalog link has expired — reload the page.' }, 400);
  }

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
      nextPageToken: toClientToken(nextToken),
      source: 'innertube',
    });
  } catch (error) {
    console.error('[Channel More API] InnerTube failed:', error);
    return json({ error: 'Could not load more videos right now.' }, 502);
  }
};
