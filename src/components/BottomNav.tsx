import { useState, useEffect, useCallback } from 'react';
import { Home, Mic, Search, Library, Music, Zap, MoreHorizontal, Radio, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/store/language-store';
import { t, type I18nKey } from '@/lib/i18n';
import { usePlayerStore, type Track } from '@/store/player-store';
import { LIVE_POLL_MS, type LiveStatus } from '@/lib/live';

const moreItems: { icon: typeof Home; key: I18nKey; href: string }[] = [
  { icon: Search, key: 'navSearch', href: '/search' },
  { icon: Library, key: 'navLibrary', href: '/library' },
  { icon: Music, key: 'navHamdNaat', href: '/hamdnaat' },
  { icon: Zap, key: 'navShorts', href: '/shorts' },
];

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
 * Home / Live / Boyan / More. Live plays the islahbd.com live broadcast
 * (or the last recording when offline) straight from the bar; More opens
 * a card with the remaining sections (Search, Library, Hamd-Naat, Shorts).
 */
export default function BottomNav() {
  const pathname = usePath();
  const { lang } = useLanguageStore();
  const strings = t(lang);
  const [moreOpen, setMoreOpen] = useState(false);
  const [live, setLive] = useState<LiveStatus | null>(null);

  const { playTrack, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();

  // Live status from islahbd.com (polled, same as the Home hero).
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

  return (
    <>
      {/* More card — remaining sections in a floating card above the bar */}
      {moreOpen && (
        <>
          <button
            aria-label={strings.plmClose}
            className="fixed inset-0 z-40 cursor-default md:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-[76px] inset-x-4 z-50 md:hidden liquid-glass rounded-3xl p-2 overflow-hidden animate-fade-up">
            <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <p className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
              {strings.moreTitle}
            </p>
            <div className="grid grid-cols-2 gap-1">
              {moreItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all',
                      isActive
                        ? 'liquid-chip text-white font-medium ring-1 ring-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
                        : 'text-white/90 hover:bg-white/[0.07]'
                    )}
                  >
                    <Icon
                      size={19}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      fill={isActive ? 'currentColor' : 'none'}
                      fillOpacity={isActive ? 0.2 : 0}
                      className="shrink-0"
                    />
                    {strings[item.key]}
                  </a>
                );
              })}
            </div>
          </div>
        </>
      )}

      <nav className="bottom-nav md:hidden fixed bottom-2.5 inset-x-4 z-50 rounded-full liquid-glass safe-bottom">
        <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-14 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.12] via-transparent to-transparent" />
        <div className="relative grid grid-cols-4 px-3 py-1">
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

          {/* More */}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-label={strings.navMore}
            className={cn(baseItem, (moreOpen || moreItems.some((i) => i.href === pathname)) ? activeItem : 'text-mist-dark')}
          >
            {moreOpen ? <X size={20} /> : renderIcon(MoreHorizontal, moreItems.some((i) => i.href === pathname))}
            {strings.navMore}
          </button>
        </div>
      </nav>
    </>
  );
}
