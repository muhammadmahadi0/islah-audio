/**
 * Catalog auto-update: the site refreshes itself when the upstream APIs
 * gain new content — no reload, no lost scroll/filter/playback.
 *
 * - IslahBD catalogs (boyan/shorts/hamdnaat) change when editors publish:
 *   poll every 5 min.
 * - YouTube channel listings change slower: poll the first page every
 *   10 min (Search only merges the first page lightly; full reindex stays
 *   mount/channel-change only so phones don't re-pull the whole catalog).
 * - Every poll is SILENT (no skeletons/spinners): fresh items merge at the
 *   top, removed items drop, order stays newest-first, playback untouched.
 * - Polls also run on tab-visible + SPA page-load so returning users catch
 *   up instantly. In-flight refreshes are skipped, never stacked.
 */

export const ISLAHBD_REFRESH_MS = 5 * 60 * 1000;
export const CHANNEL_REFRESH_MS = 10 * 60 * 1000;

/**
 * Run `cb` on an interval AND on tab-visible + Astro SPA page-load.
 * Returns a cleanup. `cb` must be idempotent — visibility + page-load can
 * fire close together and the helper does not de-dupe by itself.
 */
export function setupAutoRefresh(cb: () => void, ms: number): () => void {
  if (typeof window === 'undefined') return () => {};
  const id = window.setInterval(cb, ms);
  const onVis = () => {
    if (document.visibilityState === 'visible') cb();
  };
  const onPage = () => cb();
  document.addEventListener('visibilitychange', onVis);
  document.addEventListener('astro:page-load', onPage);
  return () => {
    window.clearInterval(id);
    document.removeEventListener('visibilitychange', onVis);
    document.removeEventListener('astro:page-load', onPage);
  };
}

/** Merge a fresh newest-first list over the current one, keyed by `id`. */
export function mergeNewestFirst<T>(prev: T[], fresh: T[], key: (t: T) => string | number): T[] {
  if (fresh.length === 0) return prev;
  const prevIds = new Set(prev.map(key));
  const incoming = fresh.filter((t) => !prevIds.has(key(t)));
  if (incoming.length === 0) {
    // Nothing new — but drop items the upstream removed (keeps deletes).
    if (fresh.length === prev.length) return prev;
    const freshIds = new Set(fresh.map(key));
    const pruned = prev.filter((t) => freshIds.has(key(t)));
    return pruned.length === prev.length ? prev : pruned;
  }
  const freshIds = new Set(fresh.map(key));
  const kept = prev.filter((t) => freshIds.has(key(t)));
  return [...incoming, ...kept];
}
