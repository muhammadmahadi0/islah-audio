# AGENTS.md — AI Coding Agent Guide for IslahBD Web

This file orients AI coding agents working in this repo. Read it before making changes.

## Commands (Bun — Node-compatible runtime + package manager)

- `bun install` — install deps (Bun 1.4+, hoisted linker — see below)
- `bun run dev` — dev server, port 4321 (no env setup needed — fully keyless)
- `bun run build` — production build (must pass)
- `bun run preview` — preview the built output locally
- No linter is configured
- **Bun linker MUST stay `hoisted`.** Bun's default isolated linker lays
  `node_modules` out as directory junctions (symlinks) on Windows; the
  Netlify/Vercel adapters' file-tracer (`@vercel/nft` via `copyFilesToFolder`)
  re-symlinks traced deps into the function folder, and symlink creation
  needs admin/Developer Mode here → every local build dies with
  `EPERM: operation not permitted, symlink`. `bunfig.toml`
  (`[install] linker = "hoisted"`) lays out real directories, so the
  adapter copies files instead. Never delete that file or switch the linker
  back. (Host builds on Vercel/Linux are unaffected either way.)

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
   track effect rebinds a fresh player. Navigation never interrupts playback:
   `Layout.astro` uses Astro's `<ClientRouter />` (SPA page swaps) +
   `transition:persist` DIRECTLY on both player islands (the documented
   persistent-island pattern — never a wrapper div: the same
   `<astro-island>` element with its live React root + iframe/`<audio>`
   nodes moves into the new page), so the iframe / `<audio>` nodes survive
   Home/Search/Library/Boyan/Hamd-Naat changes; the
   player store persists track + queue + volume (`islah-player`) so even a
   hard reload restores the mini-player paused (autoplay stays off —
   browsers block it). Sidebar/BottomNav active states listen to
   `astro:page-load` since islands aren't remounted on SPA nav.
   The video toggle (`MiniPlayer.toggleVideo`) must NEVER load/cue — it
   only flips visibility + quality on the live player with the position
   captured first (continuity guaranteed); it is disabled until the engine
   reports ready. `playPrevious` past 3s seeks the engines to 0 via
   `islah:seek` (audio always follows the bar). Player transport buttons
   (toggle, play/pause, prev/next) carry `data-no-ripple` so the droplet
   effect never injects nodes inside the player during playback.
   **View-transition gotcha:** the ClientRouter replaces `<html>` attributes
   from the incoming SSR HTML on every swap, wiping the `light`/`material`
   classes — so `Layout.astro` re-applies the saved theme + design from
   localStorage on `astro:after-swap` (same-document listener, registered
   once). Never rely on `<html>` classes surviving navigation. `AudioPlayer.tsx` owns only
   the `<audio>`/hls.js stream engine. Seeking from any UI goes through the
   `islah:seek` window `CustomEvent` (`detail` = seconds), ignored for live
   (`track.isLive`). `AudioPlayer.tsx` also holds the Screen Wake Lock while
   `isPlaying` (released on pause/stop, re-requested on tab-visible).
   Lecture loads request 144p `suggestedQuality` up front (audio-first) —
   never load-then-`setPlaybackQuality`, which rebuffers. Autoplay can be
   browser-blocked (direct /watch visits): MiniPlayer handles UNSTARTED by
   clearing the spinner and arms an 8s play watchdog on every autoplay load
   that reconciles to paused-cue if PLAYING/BUFFERING never arrives
   (PLAYING/CUED clear it; unmount clears it). Downloads are MP3 recordings
   only (`track.audioUrl`, non-HLS): MiniPlayer fetches as blob with a
   direct-open fallback; the button is disabled with a tooltip for YouTube
   embeds and live HLS — never add extraction to support them.
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
   `channel-store.ts` (persist key `islah-channel`). Each channel has its
   OWN page at `/channel/[id]` (`src/pages/channel/[id].astro` +
   `views/ChannelView.tsx` — the full listing: hero, filters/sorts, grid,
   Show-more; unknown IDs 404 to Home). Home (`views/HomeView.tsx`) is
   buttons-only: feature cards + the two channel buttons (`/channel/[id]`
   links that also set the store). The channel PAGE syncs the store from
   the URL so Search/Library follow; the sidebar switcher navigates to
   `/channel/[id]` when already on a channel page (SPA `navigate()`,
   playback uninterrupted). Sidebar shows the switcher; Android opens the
   sidebar as a drawer (`#mobile-drawer` in the layout). Sidebar nav is
   Home/Search/Library/Boyan/Hamd-Naat/Shorts/More. BottomNav is a SEPARATE
   5-slot bar (Home / Live-action / Boyan / Family / More — More LINKS to
   `/more` hub page, never a dropdown) — do not mirror the sidebar there;
   keep both lists' i18n keys (`nav*` in `lib/i18n.ts`) in sync.
7a. **More hub (`/more`).** `MoreView` repeats the home-page buttons (Live
   action + Search/Library/Boyan/Hamd-Naat/Shorts links) plus the new
   Islamic buttons (Family / Amal / Dua / Calendar / Wazifa / Durood →
   `/family`, `/amal`, `/dua`, `/calendar`, `/wazifa`, `/durood`). Family
   is the full page (`FamilyView`: translated welcome/mission/applications/
   connect/social via `family*` keys, `.family-title` green in light; Learn
   More expands the full Hazrat biography inline from
   `lib/family-profile.ts` — source is the "হযরতের পরিচিতি" modal on
   `islahbd.github.io/Islah`, body kept verbatim Bengali, headings via
   i18n).
   The other five Islamic pages are
   placeholders for now (shared `FeatureComingView`: icon + title +
   Coming-soon badge, back-to-More link) — buttons + routes exist, real
   functions come later. Sidebar has a More item too; BottomNav highlights
   More on any hub page (`MORE_PATHS`).
6. **Boyan (IslahBD MP3s).** Catalog in `lib/boyan.ts` (types + upstream
   fetch + `toBoyanTrack` mapping + duration/date helpers), served by
   `/api/boyan` (proxies `api.islahbd.com/api/audios/` + `/api/categories/`,
   5-min CDN cache, no pagination/search upstream — filter client-side).
   `/boyan` page renders `views/BoyanView.tsx` (search, category chips,
   play, save-to-playlist). Tracks use `id: 'boyan-<id>'` with a direct
   `   audioUrl` and empty `videoId` (stream engine + download button pick them
   up automatically; share button correctly absent).
7. **Hamd-Naat (IslahBD hamd & naat).** Catalog in `lib/hamdnaat.ts` (types +
   upstream fetch + `toHamdNaatTrack` mapping + date helper), served by
   `/api/hamdnaat` (proxies `api.islahbd.com/api/nasheeds/`, 5-min CDN cache,
   no pagination/search upstream — filter client-side). `/hamdnaat` page
   renders `views/HamdNaatView.tsx` (search, All/Audio/Video chips, play,
   save-to-playlist, share on video rows). Tracks use `id: 'hamdnaat-<id>'`:
   `audio` items carry a direct `audioUrl` (stream engine + download),
   `video` items carry a `youtubeId` (embed + `/watch` share link). Nav is
   Home/Search/Boyan/Hamd-Naat/Library/Shorts — keep Sidebar in sync
   (BottomNav has its own 4-slot layout, see §5).
7b. **Shorts (IslahBD short clips).** Catalog in `lib/shorts.ts` (types +
   upstream fetch + `toShortTrack` mapping + date helper), served by
   `/api/shorts` (proxies `api.islahbd.com/api/clips/`, 5-min CDN cache,
   no pagination/search upstream — filter client-side). `/shorts` page
   renders `views/ShortsView.tsx` (search, All/Audio/Video chips, play,
   save-to-playlist, share on video rows). Tracks use `id: 'short-<id>'`:
   `audio` items carry a direct `audioUrl` (stream engine + download),
   `video` items carry a `youtubeId` (embed + `/watch` share link). Sidebar
   nav item (Zap icon); also inside the mobile More card.
7c. **Catalog auto-update.** Listings refresh silently when the upstream
   gains content — no reload, no skeletons. Boyan/Shorts/Hamd-Naat poll
   every 5 min, Home + Search refresh the channel first page every 10 min
   (Search skips while its full index runs). All via
   `setupAutoRefresh`/`mergeNewestFirst` in `lib/auto-refresh.ts` (poll +
   tab-visible + `astro:page-load`, idempotent merge keyed by id, in-flight
   guard). IslahBD APIs are CDN-cached 5 min, channel pages 10 min —
   keep those windows aligned with the poll intervals when touching them.
7d. **Home feature hub + channel buttons.** `HomeView` renders the scholar
   banner FIRST (`components/ScholarBanner.tsx`, `.scholar-banner` +
   `-cream`/`-dark`/`-flat` variants in `globals.css` — cream in light,
   liquid-glass gold in dark, flat token solid in Material; translated via
   `scholar*` keys; Cinzel + Playfair Display loaded in `Layout.astro`),
   then the prayer
   countdown card FIRST (`components/PrayerTimer.tsx`, logic in
   `lib/prayer.ts` — ported from `pray-bd`: Aladhan Hanafi times, IP
   geolocation, 1s countdown, special morning periods, −1-day Hijri fix;
   `prayer*` i18n keys), then a card-style grid — one liquid-glass card per
   feature (Live action + Search/Library/Boyan/Hamd-Naat/Shorts links) with
   icon + title + subtitle from `lib/i18n.ts` (`featuresTitle`/`feat*Sub`);
   directly below, the two `CHANNELS` as large switch buttons (avatar via
   `/api/channel/[id]/meta`, name, handle, active gold dot). Switching
   sets `channel-store` and the catalog refetches via the existing effect.
   Keep hub cards + channel buttons in sync with Sidebar/BottomNav items
   when features are added/removed.
8. **Catalog pagination.** InnerTube pages uploads at ~100 videos: initial
   load fetches the first page, "more" chunks fetch 2 continuation pages
   (~200 videos) via `/api/channel/[id]/more/[token]`. Global sorts in
   `HomeView` (Most viewed / Oldest) background-index ALL remaining chunks
   (deduped progressive append, same pattern as Search) so they rank the
   whole catalog, never just the loaded page; manual Show-more hides under
   those sorts. Newest is native API order (no extra fetch). Oldest is the
   exact reverse of that order — never date-parse `publishedAt` (InnerTube
   returns relative labels like "6 days ago", so `new Date()` yields NaN
   and the sort silently no-ops).
9. **Stopping playback** uses the `stop()` store action (clears `currentTrack`).
   `AudioPlayer` pauses + seeks to 0 on null track — never `stopVideo()`, which can
   fire ENDED and auto-advance the queue (the ENDED handler is guarded on
   `currentTrack` for the same reason).
10. **Live (islahbd.com).** Status via `/api/live` (proxies
   `api.islahbd.com/api/live/status/` → `LiveStatus` in `lib/live.ts`,
   includes `location` venue name for live + recording); HLS via `/api/hls`
   proxy fallback. Live button lives in the Home hero (`views/HomeView.tsx`);
   "Live now" banner shows title • location • listeners, offline hero shows
   "Last live • location". Live tracks use `id: 'live'` / `'live-recording'`
   with `isLive` set for real broadcasts; `Track.location` carries the venue
   into MiniPlayer (title block + Up-next header, MapPin icon).
11. **Hosting (beta = Vercel ONLY, master = Netlify ONLY).** `astro.config.mjs`
   picks the adapter by env: `VERCEL` set → `@astrojs/vercel`, otherwise
   `@astrojs/netlify`. `netlify.toml` has `ignore = 'test "$BRANCH" != "master"'`
   so Netlify skips every non-master branch (incl. beta); Vercel's production
   branch is `beta` with other branches ignored. Never add manual `/api/*`
   redirects, and never re-add the Next.js plugin on either branch.
12. **Shareable links.** Every video is addressable at `/watch/[videoId]`
   (`src/pages/watch/[id].astro` fetches SSR metadata + OG tags through
   `lib/video.ts`, `views/WatchView.tsx` island auto-plays on open). Share via
   `lib/share.ts` (`components/ShareButton.tsx`: dropdown menu with
   WhatsApp/Telegram/Facebook/X/Copy-Link/More-apps, fixed-positioned,
   `side="right"` on the desktop transport; watch page uses explicit
   `shareNative()` + `copyLink()` buttons with a WhatsApp/Telegram/Facebook/X fallback menu
   via `shareTargets()`). Same rule as APIs: the video ID travels in the
   URL path, never a query string.
13. **Open-IslahBD button (`#islahbd-btn` in `Layout.astro`).** The app
   registers the `islahbd://` custom scheme (`open/<section>/<token>` paths —
   same as the owner's DeepLinkRedirect). Android fires a scheme intent WITH
   a native `S.browser_fallback_url` PLUS a guarded 2.5s safety timer
   (Firefox / WebViews ignore the intent extras and would strand the user);
   iOS fires the scheme through a hidden iframe (never a bare location
   assignment — Safari navigates to an error state on failure and stalls
   the fallback) with a guarded 1.8s App Store fallback. Every timer is
   cancelled on hide/blur/pagehide, so installed users never race to the
   store. Never go back to universal-link navigation for this button.
   The same flow lives in `lib/open-app.ts` for React callers (Watch page);
   keep both in sync.

## Conventions

- Styling: Tailwind with brand tokens (`ink-*`, `brand`, `gold`, `mist`) defined in
  `tailwind.config.js`; shared helpers (`.glass`, `.liquid-glass`, `.liquid-chip`,
  `.liquid-input`, `.liquid-gold`, `.islahbd-open-btn`, `.shimmer`, `.eq-bar`, `.clamp-2`,
  `.safe-bottom`) in `src/styles/globals.css`. Keep the golden theme.
  Gold outline site-wide: `.liquid-glass`, `.glass`, and `.liquid-chip`
  all carry a gold (`#C9A84C`-tinted) border in every theme incl. Material,
  and every `button`/`a`/`input` gets a gold `:focus-visible` outline.
  The whole site is liquid-glass iPhone style: floating top bar, sidebar pill,
  chips pill, cards, inputs, and both player sheets all use the glass helpers
  (with specular edge + gloss spans); body has a fixed ambient aura + blobs
  behind content. The Site Settings dropdown in the sidebar holds the Liquid
  Glass toggle + Theme + Language rows (gear header rotates 135° + chevron
  flips on open, inline grid-rows expand INSIDE the sidebar flow — never a
  floating/fixed panel, which detaches from scrolling and needs fragile
  anchor tracking). The sidebar `<aside>` is the scroll container
  (`overflow-y-auto` + `overscroll-contain` + `min-h-0`); thin branded
  scrollbars in `globals.css`. The Liquid Glass row switches to flat The Liquid Glass row switches to flat
  Material 3
  (`design-store.ts`, persist key `islah-design`, `material` class on `<html>`):
  glass → solid tonal surfaces, blurs/sheen spans/ambient blobs off via the
  `html.material` overrides. Default is device-aware (`defaultDesignMode()`:
  liquid on iOS + desktop, material on other mobile) — the pre-paint script in
  `Layout.astro` mirrors it, keep both in sync. Whole-site i18n lives in
  `language-store.ts` (persist key `islah-lang`, `en`/`bn` — `setLang`
  dispatches a same-document `islah:lang` event) + `lib/i18n.ts` dictionary
  with count/sentence helpers (`videosCount`, `resultsCount`, …) and
  locale formatters (`fmtViews`, `fmtPublished`, `fmtDate`). EVERY UI chrome
  string in every view, the player, both menus, and the sidebar/bottom-nav
  goes through `t(lang)` — video titles/descriptions stay as-is (API data).
  The SSR top-bar header is translated by a vanilla script in `Layout.astro`
  (element ids `top-search-input`, `top-search-btn`, `menu-btn`,
  `menu-btn-mobile`, `islahbd-btn`, `islahbd-btn-label`) reading the
  persisted choice on load + `astro:after-swap`, and live on `islah:lang` +
  `astro:page-load`. `Layout.astro` pre-paint sets `<html lang>` from the
  persisted choice (first load + `astro:after-swap`). First visit with no
  saved theme follows the OS scheme (`prefers-color-scheme` in
  `defaultTheme()` / pre-paint — keep both in sync). The theme toggle is a
  sidebar row (`ThemeToggle variant="sidebar"`, explicit `setTheme` —
  no floating variant is rendered anywhere). Animations are CSS-only
  (`animate-fade-up`/`.shimmer`/`.eq-bar`/`.ripple-ink` in `globals.css` + tailwind config) —
  do NOT reintroduce framer-motion. Site-wide press feedback is the water-drop
  ripple (delegated `pointerdown` in `Layout.astro` blooms `.ripple-ink` inside
  any `button`/`a`; opt out with `data-no-ripple`; menus render fixed so host
  `overflow:hidden` never clips them). The floating theme toggle is rebuilt
  around its on-click wrap (`.theme-wrap` bloom in `globals.css`, persisted
  island `islah-theme-toggle` so a mid-flight wrap survives SPA swaps; it
  opts out of the droplet via `data-no-ripple` and skips the overlay under
  `prefers-reduced-motion`). The sidebar Liquid Glass row has the same
  tap-bloom pattern (`.design-wrap` in `globals.css`) with a liquid variant —
  glassy blob (blur + saturation + gloss sheen + gold shimmer) wobbling
  through organic border-radius shapes; turning OFF plays the SAME bloom
  backward (`.design-wrap-reverse` retract keyframes, design flips early to
  reveal underneath). Desktop sidebar collapse is a
  max-width + slide transition on `#sidebar-wrap` (`body.sb-hidden`, persisted
  `islah-sidebar-hidden`); the mobile drawer slides via `#mobile-drawer.open`.
  Layout listeners must be document-delegated + guarded (`__islahLayoutWired`)
  — direct `getElementById` bindings die on the next SPA swap. hls.js must stay dynamically imported in
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
