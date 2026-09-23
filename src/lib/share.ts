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
 * Share a video link: native share sheet on mobile, clipboard otherwise.
 * Returns 'shared' | 'copied' | 'failed' so callers can show feedback.
 */
export async function shareVideo(videoId: string, title?: string): Promise<'shared' | 'copied' | 'failed'> {
  const url = watchUrl(videoId);
  try {
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url: string }) => Promise<void>;
    };
    if (nav.share) {
      await nav.share({ title: title || 'Islah Audio', url });
      return 'shared';
    }
  } catch (error) {
    // User dismissed the sheet — not a failure, don't fall through to copy.
    if ((error as Error)?.name === 'AbortError') return 'shared';
  }
  return (await copyText(url)) ? 'copied' : 'failed';
}
