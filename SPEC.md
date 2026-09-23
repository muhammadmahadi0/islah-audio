# Islah Audio — Product Specification

> Living document. Update this file (plus `AGENTS.md` and `README.md`) with
> every behavior, architecture, or API change.

## Project Overview

- **Project Name**: Islah Audio
- **Type**: Web Application (Audio Streaming)
- **Core Functionality**: Listen to Islamic lectures (bayans, waz, nasheeds) from
  the YouTube channels `@islahbd` and `@IslahiGhazal`, plus user playlists and
  the islahbd.com live broadcast — all in an audio-first experience.
- **Target Users**: Listeners of Islah BD Islamic content.
- **Live Site (beta)**: https://beta--islahiboyan.netlify.app/

## Technical Stack (BETA: Astro rebuild)

- **Framework**: Astro 5 (SSR via `@astrojs/netlify`) + React islands
  (`client:only`) for player, views, and nav — liquid-glass shell
- **Styling**: Tailwind CSS with custom golden theme
  (tokens in `tailwind.config.js`, helpers in `src/styles/globals.css`)
- **Icons**: Lucide React
- **State Management**: Zustand (`player-store`; persisted `playlist-store`,
  `channel-store`, `theme-store`, `design-store`)
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

### Layout Structure (liquid-glass iPhone style)

- **Top bar**: floating glass pill with ISLAH brand, desktop search field,
  and a gold-gradient **Open IslahBD** button (`linear-gradient(135deg,
  #cba135, #e8c96c, #a07e28)`, pinned dark text, gloss + glow in liquid
  mode, flat in Material; tuned glow for light mode) — launches the native
  IslahBD app when installed (Android intent / iOS universal link),
  otherwise sends the user to the Play Store / App Store for their device
  (desktop opens islahbd.com). No search icon on mobile — search lives in
  the bottom nav. All primary buttons site-wide (Play all, filters, play
  FABs, Create, Try again, toggles) share this exact gold-gradient
  `.liquid-gold` style; secondary actions stay frosted glass.

- **Backdrop**: fixed ambient gold/green aura + refraction blobs behind content
- **Desktop (≥768px)**: floating liquid-glass sidebar pill + scrollable content;
  floating liquid-glass mini-player card bottom-right, clear of the sidebar.
- **Mobile**: floating liquid-glass mini-player above a liquid-glass bottom nav
  pill (Home / Search / Library); floating top bar + chips bar are glass pills.
- **Expanded player**: full-screen liquid-glass (iPhone-style), blurred-artwork backdrop, big art,
  seek slider (locked on live), prev/play/next. Same stacked flow on all
  screens; on desktop (≥768px) the sheet stretches wider (3xl/4xl) with the
  video as the largest section and controls + Up-next below it. The sheet
  always fits one viewport (no scrolling): flex-1 video area with dvh-capped
  frame (up to 52dvh on desktop), compact controls, volume hidden under 600px
  height, side-by-side grid on short landscape screens. On desktop the control
  cluster is a YouTube-style bar (title row, then full-width seek with
  prev / play / next / mute+volume / time in one row); mobile keeps its
  stacked blocks untouched.
- Cards/panels/inputs system-wide use `.liquid-glass` / `.liquid-chip` /
  `.liquid-input` from `globals.css` (specular top edge, diagonal gloss sheen,
  inner reflections); primary actions use glossy gold `.liquid-gold`.
- Glass blur radii are capped (~20px panels, ~60–90px ambient blobs) and
  off-screen cards/rows skip rendering via `.cv-card` / `.cv-row`
  (`content-visibility: auto`) — no `background-attachment: fixed`, no
  `AnimatePresence popLayout` on the grid, ambient blobs are `contain: strict`
  + GPU-composited so scrolling stays smooth on phones.

### Components

#### Sidebar (desktop) + drawer (Android)

- Brand mark (gold `إ` on bronze) + "Islah Audio" + tagline
- Nav: Home, Search, Library — active item gets a frosted glass highlight
- **Channels switcher**: all registered channels (`lib/channels.ts`) with live
  avatars; tapping switches Home, Search, and Library; choice persists.
  Android opens the same sidebar as a slide-over drawer via the top-bar
  hamburger button.
- **Liquid Glass toggle**: direct sidebar row (desktop + drawer) switching the
  **Liquid Glass** design — on = iPhone-style frosted design,
  off = flat Material 3 solid surfaces. Defaults ON for iOS + desktop, OFF
  for other mobile (Android etc.); first-visit default only. Choice persists
  (`islah-design`) and applies pre-paint via `Layout.astro`, so there is no flash.
- Footer note

#### Home

- Hero: channel art (gold ring), name, video count,
  Play-all / Shuffle / **LIVE** buttons (single-line labels), "Live now" banner when on air
- Filters: All / Bayans (>5 min) / Shorts (≤5 min)
- Cards: rounded-2xl, hover lift + play overlay, duration badge,
  "Playing" badge + equalizer on current track, **+** save-to-playlist button,
  share button (copies the `/watch/[id]` link); tapping the title opens the
  shareable watch page

#### Search

- Large rounded search field with clear button; result count; rows with
  thumbnail, duration, save-to-playlist button, share button, equalizer on current track

#### Watch (shareable links)

- Every video is addressable at `/watch/[videoId]` — opening the link plays
  that exact content (auto-play on open, single-track queue)
- Server-rendered metadata (title, thumbnail, channel, duration, views, date)
  plus OG/Twitter tags, so links unfurl with title + thumbnail in chats
- Share button on Home cards, Search rows, Library rows, the expanded player,
  and the watch page itself (native share sheet on mobile, clipboard copy on
  desktop); invalid IDs get a friendly not-found page

#### Library (playlists only — no Queue tab)

- **Playlists → From YouTube**: every channel's real YouTube playlists,
  server-rendered into the page HTML for all channels at once (never depends
  on a client fetch); cards expand to InnerTube-first items with timeout + retry
- **Playlists → Your Playlists**: create/rename/delete your own playlists, save
  tracks from Home/Search, play-all, remove tracks; persisted in `localStorage`
- The playback queue lives in the expanded player's **Up next** dropdown
  (bottom of the sheet, opens upward as an overlay; pinned Now-playing header
  on top, list auto-scrolls to the current track, tap a row to jump to it)

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
   Unplayable videos auto-skip. The screen stays on while anything is playing
   (Screen Wake Lock API, re-requested on tab-visible; silent no-op where
   unsupported).
3. **Live Broadcast** — `/api/live` polls islahbd.com status (60s);
   glowing-red LIVE button plays HLS when on air, plain Last-live button replays
   the latest recording when offline. HLS falls back to the `/api/hls` CORS proxy,
   then to the last recording, so a dead live edge still yields audio.
4. **User Playlists** — persisted zustand store (`islah-playlists` key);
   duplicate-guarded adds, delete with confirm.
5. **Search** — client-side filter over the fully indexed catalog.
6. **Shareable Links** — `/watch/[videoId]` opens + plays that exact video
   (metadata via `lib/video.ts`: Data API when a key exists, keyless oEmbed
   otherwise; `lib/share.ts` builds links and drives native-share-or-copy).

### API Routes (all `force-dynamic`)

| Route | Purpose |
| ----- | ------- |
| `GET /api/channel/[id]` | Channel info + first 100 videos + `nextPageToken` + `total` |
| `GET /api/channel/[id]/more/[token]` | Next 200 videos + `nextPageToken` |
| `GET /api/playlists/[channel]` | A channel's playlists (Data API, 6h CDN cache) |
| `GET /api/playlist-items/[id]` | Playlist items, InnerTube first, Data API fallback |
| `GET /api/live` | Live status `{ isLive, title, speaker, listeners, streamUrl, recording }` |
| `GET /api/hls/[...url]` | HLS manifest/media CORS proxy with URI rewrite |
| `GET /api/stream/[id]` | Video metadata (title, thumbnail, duration, channel, description, date, views) + official watch/embed URLs |

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

- Missing `YOUTUBE_API_KEY` → channel listing still works via keyless InnerTube;
  only `/api/playlists/[channel]` (Data API-only) returns 400 with a clear message.
- Unplayable/embed-restricted video → auto-skip to next.
- Invalid video/playlist IDs → 400.
- Live CDN without CORS → transparent `/api/hls` proxy retry.
- Stop button clears track; ENDED auto-advance is guarded on active track.

## Acceptance Criteria

1. ✅ App loads channel data (videos with durations/views)
2. ✅ Grid shows thumbnails, titles, durations, view counts
3. ✅ Clicking a lecture starts audio playback
4. ✅ Mini player shows track info, progress, play/pause/stop; expanded player has Up next queue
5. ✅ Seek + volume work (seek locked on live edge)
6. ✅ LIVE button plays live HLS when on air, recording when offline
7. ✅ Entire catalog reachable (100 first + Show-more chunks, search indexes all)
8. ✅ User playlists creatable, persisted, playable
9. ✅ Search filters the catalog
10. ✅ Golden theme, sidebar on desktop, bottom nav on mobile
11. ✅ Responsive from mobile to desktop
12. ✅ Every video opens via `/watch/[videoId]` and auto-plays; links unfurl with title + thumbnail
