/**
 * BETA branch only — small floating badge marking beta builds.
 * Tapping it opens the owner's WhatsApp. Do not merge to master.
 */
export default function BetaBadge() {
  return (
    <a
      href="https://wa.me/8801571174175"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact on WhatsApp (beta)"
      className="fixed right-3 top-3 z-50 flex items-center gap-1.5 rounded-full liquid-glass py-1 pl-2.5 pr-3"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
      </span>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold-light">
        Beta
      </span>
    </a>
  );
}
