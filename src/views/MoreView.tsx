import { useEffect, useState, useCallback } from 'react';
import {
  Radio,
  Search,
  Library,
  Mic,
  Music,
  Zap,
  Sparkles,
  BookOpen,
  CalendarDays,
  ScrollText,
  MoonStar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/store/language-store';
import { t } from '@/lib/i18n';
import { usePlayerStore, type Track } from '@/store/player-store';
import { LIVE_POLL_MS, type LiveStatus } from '@/lib/live';

/**
 * More hub — every section in one place. The home-page buttons (Live
 * action + Search / Library / Boyan / Hamd-Naat / Shorts) plus the new
 * Islamic buttons (Amal / Dua / Calendar / Wazifa / Durood). The new
 * buttons open placeholder pages for now — their functions come later.
 */
export default function MoreView() {
  const { lang } = useLanguageStore();
  const s = t(lang);
  const [live, setLive] = useState<LiveStatus | null>(null);

  const { playTrack, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();

  // Live status from islahbd.com (polled) — powers the Live card.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/live');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.success) setLive(data.live);
      } catch {
        // ignore — the Live card simply stays idle
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

  const cardClass =
    'relative liquid-glass rounded-3xl p-3.5 md:p-4 text-center transition-all overflow-hidden ' +
    'hover:border-white/30 hover:scale-[1.02] active:scale-[0.98] ' +
    'flex flex-col items-center gap-2.5 min-h-[118px]';

  return (
    <main className="pb-44 md:pb-36">
      <div className="mx-auto max-w-[1600px] px-4 md:px-6 pt-2 md:pt-3">
        {/* ---------- Home sections ---------- */}
        <section aria-label={s.featuresTitle} className="animate-fade-up">
          <h2 className="px-1 mb-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
            {s.featuresTitle}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 md:gap-3">
            {/* Live — action card (plays broadcast / last recording) */}
            <button
              onClick={handleLive}
              disabled={!live || (!live.isLive && !live.recording)}
              className={cn(
                cardClass,
                'disabled:opacity-40 disabled:hover:scale-100'
              )}
              style={
                live?.isLive
                  ? { boxShadow: '0 0 18px 2px rgba(239,68,68,0.35)' }
                  : undefined
              }
            >
              <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              <span className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ring-1',
                live?.isLive
                  ? 'bg-black/60 ring-red-500 text-red-500'
                  : 'liquid-gold'
              )}>
                {live?.isLive ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                ) : (
                  <Radio size={18} />
                )}
              </span>
              <span className="min-w-0 w-full text-center">
                <span className="block text-sm font-bold text-white truncate">
                  {live?.isLive
                    ? (isLiveTrackActive && isPlaying ? s.listening : s.live)
                    : (live?.recording ? s.lastLive : s.live)}
                </span>
                <span className="block text-[11px] text-mist-dark truncate mt-0.5">
                  {s.featLiveSub}
                </span>
              </span>
            </button>
            {([
              { icon: Search, titleKey: 'navSearch', subKey: 'featSearchSub', href: '/search' },
              { icon: Library, titleKey: 'navLibrary', subKey: 'featLibrarySub', href: '/library' },
              { icon: Mic, titleKey: 'navBoyan', subKey: 'featBoyanSub', href: '/boyan' },
              { icon: Music, titleKey: 'navHamdNaat', subKey: 'featHamdSub', href: '/hamdnaat' },
              { icon: Zap, titleKey: 'navShorts', subKey: 'featShortsSub', href: '/shorts' },
            ] as const).map((f) => {
              const Icon = f.icon;
              return (
                <a key={f.href} href={f.href} className={cardClass}>
                  <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                  <span className="liquid-gold w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 w-full text-center">
                    <span className="block text-sm font-bold text-white truncate">
                      {s[f.titleKey]}
                    </span>
                    <span className="block text-[11px] text-mist-dark truncate mt-0.5">
                      {s[f.subKey]}
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
        </section>

        {/* ---------- Islamic sections ---------- */}
        <section aria-label={s.navMore} className="mt-3 md:mt-4 animate-fade-up">
          <h2 className="px-1 mb-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
            {s.navMore}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 md:gap-3">
            {([
              { icon: Sparkles, titleKey: 'navAmal', subKey: 'featAmalSub', href: '/amal' },
              { icon: BookOpen, titleKey: 'navDua', subKey: 'featDuaSub', href: '/dua' },
              { icon: CalendarDays, titleKey: 'navCalendar', subKey: 'featCalendarSub', href: '/calendar' },
              { icon: ScrollText, titleKey: 'navWazifa', subKey: 'featWazifaSub', href: '/wazifa' },
              { icon: MoonStar, titleKey: 'navDurood', subKey: 'featDuroodSub', href: '/durood' },
            ] as const).map((f) => {
              const Icon = f.icon;
              return (
                <a key={f.href} href={f.href} className={cardClass}>
                  <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                  <span className="liquid-gold w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 w-full text-center">
                    <span className="block text-sm font-bold text-white truncate">
                      {s[f.titleKey]}
                    </span>
                    <span className="block text-[11px] text-mist-dark truncate mt-0.5">
                      {s[f.subKey]}
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[11px] text-mist-dark">{s.moreSub}</p>
        </section>
      </div>
    </main>
  );
}
