import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Share2,
  Check,
  Link2,
  MessageCircle,
  Send,
  Facebook,
  Twitter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { shareNative, copyLink, shareTargets } from '@/lib/share';

const MENU_WIDTH = 208; // w-52
const MENU_GAP = 1;

/**
 * Share button with a dropdown menu: WhatsApp / Telegram / Facebook / X /
 * Copy Link / More apps (native sheet). Opens upward or downward based on
 * viewport space (or rightward when `side="right"`), and renders fixed so
 * it escapes overflow-hidden list containers. Callers must stopPropagation
 * when nested inside a play-on-click row (handled internally for all menu
 * clicks).
 */
export default function ShareButton({
  videoId,
  title,
  className,
  iconSize = 16,
  align = 'right',
  side = 'auto',
}: {
  videoId: string;
  title?: string;
  className?: string;
  iconSize?: number;
  /** Which edge of the button the menu aligns to (vertical mode). */
  align?: 'left' | 'right';
  /** 'right' flies the menu out to the right of the button. */
  side?: 'auto' | 'right';
}) {
  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const buttonRef = useRef<HTMLButtonElement>(null);

  const targets = useMemo(
    () => shareTargets(videoId, title),
    [videoId, title]
  );

  const canNativeShare =
    typeof navigator !== 'undefined' && 'share' in navigator;

  // Close the fixed menu on scroll/resize — it can't track the button.
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menu) {
      setMenu(null);
      return;
    }
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    if (side === 'right') {
      // Fly out to the right of the button, vertically centered on it.
      // Flip to the left side when there is no room on the right.
      const menuH = 264;
      const right = rect.right + MENU_GAP;
      const left =
        right + MENU_WIDTH <= window.innerWidth - 8
          ? right
          : Math.max(8, rect.left - MENU_WIDTH - MENU_GAP);
      const top = Math.min(
        Math.max(8, rect.top + rect.height / 2 - menuH / 2),
        Math.max(8, window.innerHeight - menuH - 8)
      );
      setMenu({ left, top });
      return;
    }
    // Rough menu height: 6 rows ≈ 250px. Flip upward when space below is short.
    const spaceBelow = window.innerHeight - rect.bottom;
    const up = spaceBelow < 270 && rect.top > spaceBelow;
    const left = Math.min(
      Math.max(8, align === 'left' ? rect.left : rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - 8
    );
    setMenu({
      left,
      top: up ? rect.top - 264 - MENU_GAP : rect.bottom + MENU_GAP,
    });
  };

  const closeMenu = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setMenu(null);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyLink(videoId);
    setCopyState(ok ? 'copied' : 'failed');
    setTimeout(() => setCopyState('idle'), 1600);
  };

  const handleMoreApps = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenu(null);
    await shareNative(videoId, title);
  };

  const rowClass =
    'flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors';

  return (
    <span className="relative inline-flex shrink-0">
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        aria-expanded={menu !== null}
        aria-label="Share"
        title="Share"
        className={cn(
          'shrink-0 rounded-full flex items-center justify-center text-white transition-all',
          className
        )}
      >
        <Share2 size={iconSize} />
      </button>
      {menu && (
        <>
          <button
            aria-label="Close share menu"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={closeMenu}
          />
          <span
            className="fixed z-50 w-52 overflow-hidden rounded-2xl liquid-glass py-1.5 animate-fade-up"
            style={{ top: menu.top, left: menu.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <a
              href={targets.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenu(null)}
              className={rowClass}
            >
              <MessageCircle size={16} className="text-green-400 shrink-0" />
              WhatsApp
            </a>
            <a
              href={targets.telegram}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenu(null)}
              className={rowClass}
            >
              <Send size={16} className="text-sky-400 shrink-0" />
              Telegram
            </a>
            <a
              href={targets.facebook}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenu(null)}
              className={rowClass}
            >
              <Facebook size={16} className="text-blue-400 shrink-0" />
              Facebook
            </a>
            <a
              href={targets.x}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenu(null)}
              className={rowClass}
            >
              <Twitter size={16} className="text-mist shrink-0" />X
            </a>
            <button onClick={handleCopyLink} className={rowClass}>
              {copyState === 'copied' ? (
                <Check size={16} className="text-brand-light shrink-0" strokeWidth={3} />
              ) : (
                <Link2 size={16} className="text-mist shrink-0" />
              )}
              {copyState === 'copied'
                ? 'Copied!'
                : copyState === 'failed'
                  ? 'Copy failed'
                  : 'Copy Link'}
            </button>
            {canNativeShare && (
              <button onClick={handleMoreApps} className={rowClass}>
                <Share2 size={16} className="text-brand-light shrink-0" />
                More apps…
              </button>
            )}
          </span>
        </>
      )}
    </span>
  );
}
