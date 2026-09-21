'use client';

/**
 * BETA branch only — small floating badge marking beta builds.
 * Non-interactive so it never blocks taps. Do not merge to master.
 */
export default function BetaBadge() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed right-3 top-3 z-50 flex items-center gap-1.5 rounded-full border border-gold/50 bg-ink-950/80 py-1 pl-2.5 pr-3 backdrop-blur"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
      </span>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold-light">
        Beta
      </span>
    </div>
  );
}
