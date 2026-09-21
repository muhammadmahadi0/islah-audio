# AGENTS.md — AI Coding Agent Guide for Islah Audio

This file orients AI coding agents working in this repo. Read it before making changes.

## Commands

- `npm run dev` — dev server (needs `YOUTUBE_API_KEY` in `.env.local`)
- `npm run build` — production build (includes type checking; must pass)
- `npm run start -- --port <n>` — serve a production build for smoke tests
- No linter is configured (`next lint` prompts for setup — do not run it interactively)

## Architecture (do not break these contracts)

1. **Playback = hidden YouTube embed.** `src/components/AudioPlayer.tsx` owns a
   `YT.Player` and syncs it with `usePlayerStore`. Seeking from any UI goes through
   the `islah:seek` window `CustomEvent` (`detail` = seconds). Never query
   `document.querySelector('audio')` as the primary mechanism (legacy fallback only).
2. **No audio-extraction services.** Cobalt v7 (`api.cobalt.tools`) is shut down;
   public Piped/Invidious instances return 403/525. Do NOT reintroduce `cobalt.ts`,
   `ytdl-core`, or third-party extractors. `/api/stream/[id]` intentionally returns
   metadata + official URLs only.
3. **Channel API shape.** `/api/channel` returns videos as
   `{ id, videoId, title, thumbnail, publishedAt, duration, views }`.
   The frontend reads `videoId` — keep both `id` and `videoId` populated.
4. **Playlists** live in `src/store/playlist-store.ts` (zustand `persist`,
   key `islah-playlists`). Playlists UI is merged into the **Library** page tabs —
   do not add a separate Playlists nav item without asking the user. The channel's
   real YouTube playlists come from `/api/playlists` (`getChannelPlaylists` /
   `getPlaylistItems` in `lib/youtube.ts`).
5. **Stopping playback** uses the `stop()` store action (clears `currentTrack`).
   `AudioPlayer` pauses + seeks to 0 on null track — never `stopVideo()`, which can
   fire ENDED and auto-advance the queue (the ENDED handler is guarded on
   `currentTrack` for the same reason).
6. **Netlify.** `netlify.toml` uses `@netlify/plugin-nextjs`. Never add manual
   `/api/*` or `/_next/*` redirects, and never add invalid `[functions.*]` keys.

## Conventions

- Styling: Tailwind with brand tokens (`ink-*`, `brand`, `gold`, `mist`) defined in
  `tailwind.config.js`; shared helpers (`.glass`, `.shimmer`, `.eq-bar`, `.clamp-2`,
  `.safe-bottom`) in `src/app/globals.css`. Keep the emerald + gold dark theme.
- Layout: desktop `Sidebar`, mobile (`md:hidden`) `BottomNav`. Page bottom padding
  must clear the floating player: `pb-44 md:pb-36`.
- Client components that touch the stores or `window` need `'use client'`.
- Secrets: never commit `.env.local` (gitignored). Mirror new env vars in
  `.env.example` and document them in `README.md`.
- Commits: concise imperative messages. Only commit/push when the user asks.

## Gotchas

- PowerShell 5.1 is the shell: no `&&`, no `head`; use `;` and
  `Select-Object -First/-Last`. Background jobs don't persist between tool calls —
  use `Start-Process ... -WindowStyle Hidden` for servers and kill with
  `Get-Process -Name node | Stop-Process`.
- Non-ASCII (Bengali) titles may render garbled in PowerShell output — that's a
  console encoding artifact, not a data bug.
- `Player.tsx` and `FloatingPlayer.tsx` are unused legacy components; the active
  player UI is `Player/MiniPlayer.tsx` + `AudioPlayer.tsx`.
