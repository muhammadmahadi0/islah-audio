/**
 * YouTube Data API v3 Helper
 * Requires YOUTUBE_API_KEY - returns 400 if missing
 */

export interface YouTubeVideo {
  id: string;
  /** Alias of `id` — kept for frontend compatibility. */
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  /** Duration in seconds (0 when unavailable). */
  duration: number;
  views: number;
}

export interface YouTubeChannel {
  name: string;
  avatar: string;
  videos: YouTubeVideo[];
}

const API_KEY = process.env.YOUTUBE_API_KEY;

function getYouTubeAPI<T>(endpoint: string, params: Record<string, string>): Promise<T | null> {
  if (!API_KEY) return Promise.resolve(null);

  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  url.searchParams.set('key', API_KEY);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return fetch(url.toString(), { headers: { Accept: 'application/json' } })
    .then((res) => {
      if (!res.ok) return null;
      return res.json() as Promise<T>;
    })
    .catch(() => null);
}

export async function getChannelDetails(channelId: string) {
  const data = await getYouTubeAPI<any>('channels', {
    part: 'contentDetails,snippet',
    id: channelId,
  });

  if (!data?.items?.length) return null;

  const channel = data.items[0];
  return {
    uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
    title: channel.snippet.title,
    thumbnail: channel.snippet.thumbnails?.medium?.url || '',
  };
}

export async function getPlaylistVideos(playlistId: string, maxResults = 50) {
  const data = await getYouTubeAPI<any>('playlistItems', {
    part: 'snippet',
    playlistId,
    maxResults: maxResults.toString(),
  });

  if (!data?.items) return [];

  const items = data.items.filter((item: any) => item.snippet?.resourceId?.videoId);

  const videoIds = items.map((item: any) => item.snippet.resourceId.videoId as string);
  const details = await getVideoDetails(videoIds);

  return items.map((item: any) => {
    const videoId: string = item.snippet.resourceId.videoId;
    const meta = details.get(videoId);
    return {
      id: videoId,
      videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      publishedAt: item.snippet.publishedAt,
      duration: meta?.duration ?? 0,
      views: meta?.views ?? 0,
    };
  });
}

/** Parse an ISO8601 duration (e.g. PT1H2M3S) into seconds. */
export function parseDuration(iso: string): number {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Batch-fetch durations + view counts for up to 50 videos per request.
 */
async function getVideoDetails(
  videoIds: string[]
): Promise<Map<string, { duration: number; views: number }>> {
  const result = new Map<string, { duration: number; views: number }>();
  if (videoIds.length === 0) return result;

  // YouTube allows max 50 ids per videos.list call
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await getYouTubeAPI<any>('videos', {
      part: 'contentDetails,statistics',
      id: batch.join(','),
    });

    for (const item of data?.items || []) {
      result.set(item.id, {
        duration: parseDuration(item.contentDetails?.duration || ''),
        views: parseInt(item.statistics?.viewCount || '0', 10) || 0,
      });
    }
  }

  return result;
}

export async function getChannelVideos(channelId: string): Promise<YouTubeChannel | null> {
  console.log('[YouTube] Getting channel details for:', channelId);

  // Try as channel ID first
  let channelDetails = await getChannelDetails(channelId);

  // If not found, try as handle (e.g., @islahbd)
  if (!channelDetails && channelId.startsWith('@')) {
    console.log('[YouTube] Trying as handle:', channelId);
    channelDetails = await getChannelDetailsByHandle(channelId);
  }

  if (!channelDetails) {
    console.log('[YouTube] Channel not found');
    return null;
  }

  const videos = await getPlaylistVideos(channelDetails.uploadsPlaylistId, 50);
  console.log('[YouTube] Got', videos.length, 'videos');

  return {
    name: channelDetails.title,
    avatar: channelDetails.thumbnail,
    videos,
  };
}

async function getChannelDetailsByHandle(handle: string) {
  const data = await getYouTubeAPI<any>('channels', {
    part: 'contentDetails,snippet',
    forHandle: handle.replace('@', ''),
  });

  if (!data?.items?.length) return null;

  const channel = data.items[0];
  return {
    uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
    title: channel.snippet.title,
    thumbnail: channel.snippet.thumbnails?.medium?.url || '',
  };
}

export function hasApiKey(): boolean {
  return !!API_KEY;
}

export const TARGET_CHANNEL_ID = 'UC8NjCrYUV5YrpK2j6XTwGSA';