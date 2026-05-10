/**
 * YouTube Data Fetcher - Direct scraping approach
 */

export interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
  views: number;
  uploadDate: string;
}

export interface YouTubeStream {
  audioUrl: string;
  title: string;
  thumbnail: string;
  duration: number;
}

const CHANNEL_ID = 'UCWjE3uGZzKvwE3LHHJvBMSg'; // Islah BD channel ID

/**
 * Get videos from YouTube channel by scraping
 */
export async function getChannelVideos(channelHandle: string, maxResults = 50): Promise<YouTubeVideo[]> {
  try {
    // Try fetching channel's uploads playlist
    const channelName = channelHandle.replace('@', '');
    const channelUrl = `https://www.youtube.com/@${channelName}/videos`;

    const response = await fetch(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error('[YouTube] Failed to fetch channel page:', response.status);
      return getHardcodedVideos();
    }

    const html = await response.text();

    // Parse JSON data from the page
    const jsonMatches = html.match(/var ytInitialData = ({.*?});/);
    if (!jsonMatches) {
      console.error('[YouTube] Could not find initial data');
      return getHardcodedVideos();
    }

    const data = JSON.parse(jsonMatches[1]);

    // Extract video list from the response
    const videos: YouTubeVideo[] = [];

    try {
      const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs;
      const videosTab = tabs?.find((t: any) => t.tabRenderer?.selected);
      const playlist = videosTab?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.gridRenderer;

      const items = playlist?.rows || [];

      for (const item of items) {
        const gridItem = item.gridVideoRenderer;
        if (gridItem) {
          const videoId = gridItem.videoId;
          const title = gridItem.title?.runs?.[0]?.text || '';
          const thumbnail = gridItem.thumbnail?.thumbnails?.[0]?.url || '';
          const duration = gridItem.lengthText?.simpleText || '0:00';
          const views = gridItem.viewCountText?.simpleText?.replace(/[^0-9]/g, '') || '0';

          // Parse duration to seconds
          const durationSecs = parseDuration(duration);

          videos.push({
            videoId,
            title,
            thumbnail: thumbnail.replace('?sqp', '?w=400').replace('&sqp', '&w=400'),
            duration: durationSecs,
            views: parseInt(views) || 0,
            uploadDate: '',
          });

          if (videos.length >= maxResults) break;
        }
      }
    } catch (parseError) {
      console.error('[YouTube] Parse error:', parseError);
    }

    return videos.length > 0 ? videos : getHardcodedVideos();
  } catch (error) {
    console.error('[YouTube] Error:', error);
    return getHardcodedVideos();
  }
}

function parseDuration(duration: string): number {
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

// Fallback videos - in case scraping fails
function getHardcodedVideos(): YouTubeVideo[] {
  // These are placeholder - the actual videos will be fetched from YouTube
  return [];
}

/**
 * Get audio stream URL using ytdl-core
 */
export async function getAudioStream(videoId: string): Promise<YouTubeStream | null> {
  try {
    // Dynamic import ytdl-core
    const ytdl = await import('ytdl-core');

    const info = await ytdl.default.getInfo(videoId, { lang: 'en' });

    // Find best audio format
    const audioFormats = ytdl.default.filterFormats(info.formats, 'audioonly');

    if (audioFormats.length === 0) {
      const combined = ytdl.default.filterFormats(info.formats, 'audioandvideo')
        .filter(f => f.bitrate && f.bitrate > 0);

      if (combined.length === 0) return null;

      combined.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

      return {
        audioUrl: combined[0].url,
        title: info.videoDetails.title,
        thumbnail: info.videoDetails.thumbnails?.[0]?.url || '',
        duration: parseInt(info.videoDetails.lengthSeconds || '0'),
      };
    }

    audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

    return {
      audioUrl: audioFormats[0].url,
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails?.[0]?.url || '',
      duration: parseInt(info.videoDetails.lengthSeconds || '0'),
    };
  } catch (error) {
    console.error('[YouTube] Stream error:', error);
    return null;
  }
}