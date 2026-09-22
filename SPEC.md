# Islah Audio — Product Specification

> Living document. Update this file (and `AGENTS.md`) with every behavior,
> architecture, or API change.

## Project Overview

- **Project Name**: Islah Audio
- **Type**: Web Application (Audio Streaming)
- **Core Functionality**: Listen to Islamic lectures (bayans, waz, nasheeds) from
  the YouTube channels `@islahbd` and `@IslahiGhazal`, plus user playlists and
  the islahbd.com live broadcast — all in an audio-first experience.
- **Target Users**: Listeners of Islah BD Islamic content.
- **Live Site**: https://islahiboyan.netlify.app/

## Technical Stack (BETA: Astro rebuild)

- **Framework**: Astro 5 (SSR via `@astrojs/netlify`) + React islands
  (`client:only`) for player, views, and nav — YouTube-style shell
- **Styling**: Tailwind CSS with custom golden theme
  (tokens in `tailwind.config.js`, helpers in `src/styles/globals.css`)
- **Icons**: Lucide React
- **State Management**: Zustand (`player-store`; persisted `playlist-store`)
- **Listing Data**: keyless InnerTube first, YouTube Data API v3 fallback
- **Lecture Playback**: Official YouTube IFrame embed (hidden `YT.Player`)
- **Live Playback**: `<audio>` + hls.js (direct, `/api/hls` proxy fallback)
- **Hosting**: Netlify (`dist` publish, SSR functions via adapter)

## UI/UX Specification

### Color Palette (Golden — dark default, light available)

- **Background**: ink `#060D0A` / `#0A1511` / `#0E1F18`
  (light: warm paper `#F4F6F3` → white surfaces)
- **Accent Primary**: gold `#C9A227`, highlight `#E7C55A`, deep `#9A7B1A`
  (light: deeper golds `#96700F`/`#B58D1A` for contrast)
- **Live**: red `#EF4444` with pulsing dot
- **Text**: `#F2F5F3` / secondary `#9DB3A8` / muted `#647C71`
  (light: ink text + slate secondary)
- All tokens resolve through CSS variables (`globals.css`); `white` remaps to
  theme foreground. A floating toggle (persisted `islah-theme`) switches themes.

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

#### Sidebar (desktop) + drawer (Android)

- Brand mark (gold `?` on bronze) + "Islah Audio" + tagline
- Nav: Home, Search, Library — active item gets gold tint + gold rail
- **Channels switcher**: all registered channels (`lib/channels.ts`) with live
  avatars; tapping switches Home, Search, and Library; choice persists.
  Android opens the same sidebar as a slide-over drawer via the top-bar
  hamburger button.
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
- **Playlists → From YouTube**: every channel's real YouTube playlists,
  server-rendered into the page HTML for all channels at once (never depends
  on a client fetch); cards expand to InnerTube-first items with timeout + retry
- **Playlists → Your Playlists**: create/rename/delete your own playlists, save
  tracks from Home/Search, play-all, remove tracks; persisted in `localStorage`

#### Mini Player

- Liquid-glass card (iPhone-style), progress hairline, thumbnail, title,
  equalizer, play/pause,
  **× stop button** (halts audio + dismisses, keeps queue), expand chevron
- Live tracks show a red LIVE badge; seek locked on live edge

## Functionality Specification

### Core Features

1. **Channel Catalog (BETA: InnerTube first)** — `/api/channel/[id]` lists the
   newest 100 uploads with durations and view counts, plus a `nextPageToken`
   and `total`; `/api/channel/[id]/more/[token]` appends older videos in
   200-chunks. Listing goes through keyless InnerTube (no quota) with the
   Data API as fallback; `total` comes from a 1-unit statistics call when a
   key exists, else the UI shows counts without a total. Home has a Show-more
   button; Search indexes every chunk in the background. Responses are
   CDN-cached to save quota.
2. **Lecture Playback** — hidden YouTube embed driven by the player store
   (play/pause, next/previous incl. auto-advance, seek via `islah:seek` event,
   volume, progress polling). Playback always starts audio-only (hidden
   iframe, lowest quality). Expanded = artwork + video toggle button; tapping
   it shows the real video in the same player, tapping again returns to
   audio-only. Collapsing also returns to audio-only.
   Unplayable videos auto-skip.
3. **Live Broadcast** — `/api/live` polls islahbd.com status (60s);
   red LIVE button plays HLS when on air, gold Last Live replays the latest
   recording when offline. HLS falls back to the `/api/hls` CORS proxy,
   then to the last recording, so a dead live edge still yields audio.
4. **User Playlists** — persisted zustand store (`islah-playlists` key);
   duplicate-guarded adds, delete with confirm.
5. **Search** — client-side filter over the fully indexed catalog.

### API Routes (all `force-dynamic`)

| Route | Purpose |
| ----- | ------- |
| `GET /api/channel/[id]` | Channel info + first 100 videos + `nextPageToken` + `total` |
| `GET /api/channel/[id]/more/[token]` | Next 200 videos + `nextPageToken` |
| `GET /api/playlists` | Channel playlists (BETA, fixed channel) |
| `GET /api/playlist-items/[id]` | Playlist items, InnerTube first (BETA) |
| `GET /api/live` | Live status `{ isLive, title, speaker, listeners, streamUrl, recording }` |
| `GET /api/hls?url=` | HLS manifest/media CORS proxy with URI rewrite |
| `GET /api/stream/[id]` | Video metadata + official watch/embed URLs (compat) |
| `GET /api/proxy?url=` | Generic CORS proxy helper |

### Data Handling

- **IDs travel in URL paths, never query strings** — the hosting layer drops
  query parameters before function invocation (`/api/channel/[id]`,
  `/api/channel/[id]/more/[token]`). The legacy `?id=` variants remain as fallbacks.
- **Continuation tokens travel client-wrapped** — raw InnerTube tokens contain
  `%`, which 404s Astro-on-Netlify once percent-encoded into the path, so the
  APIs emit `it1_`-prefixed base64url (`toClientToken`) and the more-route
  unwraps it (`fromClientToken`).
- **Every fetch has a timeout** — bare `fetch()` hangs forever on stalled mobile
  networks, so clients use `fetchJson()` (`lib/fetch-timeout.ts`, 15–25s) and
  server InnerTube calls race `withTimeout()` (8s) into the Data API fallback.
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
7. ✅ Entire catalog reachable (100 first + Show-more chunks, search indexes all)
8. ✅ User playlists creatable, persisted, playable
9. ✅ Search filters the catalog
10. ✅ Golden theme, sidebar on desktop, bottom nav on mobile
11. ✅ Responsive from mobile to desktop
