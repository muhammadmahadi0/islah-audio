/**
 * Open the installed IslahBD app, otherwise go to the right store.
 * Mirrors the `#islahbd-btn` handler in `Layout.astro` — keep both in sync.
 * The app registers the `islahbd://` custom scheme (`open/<section>/<token>`
 * paths, same as the owner's DeepLinkRedirect), so `islahbd://open`
 * just launches the app.
 */
export function openIslahBDApp(): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isiOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const playStore = 'https://play.google.com/store/apps/details?id=com.islahbd.app';
  const appStore = 'https://apps.apple.com/us/app/islahbd/id6762509692';

  if (isAndroid) {
    window.location.replace(
      'intent://open#Intent;scheme=islahbd;package=com.islahbd.app;S.browser_fallback_url=' +
        encodeURIComponent(playStore) +
        ';end'
    );
  } else if (isiOS) {
    let opened = false;
    const onVis = () => {
      if (document.hidden) opened = true;
    };
    const onHide = () => {
      opened = true;
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('blur', onHide);
    window.location.href = 'islahbd://open';
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('blur', onHide);
      if (!opened && !document.hidden) window.location.replace(appStore);
    }, 2000);
  } else {
    window.open('https://www.islahbd.com/', '_blank', 'noopener');
  }
}
