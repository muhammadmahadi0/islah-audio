# IslahBD Web

A modern, YouTube-style web app for listening to Islamic lectures (bayans, waz, nasheeds)
from the [Islah YouTube channel](https://www.youtube.com/@islahbd). Audio-only experience with
playlists, search, and a mobile-first design.

![Astro](https://img.shields.io/badge/Astro-5-black) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)

## Features

- **Home feature hub** — scholar banner first (cream in light, glass-gold
  in dark, flat in Material; EN/বাং),
  then the prayer countdown card (Aladhan Hanafi times,
  auto-detected city, live 1s countdown, Hijri date — ported from pray-bd),
  then one card per feature (Live, Search, Library, Boyan, Hamd-Naat,
  Shorts) plus the two channel buttons underneath, each opening that
  channel's own full page
- **Channel pages** — `/channel/[id]` shows the full listing (hero, filters,
  sorts, grid, Show-more) for each channel; new uploads appear automatically
  (silent background refresh, no reload needed)
- **Audio playback** — hidden YouTube embed player wired to a global player store
  (play/pause, next/previous, seek, volume, autoplay-next); the screen stays on
  while playing via the Wake Lock API; MP3 recordings can be downloaded from
  the expanded player (top-right on mobile, bottom-left on desktop)
- **Playlists** — the channel's YouTube playlists plus your own custom ones
  (create, save any lecture from Home/Search, play them back; yours are stored in
  `localStorage` — all merged into the **Library** tab; the playback queue moved
  to the expanded player's **Up next** dropdown)
- **Live broadcast** — a LIVE button in the Home hero plays the islahbd.com live
  audio stream (HLS via hls.js) when on air, and the last broadcast recording
  when offline; live status (incl. the `location` venue name, shown in the
  hero banner and the player) is polled from their public status API
- **Channels** — switch between `@islahbd` and `@IslahiGhazal` from the sidebar
  (slide-over drawer on Android); Home, Search, and Library all follow along
  (Boyan is channel-independent)
- **Boyan** — direct MP3 lectures from the IslahBD API with search + category
  chips; plays in-app, saves to playlists, downloads like recordings
- **Hamd-Naat** — hamd & naat from the IslahBD API with search + All/Audio/Video
  chips; audio items play + download as MP3, video items play as YouTube embeds
  with share links
- **Shorts** — short clips from the IslahBD API with search + All/Audio/Video
  chips; audio items play + download as MP3, video items play as YouTube embeds
  with share links
- **More hub** — `/more` holds every section in one place: the home-page
  buttons plus the new Islamic buttons — Family (full page: welcome,
  mission, applications, connect, socials), Amal, Dua, Islamic calendar,
  Wazifa, Durood (placeholder pages for now, real functions come later)
- **Auto-update** — every section picks up newly published content by itself
  (silent polling + tab-visible refresh; no reload, scroll/filter/playback kept)
- **Persistent playback** — the mini-player stays visible and audio keeps
  playing across Home / Search / Library / Boyan / Hamd-Naat (SPA navigation
  + persisted player islands); a full reload restores the player paused with
  the queue intact
- **Search** — instant client-side search across the channel catalog
- **Shareable links** — every lecture opens at `/watch/[videoId]` and auto-plays;
  share buttons (Home, Search, Library, player) open a dropdown
  (WhatsApp / Telegram / Facebook / X / Copy Link / More apps; rightward on
  the desktop transport); the watch page has explicit Share (native sheet
  suggesting WhatsApp + other apps, WhatsApp/Telegram/Facebook/X fallback
  menu) + Copy Link buttons; links unfurl with title + thumbnail
- **Open IslahBD** — gold-gradient top-bar button (always labeled "Open IslahBD")
  that opens the installed IslahBD app (`islahbd://open` custom scheme, same as
  the app owner's deep links), otherwise falls back to the
  Play Store / App Store for the visitor's device (intent + guarded safety
  timers on Android, hidden-iframe + guarded fallback on iOS — timers cancel
  the moment the app opens, so installed users never land on a store page)
- **Modern UI** — golden theme with dark/light mode (sidebar Theme row,
  persisted), floating liquid-glass sidebar (collapsible via the hamburger —
  slides away on desktop, slide-over drawer on mobile) + top bar, mobile bottom nav pill
  (Home / Live / Boyan / Family / More — Live plays the broadcast or last recording,
  Family opens the Islah family hub, More links to the `/more` hub page),
   floating liquid-glass mini-player with full-screen liquid-glass expanded mode, Bayans/Shorts filters + Newest/Most-viewed/Oldest sorts (global sorts auto-load the full catalog in the background).
  A sidebar **Site Settings** dropdown (animated gear header, persisted;
  Liquid Glass defaults on for iOS + desktop, off for other mobile) holds the
  Liquid Glass toggle (flattens the whole site to a Material 3 solid look),
  Theme and Language rows below. Every button/link blooms a
  water-drop ripple from the touch point (theme-aware ink, gold buttons get
   dark ink; `prefers-reduced-motion` disables it)
- **Language (EN / বাংলা)** — segmented switch inside Site Settings
  (persisted) that translates the whole site chrome — header, all
  views, player + queue, menus, counts, and dates (video titles stay as-is
  from the APIs)
- **Theme (Dark / Light)** — segmented switch inside Site Settings
  with the tap-bloom wrap effect (the old floating toggle is gone)

## Tech Stack (BETA: Astro rebuild)

| Layer    | Choice                                                      |
| -------- | ----------------------------------------------------------- |
| Framework| Astro 5 SSR + React islands (`client:only`)                 |
| Styling  | Tailwind CSS + custom design tokens (`tailwind.config.js`)  |
| State    | Zustand (`player-store`, persisted `playlist-store` + `channel-store`) |
| Data     | Fully keyless InnerTube via youtubei.js (no API key, no quota — Flow-style) |
| Playback | YouTube IFrame Player API (official embed, no extraction)   |
| Hosting  | Vercel for `beta`, Netlify for `master` (adapter picked by `VERCEL` env) |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.4+ (runtime + package manager, Node-compatible — no API keys, no env setup, fully keyless)

### Setup

```bash
git clone https://github.com/muhammadmahadi0/islahbd-web.git
cd islahbd-web
bun install
bun run dev                  # http://localhost:4321
```

### Scripts

```bash
bun run dev     # astro dev server (http://localhost:4321)
bun run build   # production build
bun run preview # preview built output
```

## API Routes

| Route                  | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `GET /api/channel/[id]` | Channel info + first ~100 videos + `nextPageToken` (`total` always null) |
| `GET /api/channel/[id]/meta` | Name + avatar only (Sidebar switcher; 1-day cache) |
| `GET /api/channel/[id]/more/[token]` | Next ~200 videos + `nextPageToken` |
| `GET /api/playlists/[channel]` | A channel's playlists (InnerTube Playlists tab, 6h CDN cache) |
| `GET /api/playlist-items/[id]` | Playlist items, InnerTube (first ~200) |
| `GET /api/live` | islahbd.com live status as `{ isLive, title, speaker, location, listeners, streamUrl, recording }` |
| `GET /api/boyan` | IslahBD MP3 catalog `{ audios, categories }` (1h CDN cache) |
| `GET /api/hamdnaat` | IslahBD hamd-naat `{ items }` (audio MP3 + video youtubeId, 1h CDN cache) |
| `GET /api/shorts` | IslahBD short clips `{ clips }` (audio MP3 + video youtubeId, 1h CDN cache) |
| `GET /api/hls/[...url]` | HLS manifest/media proxy with open CORS (fallback when the live CDN blocks cross-origin fetch) |
| `GET /api/stream/[id]` | Video metadata + official watch/embed URLs (playback is client-side) |

## How Listing Works

Like the Flow Android app, this site lists everything through YouTube's
**private InnerTube API** (`lib/innertube.ts`, via youtubei.js) — no API key,
no quota: uploads playlist → `LockupView` parsing → stateless browse
continuations, channel Playlists tab for playlists, `getBasicInfo` for
single videos. Continuation tokens are base64url-wrapped (`it1_…`)
because raw tokens 404 Astro-on-Netlify once percent-encoded into the path.
Check the `source` field in API responses to confirm which path served.

## Project Structure

```
src/
├── pages/
│   ├── index.astro           # Home shell, buttons only (HomeView island)
│   ├── channel/[id].astro    # Full channel page (ChannelView island)
│   ├── search.astro          # Search shell (?q= → SearchView island)
│   ├── library.astro         # Library shell (server playlists → island)
│   ├── watch/[id].astro      # Shareable watch page (SSR metadata + OG tags)
│   ├── boyan.astro           # Boyan shell (BoyanView island)
│   ├── hamdnaat.astro        # Hamd-Naat shell (HamdNaatView island)
│   ├── shorts.astro          # Shorts shell (ShortsView island)
│   ├── more.astro            # More hub (MoreView island: all sections + Islamic buttons)
│   ├── family.astro          # Family page (FamilyView island: welcome/mission/connect/socials)
│   ├── amal.astro            # Amal placeholder (FeatureComingView)
│   ├── dua.astro             # Dua placeholder (FeatureComingView)
│   ├── calendar.astro        # Calendar placeholder (FeatureComingView)
│   ├── wazifa.astro          # Wazifa placeholder (FeatureComingView)
│   ├── durood.astro          # Durood placeholder (FeatureComingView)
│   └── api/                  # channel (+ more), playlists, playlist-items, live, hls, stream, boyan, hamdnaat, shorts
├── layouts/Layout.astro      # html shell, liquid-glass top bar, islands
├── views/                    # React islands: Home/Channel/Search/Library/Watch/Boyan/HamdNaat/Shorts/More/Family/FeatureComing
├── components/               # player, nav, sidebar, theme toggle, playlist menu, share button
├── store/
│   ├── player-store.ts     # playback state (zustand)
│   ├── playlist-store.ts   # user playlists, persisted to localStorage
│   ├── channel-store.ts    # active channel, persisted
│   ├── theme-store.ts      # light/dark theme, persisted
│   ├── design-store.ts     # liquid-glass / material mode, persisted
│   └── language-store.ts   # EN/বাংলা app language, persisted
└── lib/
    ├── i18n.ts             # whole-site EN/BN chrome dictionary + helpers
    ├── innertube.ts        # ALL listing, fully keyless (uploads, playlists, meta, video info)
    ├── boyan.ts            # IslahBD MP3 catalog + Track mapping (boyan page)
    ├── hamdnaat.ts         # IslahBD hamd-naat catalog + Track mapping (hamdnaat page)
    ├── video.ts            # single-video metadata (watch page + stream API)
    ├── share.ts            # shareable-link helpers (native share / copy)
    ├── open-app.ts         # open installed IslahBD app w/ store fallback
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
player — the toggle only flips visibility + quality on the live player with
the position captured first, so it never reloads, restarts, or stops the
track; it stays disabled until the embed is ready). The **islahbd live broadcast**
and its recording play through a hidden `<audio>` element in
`AudioPlayer.tsx` instead
(tracks carrying `hlsUrl`/`audioUrl`; live tracks also set `isLive`, which disables
seeking). hls.js is lazy-loaded on first HLS play only (prefetched on idle
unless data-saver/2g) — Safari plays HLS
natively with zero download. The YouTube iframe API prewarms on browser idle
but the player itself is created on demand at first play; lectures load at
144p first so audio starts fast. The store drives play/pause/seek/volume, and UI components request seeks
via the `islah:seek` window event (defined in `lib/yt-engine.ts`).

## Deployment (beta → Vercel ONLY, master → Netlify ONLY)

Pushes to `beta` auto-deploy on Vercel (production branch = `beta`, other
branches ignored there). Netlify is master-only: `netlify.toml` has
`ignore = 'test "$BRANCH" != "master"'` so beta/preview builds are skipped.
`astro.config.mjs` selects the adapter by env (`VERCEL` set → `@astrojs/vercel`,
else `@astrojs/netlify`). No env vars needed on either host (fully keyless).
Do not add manual `/api/*` redirects; they break routing.

## Contributing

PRs welcome. Keep the golden theme, mobile-first layouts, and update this
README + `AGENTS.md` when adding features.
