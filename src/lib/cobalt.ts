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
        downloadMode: 'audio',
        audioFormat: 'mp3',
      }),
    });

    if (!response.ok) {
      console.error('[Cobalt] API error:', response.status);
      const errorText = await response.text();
      console.error('[Cobalt] Error response:', errorText);
      return null;
    }

    const data: CobaltResponse = await response.json();

    if (!data.url) {
      console.error('[Cobalt] No URL returned:', data);
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