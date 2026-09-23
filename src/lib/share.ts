/**
 * Shareable-link helpers. Every video is addressable at `/watch/[videoId]`,
 * so any link containing that path opens + plays that exact content.
 */

/** Absolute share URL for a video (safe to call during SSR — falls back to a path). */
export function watchUrl(videoId: string): string {
  const path = `/watch/${videoId}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
}

/** Copy text to clipboard, with a textarea fallback for older browsers. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Share a video link via the native share sheet (suggests WhatsApp and
 * other installed apps). Never falls back to clipboard — use copyLink()
 * for that. Returns 'shared' | 'dismissed' | 'unsupported'.
 */
export async function shareNative(
  videoId: string,
  title?: string
): Promise<'shared' | 'dismissed' | 'unsupported'> {
  const url = watchUrl(videoId);
  const nav = navigator as Navigator & {
    share?: (data: { title?: string; text?: string; url: string }) => Promise<void>;
  };
  if (!nav.share) return 'unsupported';
  try {
    await nav.share({ title: title || 'Islah Audio', text: title || 'Islah Audio', url });
    return 'shared';
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') return 'dismissed';
    return 'unsupported';
  }
}

/**
 * Share a video link: native share sheet when available, clipboard otherwise.
 * Kept for compact list rows (Home/Search/Library/player). The watch page
 * uses shareNative() + copyLink() as two explicit buttons instead.
 * Returns 'shared' | 'copied' | 'failed' so callers can show feedback.
 */
export async function shareVideo(videoId: string, title?: string): Promise<'shared' | 'copied' | 'failed'> {
  const result = await shareNative(videoId, title);
  if (result === 'shared' || result === 'dismissed') return 'shared';
  return (await copyLink(videoId)) ? 'copied' : 'failed';
}

/** Direct share URLs for the fallback menu when native share is unavailable. */
export function shareTargets(videoId: string, title?: string): {
  whatsapp: string;
  telegram: string;
  facebook: string;
  x: string;
} {
  const url = watchUrl(videoId);
  const text = title || 'Islah Audio';
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  };
}

/** Copy the share link to clipboard. */
export async function copyLink(videoId: string): Promise<boolean> {
  return copyText(watchUrl(videoId));
}
