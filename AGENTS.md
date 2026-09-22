# AGENTS.md — AI Coding Agent Guide for Islah Audio

This file orients AI coding agents working in this repo. Read it before making changes.

## Commands (BETA: Astro — master still uses Next.js commands)

- `npm run dev` — dev server, port 4321 (needs `YOUTUBE_API_KEY` in `.env.local`)
- `npm run build` — production build (must pass)
- `npm run preview` — preview the built output locally
- No linter is configured

## Architecture (do not break these contracts) — BETA Astro layout

0. **Astro, not Next.** Pages live in `src/pages/*.astro`, API in
   `src/pages/api/**` as `APIRoute` handlers, shell in `src/layouts/`.
   Interactive UI stays React islands (`client:only="react"`). No `next/*`
   imports anywhere. Env keys read as
   `process.env.X || import.meta.env.X` (dev only populates the latter).

1. **Playback = hidden YouTube embed + hidden `<audio>` for streams.**
   `src/components/AudioPlayer.tsx` owns both engines. Tracks with `hlsUrl` /
   `audioUrl` (live broadcast, recordings) use `<audio>` + hls.js; everything
   else uses the `YT.Player` embed. Seeking from any UI goes through the
   `islah:seek` window `CustomEvent` (`detail` = seconds), ignored for live
   (`track.isLive`). Never query `document.querySelector('audio')` as the
   primary mechanism (legacy fallback only).
2. **No audio-extraction services.** Cobalt v7 (`api.cobalt.tools`) is shut down;
   public Piped/Invidious instances return 403/525. Do NOT reintroduce `cobalt.ts`,
   `ytdl-core`, or third-party extractors. `/api/stream/[id]` intentionally returns
   metadata + official URLs only.
3. **Channel API shape.** `/api/channel/[id]` returns videos as
   `{ id, videoId, title, thumbnail, publishedAt, duration, views }`.
   The frontend reads `videoId` — keep both `id` and `videoId` populated.
   **IDs must travel in URL paths, not query strings** — Netlify drops query
   params before function invocation (proven in prod: `?id=` and `?playlistId=`
   were silently ignored). Same rule for `/api/channel/[id]/more/[token]`.
   **BETA branch: InnerTube first.** Listing tries keyless `lib/innertube.ts`
   (youtubei.js uploads playlist + stateless browse continuations) before the
   Data API fallback. Long tokens (>50 chars) are InnerTube continuations,
   short ones are Data API page tokens - the more-route branches on that.
   **Timeouts everywhere.** Client fetches must use `fetchJson()` from
   `lib/fetch-timeout.ts` (bare fetch hangs forever on stalled networks);
   server InnerTube calls race `withTimeout()` (8s) into fallbacks.
4. **Playlists.** User playlists live in `playlist-store.ts` (persist key
   `islah-playlists`), merged into the Library tabs — no separate Playlists nav
   item. The channel-YouTube-playlists section is served by
   `/api/playlists/[channel]` (Data API) + `/api/playlist-items/[id]`
   (InnerTube first, Data API fallback). The list is server-rendered
   (`library.astro` passes initial data to the island) so it can
   never hang on a client fetch; the client effect only runs as fallback.
5. **Channels.** Registry in `lib/channels.ts`, active channel in
   `channel-store.ts` (persist key `islah-channel`). Home/Search/Library all
   follow the active channel. Sidebar shows the switcher; Android opens the
   sidebar as a drawer (`#mobile-drawer` in the layout).
6. **Catalog pagination.** YouTube caps pages at 50 items: initial load fetches
   `INITIAL_PAGES` (100 videos), "more" chunks fetch `MORE_PAGES` (200) via
   `/api/channel/[id]/more/[token]` (`getPlaylistVideosPaged` in `lib/youtube.ts`).
7. **Stopping playback** uses the `stop()` store action (clears `currentTrack`).
   `AudioPlayer` pauses + seeks to 0 on null track — never `stopVideo()`, which can
   fire ENDED and auto-advance the queue (the ENDED handler is guarded on
   `currentTrack` for the same reason).
8. **Live (islahbd.com).** Status via `/api/live` (proxies
   `api.islahbd.com/api/live/status/`); HLS via `/api/hls` proxy fallback.
   Live button lives in the Home hero (`page.tsx`); live tracks use
   `id: 'live'` / `'live-recording'` with `isLive` set for real broadcasts.
9. **Netlify (BETA: Astro).** `netlify.toml` publishes `dist/`; SSR/API run as
   functions via `@astrojs/netlify`. Never add manual `/api/*` redirects, and
   never re-add the Next.js plugin on this branch.

## Conventions

- Styling: Tailwind with brand tokens (`ink-*`, `brand`, `gold`, `mist`) defined in
  `tailwind.config.js`; shared helpers (`.glass`, `.shimmer`, `.eq-bar`, `.clamp-2`,
  `.safe-bottom`) in `src/styles/globals.css`. Keep the golden theme.
- **Theming rule.** All colors must go through the token system, which resolves
  via CSS variables with `html.light` overrides. Never hardcode theme colors in
  components — the only exceptions are elements pinned to dark surfaces:
  the gold `إ` marks on dark bronze tiles (`text-[#E7C55A]`) and text/borders
  on black photo overlays (`text-[#FFFFFF]`, `border-[#FFFFFF]/20`). Theme state lives in
  `theme-store.ts` (persist key `islah-theme`); `<html>` gets `suppressHydrationWarning`
  for the pre-paint init script.
- Layout: desktop `Sidebar`, mobile (`md:hidden`) `BottomNav`. Page bottom padding
  must clear the floating player: `pb-44 md:pb-36`.
- Client components that touch the stores or `window` need `'use client'`.
- Secrets: never commit `.env.local` (gitignored). Mirror new env vars in
  `.env.example` and document them in `README.md`.
- Standing rules from the user (always follow, no need to ask):
  - **Always update `SPEC.md` and `AGENTS.md`** whenever behavior,
    architecture, APIs, or conventions change.
  - **Commit and push to origin without asking** after verified work.
- Commits: concise imperative messages.

## Gotchas

- PowerShell 5.1 is the shell: no `&&`, no `head`; use `;` and
  `Select-Object -First/-Last`. Background jobs don't persist between tool calls —
  use `Start-Process ... -WindowStyle Hidden` for servers and kill with
  `Get-Process -Name node | Stop-Process`.
- Non-ASCII (Bengali) titles may render garbled in PowerShell output — that's a
  console encoding artifact, not a data bug.
- `Player.tsx` and `FloatingPlayer.tsx` are unused legacy components; the active
  player UI is `Player/MiniPlayer.tsx` + `AudioPlayer.tsx`.
