import { useState, useEffect, useCallback } from 'react';
import { Home, Mic, Heart, MoreHorizontal, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/store/language-store';
import { t } from '@/lib/i18n';
import { usePlayerStore, type Track } from '@/store/player-store';
import { LIVE_POLL_MS, type LiveStatus } from '@/lib/live';

// Pages that belong to the More hub — the More tab stays highlighted there.
const MORE_PATHS = ['/more', '/search', '/library', '/hamdnaat', '/shorts', '/amal', '/dua', '/calendar', '/wazifa', '/durood', '/family'];

function usePath() {
  const [path, setPath] = useState('/');
  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    sync();
    // SPA navigation (ClientRouter) swaps pages without remounting islands.
    document.addEventListener('astro:page-load', sync);
    return () => document.removeEventListener('astro:page-load', sync);
  }, []);
  return path;
}

/**
 * Mobile bottom bar — very rounded floating pill (YouTube-app style).
 * Home / Live / Boyan / Family / More. Live plays the islahbd.com live
 * broadcast (or the last recording when offline) straight from the bar;
 * Family opens the Islah family hub; More goes to the `/more` hub page
 * with every section plus the Islamic buttons
 * (Amal / Dua / Calendar / Wazifa / Durood).
 */
export default function BottomNav() {
  const pathname = usePath();
  const { lang } = useLanguageStore();
  const strings = t(lang);

  const [live, setLive] = useState<LiveStatus | null>(null);

  const { playTrack, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();

  // Live status from islahbd.com (polled, same as the Home hub).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/live');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.success) setLive(data.live);
      } catch {
        // ignore — the Live button simply stays idle
      }
    };
    load();
    const id = setInterval(load, LIVE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const isLiveTrackActive =
    !!currentTrack && (currentTrack.id === 'live' || currentTrack.id === 'live-recording');

  const handleLive = useCallback(() => {
    if (!live) return;
    if (isLiveTrackActive) {
      setIsPlaying(!isPlaying);
      return;
    }
    if (live.isLive && live.streamUrl) {
      const track: Track = {
        id: 'live',
        title: live.title || 'Live Broadcast',
        thumbnail: '',
        duration: 0,
        channelName: live.speaker || 'Islah Live',
        videoId: '',
        hlsUrl: live.streamUrl,
        isLive: true,
        location: live.location || '',
      };
      playTrack(track, [track], 0);
    } else if (live.recording?.audioUrl) {
      const track: Track = {
        id: 'live-recording',
        title: live.recording.title || 'Last Live Broadcast',
        thumbnail: '',
        duration: live.recording.durationSeconds || 0,
        channelName: live.recording.speaker || 'Islah',
        videoId: '',
        audioUrl: live.recording.audioUrl,
        location: live.recording.location || '',
      };
      playTrack(track, [track], 0);
    }
  }, [live, isLiveTrackActive, isPlaying, setIsPlaying, playTrack]);

  const baseItem =
    'flex flex-col items-center gap-px rounded-full py-1 text-[9px] font-semibold transition-all';
  const activeItem =
    'text-brand-light bg-white/[0.08] ring-1 ring-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]';

  const renderIcon = (Icon: typeof Home, isActive: boolean) => (
    <Icon size={20} strokeWidth={isActive ? 2.4 : 2} fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.25 : 0} />
  );

  const moreActive = MORE_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  return (
    <nav className="bottom-nav md:hidden fixed bottom-2.5 inset-x-4 z-50 rounded-full liquid-glass safe-bottom">
      <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-14 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.12] via-transparent to-transparent" />
      <div className="relative grid grid-cols-5 px-3 py-1">
        {/* Home */}
        <a
          href="/"
          className={cn(baseItem, pathname === '/' ? activeItem : 'text-mist-dark')}
        >
          {renderIcon(Home, pathname === '/')}
          {strings.navHome}
        </a>

        {/* Live — plays the broadcast / last recording */}
        <button
          onClick={handleLive}
          disabled={!live || (!live.isLive && !live.recording)}
          aria-label={strings.live}
          className={cn(baseItem, isLiveTrackActive ? activeItem : 'text-mist-dark', 'disabled:opacity-40 relative')}
        >
          <span className="relative">
            {live?.isLive ? (
              <span className="relative flex h-5 w-5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-500 opacity-60" />
                <Radio size={20} className={isLiveTrackActive ? 'text-brand-light' : 'text-red-500'} />
              </span>
            ) : (
              <Radio size={20} strokeWidth={2} className={isLiveTrackActive ? 'text-brand-light' : undefined} />
            )}
          </span>
          {strings.live}
        </button>

        {/* Boyan */}
        <a
          href="/boyan"
          className={cn(baseItem, pathname === '/boyan' ? activeItem : 'text-mist-dark')}
        >
          {renderIcon(Mic, pathname === '/boyan')}
          {strings.navBoyan}
        </a>

        {/* Family — Islah family hub, left of More */}
        <a
          href="/family"
          aria-label={strings.navFamily}
          className={cn(baseItem, pathname === '/family' ? activeItem : 'text-mist-dark')}
        >
          {renderIcon(Heart, pathname === '/family')}
          {strings.navFamily}
        </a>

        {/* More — goes to the /more hub page */}
        <a
          href="/more"
          aria-label={strings.navMore}
          className={cn(baseItem, moreActive ? activeItem : 'text-mist-dark')}
        >
          {renderIcon(MoreHorizontal, moreActive)}
          {strings.navMore}
        </a>
      </div>
    </nav>
  );
}
