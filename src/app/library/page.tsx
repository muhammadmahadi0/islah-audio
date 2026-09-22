/**
 * Library page (server wrapper) — BETA.
 *
 * The channel playlists are fetched server-side and passed in as initial
 * data, so the section renders with the HTML and can never get stuck on a
 * client-side fetch. If the server fetch fails, the client view retries
 * from the browser as fallback.
 */

import { getChannelPlaylists, hasApiKey, TARGET_CHANNEL_ID } from '@/lib/youtube';
import LibraryView, { type ChannelPlaylist } from './library-view';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  let initialYtPlaylists: ChannelPlaylist[] | null = null;

  if (hasApiKey()) {
    try {
      initialYtPlaylists = await getChannelPlaylists(TARGET_CHANNEL_ID);
    } catch (error) {
      console.error('[Library] server playlists fetch failed:', error);
    }
  }

  return <LibraryView initialYtPlaylists={initialYtPlaylists} />;
}
