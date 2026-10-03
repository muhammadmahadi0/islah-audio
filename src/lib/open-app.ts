/**
 * Open the installed IslahBD app, otherwise go to the right store.
 * Mirrors the `#islahbd-btn` handler in `Layout.astro` — keep both in sync.
 * The app registers the `islahbd://` custom scheme (`open/<section>/<token>`
 * paths, same as the owner's DeepLinkRedirect), so `islahbd://open`
 * just launches the app.
 *
 * Why this shape (bare scheme/intent assignments strand users):
 * - ALL Android browsers get the full `intent://` URL via top-level
 *   navigation (Chrome honours `S.browser_fallback_url` natively; Firefox
 *   / WebViews ignore the extras but still resolve the installed app and
 *   background the page). A hidden-iframe scheme load was tried before —
 *   it doesn't background the page cleanly, so the store timer fired even
 *   after the app opened (app + Play Store together).
 * - The intent MUST carry `category=android.intent.category.BROWSABLE` —
 *   without it Chrome can't resolve the installed app (deep-link filters
 *   require it) and drops straight to the Play Store fallback.
 * - Mobile Safari (and every other iOS browser — all WebKit) navigates to
 *   an error state on a bare `islahbd://` location assignment, which can
 *   suspend the fallback timer — so iOS fires the scheme through a hidden
 *   iframe (fails silently, page never navigates) with a guarded App Store
 *   timer.
 * - Every timer is cancelled the moment the page hides/blurs (i.e. the app
 *   actually opened), so installed users are never raced to the store.
 */

const SCHEME = 'islahbd://open';
const PACKAGE = 'com.islahbd.app';
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.islahbd.app';
const APP_STORE = 'https://apps.apple.com/us/app/islahbd/id6762509692';
const WEBSITE = 'https://www.islahbd.com/';

const ANDROID_TIMER_MS = 2500;
const IOS_TIMER_MS = 1800;

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

function androidIntentUrl(): string {
  return (
    'intent://open#Intent;scheme=islahbd;package=' +
    PACKAGE +
    ';action=android.intent.action.VIEW' +
    ';category=android.intent.category.BROWSABLE' +
    ';S.browser_fallback_url=' +
    encodeURIComponent(PLAY_STORE) +
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

interface Guard {
  cancel: () => void;
  fired: () => boolean;
}

/** Runs `fallback` after `ms` unless the page hides/blurs first (app opened).
 * Also skips when the page lost focus (app chooser showing) — without this
 * the store opened behind the app on non-Chrome browsers. */
function guardedFallback(ms: number, fallback: () => void): Guard {
  let done = false;
  const cancel = () => {
    if (done) return;
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
    try {
      const unfocused =
        typeof document.hasFocus === 'function' && !document.hasFocus();
      if (!done && !document.hidden && !unfocused) {
        done = true;
        fallback();
      }
    } finally {
      cancel();
    }
  }, ms);
  return { cancel, fired: () => done };
}

export function openIslahBDApp(): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  const ua = navigator.userAgent || '';

  if (isAndroid(ua)) {
    const goStore = () => {
      try {
        window.location.href = PLAY_STORE;
      } catch {
        // ignore — user stays on the page
      }
    };
    guardedFallback(ANDROID_TIMER_MS, goStore);
    // Every Android browser gets the intent via top-level navigation:
    // installed app opens (page backgrounds → timer cancels), missing app
    // falls to native fallback on Chrome or the guarded timer elsewhere.
    try {
      window.location.href = androidIntentUrl();
    } catch {
      goStore();
    }
    return;
  }

  if (isIOS(ua)) {
    const goStore = () => {
      try {
        window.location.href = APP_STORE;
      } catch {
        // ignore — user stays on the page
      }
    };
    guardedFallback(IOS_TIMER_MS, goStore);
    // Iframe first (silent on failure, never navigates the page away).
    fireSchemeViaIframe(SCHEME);
    return;
  }

  window.open(WEBSITE, '_blank', 'noopener');
}
