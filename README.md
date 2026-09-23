# Islah Audio

A modern, YouTube-style web app for listening to Islamic lectures (bayans, waz, nasheeds)
from the [Islah YouTube channel](https://www.youtube.com/@islahbd). Audio-only experience with
playlists, search, and a mobile-first design.

**Live (beta):** https://beta--islahiboyan.netlify.app/

![Astro](https://img.shields.io/badge/Astro-5-black) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8) ![Deployed](https://img.shields.io/badge/Netlify-live-00ad9f)

## Features

- **Lecture catalog** — browses the latest uploads from the channel with thumbnails,
  durations, and view counts
- **Audio playback** — hidden YouTube embed player wired to a global player store
  (play/pause, next/previous, seek, volume, autoplay-next); the screen stays on
  while playing via the Wake Lock API
- **Playlists** — the channel's YouTube playlists plus your own custom ones
  (create, save any lecture from Home/Search, play them back; yours are stored in
  `localStorage` — all merged into the **Library** tab; the playback queue moved
  to the expanded player's **Up next** dropdown)
- **Live broadcast** — a LIVE button in the Home hero plays the islahbd.com live
  audio stream (HLS via hls.js) when on air, and the last broadcast recording
  when offline; live status is polled from their public status API
- **Channels** — switch between `@islahbd` and `@IslahiGhazal` from the sidebar
  (slide-over drawer on Android); Home, Search, and Library all follow along
- **Search** — instant client-side search across the channel catalog
- **Shareable links** — every lecture opens at `/watch/[videoId]` and auto-plays;
  share buttons (Home, Search, Library, player, watch page) use the native sheet
  on mobile and copy the link on desktop; links unfurl with title + thumbnail
- **Open IslahBD** — gold-gradient top-bar button that launches the native
  IslahBD app when installed (Android intent `com.islahbd.app` / iOS universal
  link), otherwise falls back to the Play Store / App Store for the visitor's
  device
- **Modern UI** — golden theme with light/dark mode (floating toggle,
  persisted), floating liquid-glass sidebar + top bar, mobile bottom nav pill,
  floating liquid-glass mini-player with full-screen liquid-glass expanded mode, Bayans/Shorts filters.
  A sidebar **Liquid Glass** toggle (persisted; defaults on for iOS + desktop,
  off for other mobile) flattens the
  whole site to a Material 3 solid look

## Tech Stack (BETA: Astro rebuild)

| Layer    | Choice                                                      |
| -------- | ----------------------------------------------------------- |
| Framework| Astro 5 SSR + React islands (`client:only`)                 |
| Styling  | Tailwind CSS + custom design tokens (`tailwind.config.js`)  |
| State    | Zustand (`player-store`, persisted `playlist-store` + `channel-store`) |
| Data     | Keyless InnerTube listing first, YouTube Data API v3 fallback |
| Playback | YouTube IFrame Player API (official embed, no extraction)   |
| Hosting  | Netlify (SSR functions via `@astrojs/netlify`)              |

## Getting Started

### Prerequisites

- Node.js 20+
- A **YouTube Data API v3** key — fallback only on this branch
  ([enable it here](https://console.cloud.google.com/apis/library/youtube.googleapis.com))

### Setup

```bash
git clone https://github.com/muhammadmahadi0/islah-audio.git
cd islah-audio
npm install
cp .env.example .env.local   # then fill in YOUTUBE_API_KEY
npm run dev                  # http://localhost:4321
```

### Environment variables

| Variable             | Required | Description                              |
| -------------------- | -------- | ---------------------------------------- |
| `YOUTUBE_API_KEY`    | No (fallback) | YouTube Data API v3 key — listing prefers keyless InnerTube on this branch |

> On Netlify, set `YOUTUBE_API_KEY` under **Site settings → Environment variables**.

### Scripts

```bash
npm run dev     # astro dev server (http://localhost:4321)
npm run build   # production build
npm run preview # preview built output
```

## API Routes

| Route                  | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `GET /api/channel/[id]` | Channel info + first 100 videos + `nextPageToken` + `total` |
| `GET /api/channel/[id]/more/[token]` | Next 200 videos + `nextPageToken` |
| `GET /api/playlists/[channel]` | A channel's playlists (Data API, 6h CDN cache) |
| `GET /api/playlist-items/[id]` | Playlist items, InnerTube first, Data API fallback |
| `GET /api/live` | islahbd.com live status as `{ isLive, title, speaker, listeners, streamUrl, recording }` |
| `GET /api/hls/[...url]` | HLS manifest/media proxy with open CORS (fallback when the live CDN blocks cross-origin fetch) |
| `GET /api/stream/[id]` | Video metadata + official watch/embed URLs (playback is client-side) |

## How Listing Works (beta experiment)

Like the Flow Android app, this branch lists channel videos through YouTube's
**private InnerTube API** (`lib/innertube.ts`, via youtubei.js) instead of the
quota-limited Data API: uploads playlist → `LockupView` parsing → stateless
browse continuations. No key, no quota (≈1 unit per fresh load for the totals
lookup when a key exists). Continuation tokens are base64url-wrapped (`it1_…`)
because raw tokens 404 Astro-on-Netlify once percent-encoded into the path.
If InnerTube fails, routes fall back to the Data API
automatically — check the `source` field in API responses to see which served.

## Project Structure

```
src/
├── pages/
│   ├── index.astro           # Home shell (HomeView island)
│   ├── search.astro          # Search shell (?q= → SearchView island)
│   ├── library.astro         # Library shell (server playlists → island)
│   ├── watch/[id].astro      # Shareable watch page (SSR metadata + OG tags)
│   └── api/                  # channel (+ more), playlists, playlist-items, live, hls, stream
├── layouts/Layout.astro      # html shell, liquid-glass top bar, islands
├── views/                    # React islands: Home/Search/Library/Watch
├── components/               # player, nav, sidebar, theme toggle, playlist menu, share button
├── store/
│   ├── player-store.ts     # playback state (zustand)
│   ├── playlist-store.ts   # user playlists, persisted to localStorage
│   ├── channel-store.ts    # active channel, persisted
│   ├── theme-store.ts      # light/dark theme, persisted
│   └── design-store.ts     # liquid-glass / material mode, persisted
└── lib/
    ├── youtube.ts          # YouTube Data API helpers (fallback)
    ├── innertube.ts        # keyless InnerTube listing (primary)
    ├── video.ts            # single-video metadata (watch page + stream API)
    ├── share.ts            # shareable-link helpers (native share / copy)
    ├── yt-engine.ts        # single YT.Player instance, audio/video modes
    ├── channels.ts         # channel registry
    ├── live.ts             # live-status types
    ├── fetch-timeout.ts    # fetchJson + withTimeout helpers
    └── utils.ts            # classnames helper
```

## How Playback Works
Third-party audio-extraction APIs (Cobalt v7, public Piped/Invidious instances) are
dead or blocked, so YouTube tracks play through the **official YouTube embed**
(the single `YT.Player` in `lib/yt-engine.ts`, mounted by `MiniPlayer.tsx` —
minimized/audio-only by default, video opt-in via the toggle in the expanded
player). The **islahbd live broadcast**
and its recording play through a hidden `<audio>` element + hls.js in
`AudioPlayer.tsx` instead
(tracks carrying `hlsUrl`/`audioUrl`; live tracks also set `isLive`, which disables
seeking). The store drives play/pause/seek/volume, and UI components request seeks
via the `islah:seek` window event (defined in `lib/yt-engine.ts`).

## Deployment (BETA)

Pushes to `beta` auto-deploy on Netlify (branch deploy). `netlify.toml`
publishes `dist/`; SSR/API routes run as functions via `@astrojs/netlify`.
Do not add manual `/api/*` redirects; they break routing.

## Contributing

PRs welcome. Keep the golden theme, mobile-first layouts, and update this
README + `AGENTS.md` when adding features.
