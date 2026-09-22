import type { APIRoute } from 'astro';
import { getPlaylistVideosPaged, hasApiKey, MORE_PAGES } from '@/lib/youtube';
import { getInnertubePlaylistItems, INNERTUBE_TIMEOUT_MS, type InnertubeVideo } from '@/lib/innertube';
import { withTimeout } from '@/lib/fetch-timeout';

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
  const playlistId = decodeURIComponent(params.id as string);

  if (!YT_PLAYLIST_ID.test(playlistId)) {
    return json({ error: 'Invalid playlist ID' }, 400);
  }

  // 1. InnerTube (keyless, first ~200 items) with a hard budget.
  try {
    const { videos } = await withTimeout(
      getInnertubePlaylistItems(playlistId, 2),
      INNERTUBE_TIMEOUT_MS,
      'innertube-items'
    );
    if (videos.length > 0) {
      console.log(`[Playlist Items API] InnerTube success: ${videos.length} videos`);
      return json({ success: true, videos: videos.map(toApiVideo), source: 'innertube' });
    }
    console.log('[Playlist Items API] InnerTube empty, trying Data API');
  } catch (error) {
    console.error('[Playlist Items API] InnerTube failed, trying Data API:', error);
  }

  // 2. Data API fallback (needs key + quota)
  if (!hasApiKey()) {
    return json(
      { error: 'Missing API Key. Add YOUTUBE_API_KEY to environment variables.' },
      400
    );
  }

  try {
    const { videos } = await getPlaylistVideosPaged(playlistId, undefined, 1);
    return json({ success: true, videos, source: 'data-api' });
  } catch (error) {
    console.error('[Playlist Items API] Error:', error);
    return json({ error: 'Server error' }, 500);
  }
};
