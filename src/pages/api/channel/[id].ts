import type { APIRoute } from 'astro';
import { getInnertubeChannelVideos, toClientToken, INNERTUBE_TIMEOUT_MS, type InnertubeVideo } from '@/lib/innertube';
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

/** Fully keyless channel listing (InnerTube uploads playlist). No total —
// InnerTube exposes no exact video count; the UI falls back to the
// loaded-video count. */
export const GET: APIRoute = async ({ params }) => {
  const channelId = decodeURIComponent(params.id as string);
  console.log(`[Channel API] Fetching: ${channelId}`);

  try {
    const inner = await withTimeout(
      getInnertubeChannelVideos(channelId),
      INNERTUBE_TIMEOUT_MS,
      'innertube-channel'
    );
    if (inner.videos.length > 0) {
      console.log(`[Channel API] InnerTube success: ${inner.videos.length} videos`);
      return json({
        success: true,
        channel: { name: inner.name, avatar: inner.avatar },
        videos: inner.videos.map(toApiVideo),
        // Wrapped: raw InnerTube tokens carry `%` and 404 Astro-on-Netlify
        // once the client percent-encodes them into the path.
        nextPageToken: toClientToken(inner.nextToken),
        total: null,
        source: 'innertube',
      });
    }
    return json({ error: 'No videos found for this channel.' }, 404);
  } catch (error) {
    console.error('[Channel API] InnerTube failed:', error);
    return json({ error: 'Could not load channel videos right now.' }, 502);
  }
};
