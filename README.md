# Islah Audio

A modern, Spotify-style web app for listening to Islamic lectures (bayans, waz, nasheeds)
from the [Islah YouTube channel](https://www.youtube.com/@islahbd). Audio-only experience with
playlists, search, and a mobile-first design.

**Live:** https://islahiboyan.netlify.app/

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8) ![Deployed](https://img.shields.io/badge/Netlify-live-00ad9f)

## Features

- **Lecture catalog** — browses the latest uploads from the channel with thumbnails,
  durations, and view counts
- **Audio playback** — hidden YouTube embed player wired to a global player store
  (play/pause, next/previous, seek, volume, autoplay-next)
- **Playlists** — create your own playlists and save any lecture from
  Home/Search (stored in `localStorage`, merged into the **Library** tab)
- **Live broadcast** — a LIVE button in the Home hero plays the islahbd.com live
  audio stream (HLS via hls.js) when on air, and the last broadcast recording
  when offline; live status is polled from their public status API
- **Search** — instant client-side search across the channel catalog
- **Modern UI** — emerald + gold theme with light/dark mode (floating toggle,
  persisted), desktop sidebar, mobile bottom nav,
  floating glass mini-player with full-screen expanded mode, Bayans/Shorts filters

## Tech Stack

| Layer    | Choice                                                      |
| -------- | ----------------------------------------------------------- |
| Framework| Next.js 14 (App Router)                                     |
| Styling  | Tailwind CSS + custom design tokens (`tailwind.config.js`)  |
| State    | Zustand (`player-store`, persisted `playlist-store`)        |
| Data     | **BETA:** keyless InnerTube listing first, YouTube Data API v3 fallback |
| Playback | YouTube IFrame Player API (official embed, no extraction)   |
| Hosting  | Netlify (`@netlify/plugin-nextjs`)                          |

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
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable             | Required | Description                              |
| -------------------- | -------- | ---------------------------------------- |
| `YOUTUBE_API_KEY`    | No (fallback) | YouTube Data API v3 key — listing prefers keyless InnerTube on this branch |
| `NEXT_PUBLIC_CHANNEL_HANDLE` | No | Displayed channel handle (default `@islahbd`) |

> On Netlify, set `YOUTUBE_API_KEY` under **Site settings → Environment variables**.

### Scripts

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # serve production build
```

## API Routes

| Route                  | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `GET /api/channel/[id]` | Channel info + first 100 videos + `nextPageToken` + `total` |
| `GET /api/channel/[id]/more/[token]` | Next 200 videos + `nextPageToken` |
| `GET /api/live` | islahbd.com live status as `{ isLive, title, speaker, listeners, streamUrl, recording }` |
| `GET /api/hls?url=` | HLS manifest/media proxy with open CORS (fallback when the live CDN blocks cross-origin fetch) |
| `GET /api/stream/[id]` | Video metadata + official watch/embed URLs (playback is client-side) |
| `GET /api/proxy?url=`  | CORS proxy helper                                                  |

## How Listing Works (beta experiment)

Like the Flow Android app, this branch lists channel videos through YouTube's
**private InnerTube API** (`lib/innertube.ts`, via youtubei.js) instead of the
quota-limited Data API: uploads playlist → `LockupView` parsing → stateless
browse continuations. No key, no quota (≈1 unit per fresh load for the totals
lookup when a key exists). If InnerTube fails, routes fall back to the Data API
automatically — check the `source` field in API responses to see which served.

## Project Structure

```
src/
├── app/
│   ├── page.tsx            # Home — hero, filters, lecture grid
│   ├── search/page.tsx     # Search across the catalog
│   ├── library/page.tsx    # Library — Queue + Playlists tabs (merged)
│   └── api/                # channel / live / hls / stream / proxy routes
├── components/
│   ├── AudioPlayer.tsx     # hidden YouTube embed + stream playback engine
│   ├── Sidebar.tsx         # desktop navigation
│   ├── BottomNav.tsx       # mobile navigation
│   ├── BetaBadge.tsx       # floating BETA marker (beta branch only)
│   ├── AddToPlaylistMenu.tsx # save-to-playlist panel
│   └── Player/MiniPlayer.tsx # floating mini + full-screen player
├── store/
│   ├── player-store.ts     # playback state (zustand)
│   ├── playlist-store.ts   # user playlists, persisted to localStorage
│   └── theme-store.ts      # light/dark theme, persisted
└── lib/
    ├── youtube.ts          # YouTube Data API helpers (fallback)
    ├── innertube.ts        # keyless InnerTube listing (primary on beta)
    ├── live.ts             # live-status types
    └── utils.ts            # classnames helper
```

## How Playback Works
Third-party audio-extraction APIs (Cobalt v7, public Piped/Invidious instances) are
dead or blocked, so YouTube tracks play through the **official YouTube embed**
(`AudioPlayer.tsx` creates a hidden `YT.Player`). The **islahbd live broadcast**
and its recording play through a hidden `<audio>` element + hls.js instead
(tracks carrying `hlsUrl`/`audioUrl`; live tracks also set `isLive`, which disables
seeking). The store drives play/pause/seek/volume, and UI components request seeks
via the `islah:seek` window event.

## Deployment

Pushes to `master` auto-deploy on Netlify. The `netlify.toml` uses the official
Next.js plugin — do not add manual `/api/*` or `/_next/*` redirects; they break routing.

## Contributing

PRs welcome. Keep the emerald + gold theme, mobile-first layouts, and update this
README + `AGENTS.md` when adding features.
