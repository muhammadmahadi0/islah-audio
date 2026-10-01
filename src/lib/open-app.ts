/**
 * Open the installed IslahBD app, otherwise go to the right store.
 * Mirrors the `#islahbd-btn` handler in `Layout.astro` — keep both in sync.
 *
 * Why this shape (and why the old one stranded users):
 * - The old Android path relied ONLY on the intent's
 *   `S.browser_fallback_url` (no JS timer). That works in Chrome, but
 *   Firefox / in-app WebViews / older Samsung builds ignore the extras
 *   and just swallow the failed intent — the user ends up nowhere.
 *   Fix: keep the native intent for Chrome AND add a guarded safety timer
 *   (cancelled the moment the page hides/blurs, i.e. the app actually
 *   opened) that sends still-visible users to the Play Store.
 * - The old iOS path assigned `window.location.href = 'islahbd://open'`
 *   directly. On failure Safari navigates to an error state that can
 *   suspend/stall the fallback timer, so the App Store never opens.
 *   Fix: fire the scheme through a hidden iframe (fails silently, the
 *   page never navigates) and let the guarded timer do the fallback.
 * - The timers NEVER race installed users to the store: any sign the app
 *   opened (page hidden, pagehide, blur) cancels the fallback first.
 */

export const ISLAH_APP_SCHEME = 'islahbd://open';
export const ISLAH_ANDROID_PACKAGE = 'com.islahbd.app';
export const ISLAH_PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.islahbd.app';
export const ISLAH_APP_STORE =
  'https://apps.apple.com/us/app/islahbd/id6762509692';
export const ISLAH_WEBSITE = 'https://www.islahbd.com/';

function isAndroid(ua: string): boolean {
  return /Android/i.test(ua);
}

function isIOS(ua: string): boolean {
  if (typeof navigator === 'undefined') return /iPad|iPhone|iPod/i.test(ua);
  return (
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** Browsers with native `intent://` + `S.browser_fallback_url` support. */
function supportsIntent(ua: string): boolean {
  // Chrome / Edge / Opera / Samsung Internet honour the fallback extras.
  // Firefox Android and in-app WebViews do not — they need the timer path.
  if (/Firefox|FxiOS|Focus/i.test(ua)) return false;
  return /Chrome|CriOS|Edg|OPR|SamsungBrowser/i.test(ua);
}

function androidIntentUrl(): string {
  return (
    'intent://open#Intent;scheme=islahbd;package=' +
    ISLAH_ANDROID_PACKAGE +
    ';action=android.intent.action.VIEW' +
    ';S.browser_fallback_url=' +
    encodeURIComponent(ISLAH_PLAY_STORE) +
    ';end'
  );
}

/** Fire a custom scheme without navigating the page (fails silently). */
function fireSchemeViaIframe(scheme: string): void {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.src = scheme;
    document.body.appendChild(iframe);
    window.setTimeout(() => {
      try {
        iframe.remove();
      } catch {
        // ignore
      }
    }, 3000);
  } catch {
    // ignore — the timed store fallback below still runs
  }
}

export function openIslahBDApp(): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  const ua = navigator.userAgent || '';

  if (isAndroid(ua)) {
    let fellBack = false;
    const goStore = () => {
      if (fellBack || document.hidden) return;
      fellBack = true;
      window.location.href = ISLAH_PLAY_STORE;
    };
    const cancel = () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('blur', onHide);
    };
    const onVis = () => {
      if (document.hidden) cancel();
    };
    const onHide = () => cancel();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('blur', onHide);
    // Native fallback (Chrome) + guarded safety net (everyone else).
    const timer = window.setTimeout(goStore, 2500);
    try {
      if (supportsIntent(ua)) {
        window.location.href = androidIntentUrl();
      } else {
        fireSchemeViaIframe(ISLAH_APP_SCHEME);
      }
    } catch {
      goStore();
    }
    return;
  }

  if (isIOS(ua)) {
    let done = false;
    const cancel = () => {
      done = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('blur', onHide);
    };
    const onVis = () => {
      if (document.hidden) cancel();
    };
    const onHide = () => cancel();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('blur', onHide);
    const timer = window.setTimeout(() => {
      if (!done && !document.hidden) {
        done = true;
        window.location.href = ISLAH_APP_STORE;
      }
      cancel();
    }, 1800);
    // Iframe first (silent on failure); location assignment as the
    // belt-and-braces second attempt for iOS versions that ignore it.
    fireSchemeViaIframe(ISLAH_APP_SCHEME);
    try {
      window.location.href = ISLAH_APP_SCHEME;
    } catch {
      // iframe attempt + timer fallback still in play
    }
    return;
  }

  window.open(ISLAH_WEBSITE, '_blank', 'noopener');
}
