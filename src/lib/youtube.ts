/**
 * YouTube Data API v3 Helper
 * Uses official API with user's key, falls back to Invidious
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  duration?: string;
}

export interface YouTubeChannel {
  name: string;
  avatar: string;
  videos: YouTubeVideo[];
}

/**
 * Fetch from YouTube Data API v3
 */
async function fetchYouTubeAPI<T>(endpoint: string, params: Record<string, string>): Promise<T | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.log('[YouTube API] No API key configured');
    return null;
  }

  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  url.searchParams.set('key', apiKey);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[YouTube API] Error:', error.error?.message || response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[YouTube API] Fetch failed:', error);
    return null;
  }
}

/**
 * Get channel details including uploads playlist ID
 */
export async function getChannelDetails(channelId: string): Promise<{ uploadsPlaylistId: string; title: string; thumbnail: string } | null> {
  const data = await fetchYouTubeAPI<any>('channels', {
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

/**
 * Get latest videos from channel's uploads playlist
 */
export async function getPlaylistVideos(playlistId: string, maxResults = 50): Promise<YouTubeVideo[]> {
  const data = await fetchYouTubeAPI<any>('playlistItems', {
    part: 'snippet',
    playlistId,
    maxResults: maxResults.toString(),
  });

  if (!data?.items) return [];

  return data.items
    .filter((item: any) => item.snippet?.resourceId?.videoId)
    .map((item: any) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      publishedAt: item.snippet.publishedAt,
    }));
}

/**
 * Get channel videos - main entry point
 * Uses YouTube API first, falls back to Invidious
 */
export async function getChannelVideosYT(channelId: string): Promise<YouTubeChannel | null> {
  console.log(`[YouTube] Fetching channel: ${channelId}`);

  // Step 1: Get channel details (uploads playlist ID)
  const channelDetails = await getChannelDetails(channelId);

  if (!channelDetails) {
    console.log('[YouTube] Channel fetch failed, will use Invidious fallback');
    return null;
  }

  console.log(`[YouTube] Channel: ${channelDetails.title}, Playlist: ${channelDetails.uploadsPlaylistId}`);

  // Step 2: Get videos from uploads playlist
  const videos = await getPlaylistVideos(channelDetails.uploadsPlaylistId, 50);

  console.log(`[YouTube] Got ${videos.length} videos`);

  return {
    name: channelDetails.title,
    avatar: channelDetails.thumbnail,
    videos,
  };
}

export const TARGET_CHANNEL_ID = 'UCGv3nK48XG7f5O7fR05M90g';