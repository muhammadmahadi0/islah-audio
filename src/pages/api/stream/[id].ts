import type { APIRoute } from 'astro';
import { getVideoMetadata, isVideoId } from '@/lib/video';

/**
 * Stream metadata endpoint. Playback is client-side (embed / HLS),
 * so this only returns metadata + official URLs.
 */

export const GET: APIRoute = async ({ params }) => {
  const videoId = params.id as string;

  if (!isVideoId(videoId)) {
    return new Response(JSON.stringify({ error: 'Invalid video ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const meta = await getVideoMetadata(videoId);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        url: meta.url,
        embedUrl: meta.embedUrl,
        videoId: meta.videoId,
        title: meta.title,
        thumbnail: meta.thumbnail,
        duration: meta.duration,
        channelName: meta.channelName,
        description: meta.description,
        publishedAt: meta.publishedAt,
        views: meta.views,
      },
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    }
  );
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
};
