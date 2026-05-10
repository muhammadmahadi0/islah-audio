/**
 * Cobalt API for audio extraction
 */

export interface CobaltStream {
  url: string;
  title: string;
  thumbnail: string;
  duration: number;
}

interface CobaltResponse {
  url: string;
  title?: string;
  thumbnail?: string;
  duration?: number;
}

export async function getAudioStream(videoId: string): Promise<CobaltStream | null> {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const response = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        url: youtubeUrl,
        vCodec: 'h264',
        vQuality: '360',
        aFormat: 'mp3',
        isAudioOnly: true,
      }),
    });

    if (!response.ok) {
      console.error('[Cobalt] API error:', response.status);
      return null;
    }

    const data: CobaltResponse = await response.json();

    if (!data.url) {
      console.error('[Cobalt] No URL returned');
      return null;
    }

    return {
      url: data.url,
      title: data.title || '',
      thumbnail: data.thumbnail || '',
      duration: data.duration || 0,
    };
  } catch (error) {
    console.error('[Cobalt] Fetch error:', error);
    return null;
  }
}