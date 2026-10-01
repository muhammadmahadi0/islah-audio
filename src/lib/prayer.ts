/**
 * Prayer times for the Home hub, ported from the `pray-bd` project
 * (Aladhan API, Hanafi method=1/school=1, Bangladesh-first) — including
 * its special morning timer periods (prohibited sunrise / Ishraq / Chasht)
 * and the −1-day Hijri correction for Bangladesh moon sighting.
 *
 * - Offline-first: 24h localStorage cache; seasonal fallback when offline.
 * - Location: IP geolocation (ipapi.co → ip-api.com) cached 24h, Dhaka fallback.
 * - No new deps: native Date + Intl, explicit Asia/Dhaka timezone math.
 */

export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface PrayerLoc {
  city: string;
  lat: number;
  lng: number;
  timezone: string;
}

export const PRAYER_ORDER: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

/** Prayers that count for current/next + countdown (sunrise is display-only). */
export const COUNTDOWN_KEYS: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const DHAKA: PrayerLoc = { city: 'Dhaka', lat: 23.8103, lng: 90.4125, timezone: 'Asia/Dhaka' };
const LOC_CACHE_KEY = 'islah-prayer-loc';
const LOC_TTL_MS = 24 * 60 * 60 * 1000;

function timesCacheKey(loc: PrayerLoc, y: number, m: number, d: number): string {
  return `islah-prayer-${loc.lat.toFixed(2)}-${loc.lng.toFixed(2)}-${d}-${m}-${y}`;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / quota — in-memory only
  }
}

async function fetchJson(url: string, ms = 10000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function detectPrayerLoc(): Promise<PrayerLoc> {
  const cached = readJson<{ loc: PrayerLoc; at: number }>(LOC_CACHE_KEY);
  if (cached?.loc && Date.now() - cached.at < LOC_TTL_MS) return cached.loc;
  try {
    const data = await fetchJson('https://ipapi.co/json/', 8000);
    if (data && (data.latitude || data.longitude)) {
      const loc: PrayerLoc = {
        city: String(data.city || 'Dhaka'),
        lat: Number(data.latitude) || DHAKA.lat,
        lng: Number(data.longitude) || DHAKA.lng,
        timezone: safeTimezone(String(data.timezone || DHAKA.timezone)),
      };
      writeJson(LOC_CACHE_KEY, { loc, at: Date.now() });
      return loc;
    }
  } catch {
    // fall through to second provider
  }
  try {
    const data = await fetchJson('https://ip-api.com/json', 8000);
    if (data && data.status === 'success') {
      const loc: PrayerLoc = {
        city: String(data.city || 'Dhaka'),
        lat: Number(data.lat) || DHAKA.lat,
        lng: Number(data.lon) || DHAKA.lng,
        timezone: safeTimezone(String(data.timezone || DHAKA.timezone)),
      };
      writeJson(LOC_CACHE_KEY, { loc, at: Date.now() });
      return loc;
    }
  } catch {
    // fall through to Dhaka
  }
  return DHAKA;

  function safeTimezone(tz: string): string {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return tz;
    } catch {
      return DHAKA.timezone;
    }
  }
}

/** Seasonal Hanafi fallback for Bangladesh when Aladhan is unreachable. */
export function fallbackTimes(month: number): PrayerTimes {
  const summer = month >= 4 && month <= 9;
  return {
    fajr: summer ? '04:30' : '04:50',
    sunrise: summer ? '05:15' : '05:35',
    dhuhr: '12:00',
    asr: summer ? '15:45' : '16:00',
    maghrib: summer ? '18:30' : '18:10',
    isha: summer ? '19:45' : '19:30',
  };
}

export interface PrayerDay {
  times: PrayerTimes;
  hijri: { day: string; month: string; year: string } | null;
  offline: boolean;
}

export async function fetchPrayerDay(loc: PrayerLoc, now = new Date()): Promise<PrayerDay> {
  const key = timesCacheKey(loc, now.getFullYear(), now.getMonth() + 1, now.getDate());
  const cached = readJson<{ date: string; times: PrayerTimes; hijri: PrayerDay['hijri']; at: number }>(key);
  const todayStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
  if (cached && cached.date === todayStr && Date.now() - cached.at < LOC_TTL_MS) {
    return { times: cached.times, hijri: cached.hijri, offline: false };
  }
  try {
    const url =
      `https://api.aladhan.com/v1/timings/${todayStr}` +
      `?latitude=${loc.lat}&longitude=${loc.lng}&method=1&school=1`;
    const data = await fetchJson(url, 10000);
    const t = data?.data?.timings;
    const hijri = data?.data?.date?.hijri;
    if (data?.code === 200 && t) {
      const clean = (v: string) => String(v || '').slice(0, 5);
      const times: PrayerTimes = {
        fajr: clean(t.Fajr),
        sunrise: clean(t.Sunrise),
        dhuhr: clean(t.Dhuhr),
        asr: clean(t.Asr),
        maghrib: clean(t.Maghrib),
        isha: clean(t.Isha),
      };
      const day: PrayerDay = {
        times,
        hijri: hijri ? minusOneDayForBd(hijri.day, hijri.month?.en || '', hijri.year) : null,
        offline: false,
      };
      writeJson(key, { date: todayStr, times, hijri: day.hijri, at: Date.now() });
      return day;
    }
    throw new Error('bad payload');
  } catch {
    if (cached?.times) return { times: cached.times, hijri: cached.hijri, offline: true };
    return { times: fallbackTimes(now.getMonth() + 1), hijri: null, offline: true };
  }
}

/** Aladhan returns Umm al-Qura Hijri, often 1 day ahead of Bangladesh
 * local moon sighting — decrement by 1 (same as pray-bd). */
const HIJRI_MONTH_LENGTHS: Record<string, number> = {
  Muharram: 30,
  Safar: 29,
  'Rabi al-Awwal': 30,
  'Rabi al-Thani': 29,
  'Jumada al-Awwal': 30,
  'Jumada al-Thani': 29,
  Rajab: 30,
  "Sha'ban": 29,
  Ramadan: 30,
  Shawwal: 29,
  'Dhu al-Qidah': 30,
  'Dhu al-Hijjah': 29,
};

function minusOneDayForBd(dayRaw: unknown, monthRaw: string, yearRaw: unknown): { day: string; month: string; year: string } {
  const months = Object.keys(HIJRI_MONTH_LENGTHS);
  let day = parseInt(String(dayRaw), 10);
  let month = monthRaw || '';
  let year = parseInt(String(yearRaw), 10);
  if (!Number.isFinite(day)) day = 1;
  if (!Number.isFinite(year)) year = 1447;
  day -= 1;
  if (day < 1) {
    const idx = months.indexOf(month);
    if (idx > 0) month = months[idx - 1];
    else {
      month = 'Dhu al-Hijjah';
      year -= 1;
    }
    day = HIJRI_MONTH_LENGTHS[month] || 30;
  }
  return { day: String(day), month, year: String(year) };
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

/** Minutes since midnight in a given IANA timezone. */
export function nowMinutesIn(tz: string, now = new Date()): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = fmt.formatToParts(now);
    const h = Number(parts.find((p) => p.type === 'hour')?.value || 0);
    const m = Number(parts.find((p) => p.type === 'minute')?.value || 0);
    return (h % 24) * 60 + m;
  } catch {
    return now.getHours() * 60 + now.getMinutes();
  }
}

/** Seconds since midnight in a given IANA timezone. */
export function nowSecsIn(tz: string, now = new Date()): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = fmt.formatToParts(now);
    const h = Number(parts.find((p) => p.type === 'hour')?.value || 0);
    const m = Number(parts.find((p) => p.type === 'minute')?.value || 0);
    const s = Number(parts.find((p) => p.type === 'second')?.value || 0);
    return ((h % 24) * 3600 + m * 60 + s) % 86400;
  } catch {
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  }
}

export interface NextPrayer {
  key: PrayerKey;
  minutesLeft: number;
  isTomorrow: boolean;
}

/** Next upcoming prayer (sunrise excluded — display only, like the source app). */
export function getNextPrayer(times: PrayerTimes, nowMins: number): NextPrayer {
  for (const key of COUNTDOWN_KEYS) {
    if (nowMins < toMinutes(times[key])) {
      return { key, minutesLeft: toMinutes(times[key]) - nowMins, isTomorrow: false };
    }
  }
  const minsToMidnight = 24 * 60 - nowMins;
  return { key: 'fajr', minutesLeft: minsToMidnight + toMinutes(times.fajr), isTomorrow: true };
}

/** Current prayer = last one whose time has arrived (Isha wraps past midnight). */
export function getCurrentKey(times: PrayerTimes, nowMins: number): PrayerKey {
  let cur: PrayerKey = 'isha';
  for (const key of COUNTDOWN_KEYS) {
    if (nowMins >= toMinutes(times[key])) cur = key;
    else break;
  }
  return cur;
}

export type SpecialPeriodType = 'prohibited' | 'ishraq' | 'chasht';

export interface SpecialPeriod {
  type: SpecialPeriodType;
  remainSecs: number;
  /** Sunrise-prohibited countdown renders RED (same as pray-bd). */
  isRed: boolean;
}

/**
 * pray-bd's special morning timer: sunrise +15min is prohibited (RED),
 * then Ishraq (2h), then Chasht (until Dhuhr−10min). Both Ishraq and
 * Chasht count down to the Chasht end, exactly like the source app.
 * Returns null outside these windows (normal next-prayer countdown).
 */
export function getSpecialPeriod(times: PrayerTimes, nowMins: number, nowSecs: number): SpecialPeriod | null {
  if (!times.sunrise || !times.dhuhr) return null;
  const sun = toMinutes(times.sunrise);
  const dhuhr = toMinutes(times.dhuhr);
  if (!sun || !dhuhr) return null;
  const sunriseEnd = sun + 15;
  const ishraqEnd = sunriseEnd + 120;
  const chashtEnd = dhuhr - 10;
  if (chashtEnd <= ishraqEnd) return null;
  if (nowMins >= sun && nowMins < sunriseEnd) {
    return { type: 'prohibited', remainSecs: (sunriseEnd * 60 - nowSecs + 86400) % 86400, isRed: true };
  }
  if (nowMins >= sunriseEnd && nowMins < ishraqEnd) {
    return { type: 'ishraq', remainSecs: (chashtEnd * 60 - nowSecs + 86400) % 86400, isRed: false };
  }
  if (nowMins >= ishraqEnd && nowMins < chashtEnd) {
    return { type: 'chasht', remainSecs: (chashtEnd * 60 - nowSecs + 86400) % 86400, isRed: false };
  }
  return null;
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBnDigits(s: string): string {
  return s.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** "04:30" → "4:30 AM" / "৪:৩০ এ এম" */
export function formatPrayerTime(hhmm: string, lang: 'en' | 'bn'): string {
  if (!hhmm) return '--:--';
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '--:--';
  const d = new Date();
  d.setHours(h, m, 0, 0);
  const en = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (lang !== 'bn') return en;
  return toBnDigits(en).replace('AM', 'এ এম').replace('PM', 'পি এম');
}

/** Seconds → "01:23:45" / "০১:২৩:৪৫" */
export function formatCountdown(totalSecs: number, lang: 'en' | 'bn'): string {
  const s = Math.max(0, Math.floor(totalSecs));
  const str = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
  return lang === 'bn' ? toBnDigits(str) : str;
}
