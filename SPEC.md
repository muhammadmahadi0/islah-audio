# Islah Audio — Product Specification

> Living document. Update this file (and `AGENTS.md`) with every behavior,
> architecture, or API change.

## Project Overview

- **Project Name**: Islah Audio
- **Type**: Web Application (Audio Streaming)
- **Core Functionality**: Listen to Islamic lectures (bayans, waz, nasheeds) from the
  YouTube channel `@islahbd`, its real YouTube playlists, user-created playlists, and
  the islahbd.com live broadcast — all in an audio-first experience.
- **Target Users**: Listeners of Islah BD Islamic content.
- **Live Site**: https://islahiboyan.netlify.app/

## Technical Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom emerald + gold dark theme
  (tokens in `tailwind.config.js`, helpers in `src/app/globals.css`)
- **Icons**: Lucide React
- **State Management**: Zustand (`player-store`; persisted `playlist-store`)
- **Listing Data**: YouTube Data API v3 (requires `YOUTUBE_API_KEY`)
- **Lecture Playback**: Official YouTube IFrame embed (hidden `YT.Player`)
- **Live Playback**: `<audio>` + hls.js (direct, `/api/hls` proxy fallback)
- **Hosting**: Netlify with `@netlify/plugin-nextjs` (auto-deploy from `master`)

## UI/UX Specification

### Color Palette (Emerald + Gold Dark)

- **Background**: ink `#060D0A` / `#0A1511` / `#0E1F18`
- **Accent Primary**: emerald `#10B981`, hover `#34D399`
- **Accent Secondary**: gold `#C9A227`, highlight `#E7C55A`
- **Live**: red `#EF4444` with pulsing dot
- **Text**: `#F2F5F3` / secondary `#9DB3A8` / muted `#647C71`

### Typography

- **Font**: Inter + system stack (+ Noto Sans Bengali fallback)
- **Hero title**: 30–44px, weight 800, tight tracking
- **Section titles**: 18–20px, weight 800
- **Body/cards**: 13–14px, weight 400–600

### Layout Structure

- **Desktop (≥768px)**: fixed sidebar (256–288px) + scrollable content;
  floating glass mini-player card bottom-right, clear of the sidebar.
- **Mobile**: floating glass mini-player above a glass bottom nav
  (Home / Search / Library).
- **Expanded player**: full-screen, blurred-artwork backdrop, big art,
  seek slider (locked on live), prev/play/next.

### Components

#### Sidebar (desktop)

- Brand mark (gold `إ` on emerald) + "Islah Audio" + tagline
- Nav: Home, Search, Library — active item gets emerald tint + gold rail
- "Source" card (channel link + live indicator) and footer note

#### Home

- Hero: channel art (gold ring), name, lecture count + total hours,
  Play / Shuffle / **LIVE** buttons, "Live now" banner when on air
- Filters: All / Bayans (>5 min) / Shorts (≤5 min)
- Cards: rounded-2xl, hover lift + play overlay, duration badge,
  "Playing" badge + equalizer on current track, **+** save-to-playlist button

#### Search

- Large rounded search field with clear button; result count; rows with
  thumbnail, duration, save-to-playlist button, equalizer on current track

#### Library (Queue + Playlists tabs — playlists live here, no separate nav)

- **Queue**: current playback queue with track numbers
- **Playlists → From YouTube**: the channel's real YouTube playlists
  (cover, counts, expandable, play-all)
- **Playlists → Your Playlists**: create/rename/delete, save tracks from
  Home/Search, play-all, remove tracks; persisted in `localStorage`

#### Mini Player

- Glass card, progress hairline, thumbnail, title, equalizer, play/pause,
  **× stop button** (halts audio + dismisses, keeps queue), expand chevron
- Live tracks show a red LIVE badge; seek locked on live edge

## Functionality Specification

### Core Features

1. **Channel Catalog** — `/api/channel` lists latest uploads with durations
   and view counts (CDN-cached to save API quota).
2. **Channel Playlists** — `/api/playlists` lists the channel's YouTube
   playlists; items lazy-load per playlist.
3. **Lecture Playback** — hidden YouTube embed driven by the player store
   (play/pause, next/previous incl. auto-advance, seek via `islah:seek` event,
   volume, progress polling). Unplayable videos auto-skip.
4. **Live Broadcast** — `/api/live` polls islahbd.com status (60s);
   red LIVE button plays HLS when on air, gold Last Live replays the latest
   recording when offline. HLS falls back to the `/api/hls` CORS proxy.
5. **User Playlists** — persisted zustand store (`islah-playlists` key);
   duplicate-guarded adds, delete with confirm.
6. **Search** — client-side filter over the loaded catalog.

### API Routes (all `force-dynamic`)

| Route | Purpose |
| ----- | ------- |
| `GET /api/channel/[id]` | Channel info + videos `{ videoId, title, thumbnail, duration, views, publishedAt }` |
| `GET /api/playlists?id=` | Channel playlists `{ id, title, thumbnail, itemCount }` |
| `GET /api/playlist-items/[id]` | Playlist items (same video shape) |
| `GET /api/live` | Live status `{ isLive, title, speaker, listeners, streamUrl, recording }` |
| `GET /api/hls?url=` | HLS manifest/media CORS proxy with URI rewrite |
| `GET /api/stream/[id]` | Video metadata + official watch/embed URLs (compat) |
| `GET /api/proxy?url=` | Generic CORS proxy helper |

### Data Handling

- **IDs travel in URL paths, never query strings** — the hosting layer drops
  query parameters before function invocation (`/api/channel/[id]`,
  `/api/playlist-items/[id]`). The legacy `?id=` variants remain as fallbacks.
- CDN caching on API routes (`s-maxage` + `stale-while-revalidate`); no-store
  for live status.
- Queue in memory (zustand); user playlists in `localStorage`.
- Loading skeletons, error screens with retry, empty states everywhere.

### Edge Cases

- Missing `YOUTUBE_API_KEY` → API routes return 400 with a clear message.
- Unplayable/embed-restricted video → auto-skip to next.
- Invalid video/playlist IDs → 400.
- Live CDN without CORS → transparent `/api/hls` proxy retry.
- Stop button clears track; ENDED auto-advance is guarded on active track.

## Acceptance Criteria

1. ✅ App loads channel data (videos with durations/views)
2. ✅ Grid shows thumbnails, titles, durations, view counts
3. ✅ Clicking a lecture starts audio playback
4. ✅ Mini player shows track info, progress, play/pause/next/prev/stop
5. ✅ Seek + volume work (seek locked on live edge)
6. ✅ LIVE button plays live HLS when on air, recording when offline
7. ✅ Channel playlists listed with playable items
8. ✅ User playlists creatable, persisted, playable
9. ✅ Search filters the catalog
10. ✅ Emerald + gold theme, sidebar on desktop, bottom nav on mobile
11. ✅ Responsive from mobile to desktop
