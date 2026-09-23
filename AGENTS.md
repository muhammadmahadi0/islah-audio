# AGENTS.md — AI Coding Agent Guide for Islah Audio

This file orients AI coding agents working in this repo. Read it before making changes.

## Commands

- `npm run dev` — dev server, port 4321 (no env setup needed — fully keyless)
- `npm run build` — production build (must pass)
- `npm run preview` — preview the built output locally
- No linter is configured

## Architecture (do not break these contracts) — BETA Astro layout

0. **Astro, not Next.** Pages live in `src/pages/*.astro`, API in
   `src/pages/api/**` as `APIRoute` handlers, shell in `src/layouts/`.
   Interactive UI stays React islands (`client:only="react"`). No `next/*`
   imports anywhere. Env keys read as
   `process.env.X || import.meta.env.X` (dev only populates the latter).

1. **Playback = hidden YouTube embed + hidden `<audio>` for streams.**   The YT engine lives in `lib/yt-engine.ts` (single player, video/audio
   modes) and is mounted by MiniPlayer in a node that must
   NEVER unmount — not mid-track, not on stop, not ever. MiniPlayer has NO
   `if (!currentTrack) return null` early-return; both the YT mount node and
   the whole component stay mounted and toggle via CSS visibility, so the
   iframe (and its buffered stream) survives stop/replay and replay is
   instant. The single video frame renders artwork for stream/live tracks
   while the embed idles hidden. If the iframe ever detaches anyway, the
   track effect rebinds a fresh player. `AudioPlayer.tsx` owns only
   the `<audio>`/hls.js stream engine. Seeking from any UI goes through the
   `islah:seek` window `CustomEvent` (`detail` = seconds), ignored for live
   (`track.isLive`). `AudioPlayer.tsx` also holds the Screen Wake Lock while
   `isPlaying` (released on pause/stop, re-requested on tab-visible).
   Lecture loads request 144p `suggestedQuality` up front (audio-first) —
   never load-then-`setPlaybackQuality`, which rebuffers.
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
   **Fully keyless (Flow-style).** ALL listing goes through `lib/innertube.ts`
   (youtubei.js: uploads playlist + stateless browse continuations, channel
   Playlists tab, `getBasicInfo` for single videos). There is no Data API
   key, no quota, no `lib/youtube.ts` — it was deleted. `total` is always
   null (InnerTube exposes no exact count — UI falls back to loaded count).
   The more-route accepts InnerTube continuations only.
   **Continuation tokens are client-wrapped.** Raw InnerTube tokens contain
   `%`, which 404s Astro-on-Netlify once the client percent-encodes them into
   the path — so routes emit `toClientToken()` (`it1_` + base64url) and the
   more-route unwraps with `fromClientToken()` (`lib/innertube.ts`). Short
   Data API tokens pass through untouched.
   **Timeouts everywhere.** Client fetches must use `fetchJson()` from
   `lib/fetch-timeout.ts` (bare fetch hangs forever on stalled networks);
   server InnerTube calls race `withTimeout()` (8s) into error responses.
4. **Playlists.** User playlists live in `playlist-store.ts` (persist key
   `islah-playlists`), merged into Library — no separate Playlists nav
   item, and NO Queue tab (the playback queue lives in the expanded
   player's Up-next dropdown). The channel-YouTube-playlists section is served by
   `/api/playlists/[channel]` (InnerTube Playlists tab) + `/api/playlist-items/[id]`
   (InnerTube). The list is server-rendered
   (`library.astro` passes initial data to the island) so it can
   never hang on a client fetch; the client effect only runs as fallback.
   The Sidebar switcher reads `/api/channel/[id]/meta` (name + avatar only),
   never the full listing.
5. **Channels.** Registry in `lib/channels.ts`, active channel in
   `channel-store.ts` (persist key `islah-channel`). Home/Search/Library all
   follow the active channel. Sidebar shows the switcher; Android opens the
   sidebar as a drawer (`#mobile-drawer` in the layout).
6. **Catalog pagination.** InnerTube pages uploads at ~100 videos: initial
   load fetches the first page, "more" chunks fetch 2 continuation pages
   (~200 videos) via `/api/channel/[id]/more/[token]`.
7. **Stopping playback** uses the `stop()` store action (clears `currentTrack`).
   `AudioPlayer` pauses + seeks to 0 on null track — never `stopVideo()`, which can
   fire ENDED and auto-advance the queue (the ENDED handler is guarded on
   `currentTrack` for the same reason).
8. **Live (islahbd.com).** Status via `/api/live` (proxies
   `api.islahbd.com/api/live/status/`); HLS via `/api/hls` proxy fallback.
   Live button lives in the Home hero (`views/HomeView.tsx`); live tracks use
   `id: 'live'` / `'live-recording'` with `isLive` set for real broadcasts.
9. **Netlify (BETA: Astro).** `netlify.toml` publishes `dist/`; SSR/API run as
   functions via `@astrojs/netlify`. Never add manual `/api/*` redirects, and
   never re-add the Next.js plugin on this branch.
10. **Shareable links.** Every video is addressable at `/watch/[videoId]`
   (`src/pages/watch/[id].astro` fetches SSR metadata + OG tags through
   `lib/video.ts`, `views/WatchView.tsx` island auto-plays on open). Share via
   `lib/share.ts` (`components/ShareButton.tsx`: dropdown menu with
   WhatsApp/Telegram/Facebook/X/Copy-Link/More-apps, fixed-positioned,
   `side="right"` on the desktop transport; watch page uses explicit
   `shareNative()` + `copyLink()` buttons with a WhatsApp/Telegram/Facebook/X fallback menu
   via `shareTargets()`). Same rule as APIs: the video ID travels in the
   URL path, never a query string.
11. **Open-IslahBD button (`#islahbd-btn` in `Layout.astro`).** The app
   registers the `islahbd://` custom scheme (`open/<section>/<token>` paths —
   same as the owner's DeepLinkRedirect). Fire `islahbd://open` on iOS /
   an `intent://open` scheme-intent on Android with `S.browser_fallback_url`
   (native store fallback, no JS timer — timers race installed users to the
   store). iOS gets a guarded 2s App Store fallback (blur/pagehide/visibility
   cancel). Never go back to universal-link navigation for this button.
   The same flow lives in `lib/open-app.ts` for React callers (Watch page);
   keep both in sync.

## Conventions

- Styling: Tailwind with brand tokens (`ink-*`, `brand`, `gold`, `mist`) defined in
  `tailwind.config.js`; shared helpers (`.glass`, `.liquid-glass`, `.liquid-chip`,
  `.liquid-input`, `.liquid-gold`, `.islahbd-open-btn`, `.shimmer`, `.eq-bar`, `.clamp-2`,
  `.safe-bottom`) in `src/styles/globals.css`. Keep the golden theme.
  The whole site is liquid-glass iPhone style: floating top bar, sidebar pill,
  chips pill, cards, inputs, and both player sheets all use the glass helpers
  (with specular edge + gloss spans); body has a fixed ambient aura + blobs
  behind content. The sidebar Liquid Glass toggle row switches to flat Material 3
  (`design-store.ts`, persist key `islah-design`, `material` class on `<html>`):
  glass → solid tonal surfaces, blurs/sheen spans/ambient blobs off via the
  `html.material` overrides. Default is device-aware (`defaultDesignMode()`:
  liquid on iOS + desktop, material on other mobile) — the pre-paint script in
  `Layout.astro` mirrors it, keep both in sync. Animations are CSS-only
  (`animate-fade-up`/`.shimmer`/`.eq-bar` in `globals.css` + tailwind config) —
  do NOT reintroduce framer-motion. hls.js must stay dynamically imported in
  `AudioPlayer.tsx` (never a static import — it would re-bloat the initial
  bundle by ~500KB). New glass surfaces must degrade under it (use the
  helpers, keep sheens `pointer-events-none` direct children of `.liquid-glass`). Keep blur radii small and scrolling smooth: no
  `background-attachment: fixed`, no `AnimatePresence popLayout` on lists,
  `.cv-card`/`.cv-row` on cards/rows, ambient blobs `contain: strict`.
- **Theming rule.** All colors must go through the token system, which resolves
  via CSS variables with `html.light` overrides. Never hardcode theme colors in
  components — the only exceptions are elements pinned to dark surfaces:
  the gold `إ` marks on dark bronze tiles (`text-[#E7C55A]`) and text/borders
   on black photo overlays (`text-[#FFFFFF]`, `border-[#FFFFFF]/20`). Theme state lives in
   `theme-store.ts` (persist key `islah-theme`); `Layout.astro` applies the saved
   theme + design mode via a pre-paint inline script to avoid flashes.
- Layout: desktop `Sidebar`, mobile (`md:hidden`) `BottomNav`. Page bottom padding
  must clear the floating player: `pb-44 md:pb-36`.
- Client components that touch the stores or `window` must be React islands
  (`client:only="react"` in the `.astro` shell).
- Secrets: no env vars needed at all (fully keyless). Never commit local
  env files if you create any for experiments.
- Standing rules from the user (always follow, no need to ask):
  - **Always update `SPEC.md`, `AGENTS.md`, and `README.md`** whenever behavior,
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
- Gotcha archive: `Player.tsx` / `FloatingPlayer.tsx` (Next.js era) are long gone;
  the active player UI is `Player/MiniPlayer.tsx` + `AudioPlayer.tsx`.
  `piped-service.ts` / `peertube.ts` are dead code (nothing imports them) —
  do not wire them back in.
