import { useEffect, useMemo, useState } from 'react';
import { MoonStar, MapPin, CalendarDays, Sunrise, Sun, CloudSun, Sunset, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/store/language-store';
import { t } from '@/lib/i18n';
import {
  detectPrayerLoc,
  fetchPrayerDay,
  formatCountdown,
  formatPrayerTime,
  getCurrentKey,
  getNextPrayer,
  getSpecialPeriod,
  nowMinutesIn,
  nowSecsIn,
  toBnDigits,
  type PrayerKey,
  type PrayerLoc,
  type PrayerTimes,
} from '@/lib/prayer';

const PRAYER_ICONS: Record<PrayerKey, typeof Sun> = {
  fajr: Sunrise,
  sunrise: Sun,
  dhuhr: Sun,
  asr: CloudSun,
  maghrib: Sunset,
  isha: Moon,
};

const PRAYER_KEYS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

/**
 * Prayer countdown card for the Home hub — timer ported from the `pray-bd`
 * project (Aladhan Hanafi times + prohibited-sunrise / Ishraq / Chasht
 * special periods), restyled to the site's gold liquid-glass theme.
 *
 * Liquid-glass rounded card: next-prayer (or special-period) countdown
 * hero, Gregorian + Hijri dates, auto-detected city, and a 6-up prayer
 * grid with current/next highlights. Follows the app language (EN/বাং)
 * and the light/dark + liquid/material themes via tokens — no hardcoded
 * colors (the prohibited RED matches the site's live-red).
 */
export default function PrayerTimer() {
  const { lang } = useLanguageStore();
  const s = t(lang);
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [hijri, setHijri] = useState<{ day: string; month: string; year: string } | null>(null);
  const [loc, setLoc] = useState<PrayerLoc | null>(null);
  const [offline, setOffline] = useState(false);
  const [tick, setTick] = useState(0);

  const nameOf = (key: PrayerKey): string =>
    key === 'fajr' ? s.prayerFajr
    : key === 'sunrise' ? s.prayerSunrise
    : key === 'dhuhr' ? s.prayerDhuhr
    : key === 'asr' ? s.prayerAsr
    : key === 'maghrib' ? s.prayerMaghrib
    : s.prayerIsha;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const l = await detectPrayerLoc();
        if (cancelled) return;
        setLoc(l);
        const day = await fetchPrayerDay(l);
        if (cancelled) return;
        setTimes(day.times);
        setHijri(day.hijri);
        setOffline(day.offline);
      } catch {
        // fallback is handled inside fetchPrayerDay; nothing to show yet
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 1s countdown tick.
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Midnight refresh — refetch the new day's times.
  useEffect(() => {
    if (!loc) return;
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 5, 0);
    const ms = midnight.getTime() - now.getTime();
    const id = setTimeout(async () => {
      try {
        const day = await fetchPrayerDay(loc, new Date());
        setTimes(day.times);
        setHijri(day.hijri);
        setOffline(day.offline);
        setTick((n) => n + 1);
      } catch {
        // keep yesterday's times until the next tick refires
      }
    }, ms);
    return () => clearTimeout(id);
  }, [loc]);

  const derived = useMemo(() => {
    if (!times) return null;
    const tz = loc?.timezone || 'Asia/Dhaka';
    const now = new Date();
    const nowMins = nowMinutesIn(tz, now);
    const nowSecs = nowSecsIn(tz, now);
    // pray-bd checks special morning periods FIRST (RED prohibited etc).
    const special = getSpecialPeriod(times, nowMins, nowSecs);
    if (special) {
      return { special, next: null as null, current: getCurrentKey(times, nowMins), secsLeft: special.remainSecs, now };
    }
    const next = getNextPrayer(times, nowMins);
    const current = getCurrentKey(times, nowMins);
    const secsLeft = Math.max(0, Math.round(next.minutesLeft * 60 - now.getSeconds()));
    void tick;
    return { special: null as null, next, current, secsLeft, now };
  }, [times, loc, tick]);

  const gregorian = useMemo(() => {
    try {
      const tz = loc?.timezone || 'Asia/Dhaka';
      return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
        timeZone: tz,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());
    } catch {
      return '';
    }
  }, [lang, loc, tick]);

  const hijriLabel = useMemo(() => {
    if (!hijri) return '';
    if (lang === 'bn') return `${toBnDigits(hijri.day)} ${hijri.month}, ${toBnDigits(hijri.year)} হিজরি`;
    return `${hijri.day} ${hijri.month}, ${hijri.year} AH`;
  }, [hijri, lang]);

  const specialLabel =
    derived?.special?.type === 'prohibited' ? s.prayerProhibited
    : derived?.special?.type === 'ishraq' ? s.prayerIshraq
    : derived?.special?.type === 'chasht' ? s.prayerChasht
    : '';

  return (
    <section aria-label={s.prayerTitle} className="animate-fade-up">
      <div className="relative liquid-glass rounded-[28px] p-4 md:p-6 overflow-hidden">
        <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/[0.12] via-transparent to-transparent" />

        {/* Header: title + city */}
        <div className="relative flex items-center gap-3">
          <span className="liquid-gold w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
            <MoonStar size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-base md:text-lg font-extrabold tracking-tight text-white truncate">
              {s.prayerTitle}
            </h2>
            <p className="flex items-center gap-1 text-[11px] md:text-xs text-mist-dark truncate">
              <MapPin size={11} className="shrink-0 text-gold" />
              {loc ? loc.city : s.loading}
              {offline && times ? ` • ${s.prayerOffline}` : ''}
            </p>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-mist-dark shrink-0">
            <CalendarDays size={12} className="text-gold" />
            <span className="truncate max-w-[220px]">{gregorian}</span>
          </span>
        </div>

        {/* Countdown hero */}
        <div className="relative mt-3 text-center">
          {times && derived ? (
            derived.special ? (
              <>
                <p
                  className={cn(
                    'text-[11px] font-bold uppercase tracking-[0.22em]',
                    derived.special.isRed ? 'text-red-500' : 'text-gold'
                  )}
                  style={derived.special.isRed ? { textShadow: '0 0 14px rgba(239,68,68,0.6)' } : undefined}
                >
                  {specialLabel}
                </p>
                <p
                  className={cn(
                    'mt-1 font-extrabold tabular-nums tracking-tight text-4xl md:text-5xl',
                    derived.special.isRed ? 'text-red-500' : 'text-white'
                  )}
                >
                  {formatCountdown(derived.secsLeft, lang)}
                </p>
                <p className="mt-1.5 text-[11px] md:text-xs text-mist-dark truncate">
                  {gregorian}
                  {hijriLabel ? ` • ${hijriLabel}` : ''}
                </p>
              </>
            ) : (
              derived.next && (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
                    {s.nextPrayerLabel}: {nameOf(derived.next.key)}
                    {derived.next.isTomorrow ? ` (${s.tomorrow})` : ''}
                  </p>
                  <p className="mt-1 font-extrabold tabular-nums tracking-tight text-white text-4xl md:text-5xl">
                    {formatCountdown(derived.secsLeft, lang)}
                  </p>
                  <p className="mt-1.5 text-[11px] md:text-xs text-mist-dark truncate">
                    {gregorian}
                    {hijriLabel ? ` • ${hijriLabel}` : ''}
                  </p>
                </>
              )
            )
          ) : (
            <>
              <div className="mx-auto h-5 w-40 rounded shimmer mb-2" />
              <div className="mx-auto h-11 w-56 rounded-xl shimmer" />
              <div className="mx-auto mt-2 h-3.5 w-48 rounded shimmer" />
            </>
          )}
        </div>

        {/* Prayer grid */}
        <div className="relative mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PRAYER_KEYS.map((key) => {
            const Icon = PRAYER_ICONS[key];
            const isActive = !!times && !!derived && key !== 'sunrise' && derived.current === key;
            const isNext =
              !!times && !!derived && !derived.special && key !== 'sunrise' && derived.next?.key === key && derived.next?.key !== derived.current;
            return (
              <div
                key={key}
                className={cn(
                  'rounded-2xl px-2 py-2.5 text-center transition-all border border-transparent',
                  isActive
                    ? 'liquid-gold'
                    : isNext
                      ? 'liquid-chip ring-1 ring-brand/50'
                      : 'bg-white/[0.04] ring-1 ring-white/10'
                )}
              >
                <p className={cn('flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider', isActive ? 'text-[#1a1405]' : 'text-mist-dark')}>
                  <Icon size={12} className={isActive ? '' : 'text-gold'} />
                  {nameOf(key)}
                </p>
                {times ? (
                  <p className={cn('mt-1 text-sm font-extrabold tabular-nums', isActive ? 'text-[#1a1405]' : 'text-white')}>
                    {formatPrayerTime(times[key], lang)}
                  </p>
                ) : (
                  <div className="mx-auto mt-1.5 h-5 w-16 rounded shimmer" />
                )}
                {isActive && (
                  <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-[#1a1405]/80">
                    {s.prayerCurrent}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
