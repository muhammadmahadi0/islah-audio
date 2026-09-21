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
- **Playlists** — create playlists, save any lecture from Home/Search, play them back;
  stored in `localStorage` so they survive reloads (merged into the **Library** tab)
- **Search** — instant client-side search across the channel catalog
- **Modern UI** — emerald + gold dark theme, desktop sidebar, mobile bottom nav,
  floating glass mini-player with full-screen expanded mode, Bayans/Shorts filters

## Tech Stack

| Layer    | Choice                                                      |
| -------- | ----------------------------------------------------------- |
| Framework| Next.js 14 (App Router)                                     |
| Styling  | Tailwind CSS + custom design tokens (`tailwind.config.js`)  |
| State    | Zustand (`player-store`, persisted `playlist-store`)        |
| Data     | YouTube Data API v3 (channel listing + metadata)            |
| Playback | YouTube IFrame Player API (official embed, no extraction)   |
| Hosting  | Netlify (`@netlify/plugin-nextjs`)                          |

## Getting Started

### Prerequisites

- Node.js 20+
- A **YouTube Data API v3** key
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
| `YOUTUBE_API_KEY`    | Yes      | YouTube Data API v3 key (server-side)    |
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
| `GET /api/channel?id=` | Channel info + latest videos as `{ videoId, title, thumbnail, duration, views, publishedAt }` |
| `GET /api/stream/[id]` | Video metadata + official watch/embed URLs (playback is client-side) |
| `GET /api/proxy?url=`  | CORS proxy helper                                                  |

## Project Structure

```
src/
├── app/
│   ├── page.tsx            # Home — hero, filters, lecture grid
│   ├── search/page.tsx     # Search across the catalog
│   ├── library/page.tsx    # Library — Queue + Playlists tabs (merged)
│   └── api/                # channel / stream / proxy routes
├── components/
│   ├── AudioPlayer.tsx     # hidden YouTube embed playback engine
│   ├── Sidebar.tsx         # desktop navigation
│   ├── BottomNav.tsx       # mobile navigation
│   ├── AddToPlaylistMenu.tsx # save-to-playlist panel
│   └── Player/MiniPlayer.tsx # floating mini + full-screen player
├── store/
│   ├── player-store.ts     # playback state (zustand)
│   └── playlist-store.ts   # user playlists, persisted to localStorage
└── lib/
    ├── youtube.ts          # YouTube Data API helpers
    └── utils.ts            # classnames helper
```

## How Playback Works

Third-party audio-extraction APIs (Cobalt v7, public Piped/Invidious instances) are
dead or blocked, so the app plays audio through the **official YouTube embed**
(`AudioPlayer.tsx` creates a hidden `YT.Player`). The store drives play/pause/seek/volume,
and UI components request seeks via the `islah:seek` window event. This needs no backend
extraction and cannot be IP-blocked.

## Deployment

Pushes to `master` auto-deploy on Netlify. The `netlify.toml` uses the official
Next.js plugin — do not add manual `/api/*` or `/_next/*` redirects; they break routing.

## Contributing

PRs welcome. Keep the emerald + gold theme, mobile-first layouts, and update this
README + `AGENTS.md` when adding features.
