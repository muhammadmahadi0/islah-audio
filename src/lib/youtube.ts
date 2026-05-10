/**
 * YouTube Data API v3 Helper
 * Requires YOUTUBE_API_KEY - returns 400 if missing
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
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

  return data.items
    .filter((item: any) => item.snippet?.resourceId?.videoId)
    .map((item: any) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      publishedAt: item.snippet.publishedAt,
    }));
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