import {
  ArrowLeft,
  BookOpen,
  HeartHandshake,
  Lightbulb,
  MoonStar,
  Route,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/store/language-store';
import { t } from '@/lib/i18n';
import {
  MISSION_AMEEN,
  MISSION_AMEEN_EN,
  MISSION_DUA,
  MISSION_DUA_EN,
  MISSION_FINAL_ECHO,
  MISSION_FINAL_ECHO_EN,
  MISSION_FINAL_STATEMENT,
  MISSION_FINAL_STATEMENT_EN,
  MISSION_HEADER_TITLE,
  MISSION_HEADER_TITLE_EN,
  MISSION_SECTIONS,
  MISSION_SECTIONS_EN,
  MISSION_SUBTITLE,
  MISSION_SUBTITLE_EN,
  MISSION_TITLE,
  MISSION_TITLE_EN,
  type MissionSection,
} from '@/lib/mission';

const SECTION_ICONS = {
  intro: Lightbulb,
  lineage: Users,
  goal: Route,
  path: MoonStar,
  sohbat: HeartHandshake,
  tasawwuf: Sparkles,
  dream: MoonStar,
  end: BookOpen,
} as const;

const SECTION_TINT: Record<MissionSection['icon'], string> = {
  intro: 'bg-amber-500/15 text-amber-400 ring-amber-400/30 [html.light_&]:text-amber-700 [html.light_&]:ring-amber-600/40',
  lineage: 'bg-sky-500/15 text-sky-400 ring-sky-400/30 [html.light_&]:text-sky-700 [html.light_&]:ring-sky-600/40',
  goal: 'bg-emerald-500/15 text-emerald-400 ring-emerald-400/30 [html.light_&]:text-emerald-700 [html.light_&]:ring-emerald-600/40',
  path: 'bg-violet-500/15 text-violet-400 ring-violet-400/30 [html.light_&]:text-violet-700 [html.light_&]:ring-violet-600/40',
  sohbat: 'bg-rose-500/15 text-rose-400 ring-rose-400/30 [html.light_&]:text-rose-700 [html.light_&]:ring-rose-600/40',
  tasawwuf: 'bg-pink-500/15 text-pink-400 ring-pink-400/30 [html.light_&]:text-pink-700 [html.light_&]:ring-pink-600/40',
  dream: 'bg-teal-500/15 text-teal-400 ring-teal-400/30 [html.light_&]:text-teal-700 [html.light_&]:ring-teal-600/40',
  end: 'bg-brand/15 text-brand-light ring-brand/30',
};

const QUOTE_STYLES = {
  gold: 'border-amber-400 bg-amber-400/10 text-amber-100 [html.light_&]:border-amber-600 [html.light_&]:bg-amber-500/15 [html.light_&]:text-amber-900',
  blue: 'border-sky-400 bg-sky-400/10 text-sky-100 [html.light_&]:border-sky-600 [html.light_&]:bg-sky-500/15 [html.light_&]:text-sky-900',
  pink: 'border-pink-400 bg-pink-400/10 text-pink-100 [html.light_&]:border-pink-600 [html.light_&]:bg-pink-500/15 [html.light_&]:text-pink-900',
  teal: 'border-teal-400 bg-teal-400/10 text-teal-100 [html.light_&]:border-teal-600 [html.light_&]:bg-teal-500/15 [html.light_&]:text-teal-900',
} as const;

function Quote({ color, text }: { color: keyof typeof QUOTE_STYLES; text: string }) {
  return (
    <blockquote
      className={cn(
        'rounded-r-2xl border-l-4 px-4 py-3 text-[13px] md:text-sm leading-relaxed font-medium',
        QUOTE_STYLES[color]
      )}
    >
      {text}
    </blockquote>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((b) => (
        <li key={b} className="flex items-start gap-2.5 text-[13px] md:text-sm leading-relaxed text-mist">
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Mission page — "Our Respected Shaykh's Mission", opened from the
 * mission card on the Family page. One liquid-glass card per section,
 * colored circular section icons, tinted left-border quote boxes,
 * gold-bulleted lists, and the gold final statement + dua.
 * Body renders Bengali in Bangla mode and the English translation
 * otherwise (both kept verbatim in `lib/mission.ts`); chrome translates.
 */
export default function MissionView() {
  const { lang } = useLanguageStore();
  const s = t(lang);
  const isBn = lang === 'bn';

  const headerTitle = isBn ? MISSION_HEADER_TITLE : MISSION_HEADER_TITLE_EN;
  const title = isBn ? MISSION_TITLE : MISSION_TITLE_EN;
  const subtitle = isBn ? MISSION_SUBTITLE : MISSION_SUBTITLE_EN;
  const sections = isBn ? MISSION_SECTIONS : MISSION_SECTIONS_EN;
  const finalStatement = isBn ? MISSION_FINAL_STATEMENT : MISSION_FINAL_STATEMENT_EN;
  const finalEcho = isBn ? MISSION_FINAL_ECHO : MISSION_FINAL_ECHO_EN;
  const dua = isBn ? MISSION_DUA : MISSION_DUA_EN;
  const ameen = isBn ? MISSION_AMEEN : MISSION_AMEEN_EN;

  return (
    <main className="pb-44 md:pb-36">
      <div className="mx-auto max-w-3xl px-4 md:px-8 pt-2 md:pt-3">
        <a
          href="/family"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-mist-dark hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          {s.navFamily}
        </a>

        {/* ---------- Header ---------- */}
        <section className="relative liquid-glass rounded-[28px] p-6 md:p-8 mt-3 text-center overflow-hidden animate-fade-up">
          <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          <span className="liquid-gold w-12 h-12 rounded-full flex items-center justify-center mx-auto">
            <Lightbulb size={22} />
          </span>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
            {headerTitle}
          </p>
          <h1 className="mt-2 font-display text-xl md:text-2xl font-extrabold tracking-tight text-white leading-snug">
            {title}
          </h1>
          <p className="mt-2 text-[13px] md:text-sm font-semibold text-gold">
            {subtitle}
          </p>
        </section>

        {/* ---------- Sections ---------- */}
        <div className="mt-3 md:mt-4 space-y-2.5 md:space-y-3">
          {sections.map((section) => {
            const Icon = SECTION_ICONS[section.icon];
            return (
              <section
                key={section.id}
                aria-label={section.title}
                className="relative liquid-glass rounded-3xl p-5 md:p-6 overflow-hidden animate-fade-up"
              >
                <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                <div className="flex items-center gap-3">
                  <span className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0 ring-1', SECTION_TINT[section.icon])}>
                    <Icon size={18} />
                  </span>
                  <h2 className="text-base md:text-lg font-extrabold tracking-tight text-white leading-snug">
                    {section.title}
                  </h2>
                </div>
                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((p) => (
                    <p key={p.slice(0, 24)} className="text-[13px] md:text-sm leading-relaxed text-mist">
                      {p}
                    </p>
                  ))}
                  {section.quote && (
                    <Quote color={section.quote.color} text={section.quote.text} />
                  )}
                  {section.quoteAfter?.map((p) => (
                    <p key={p.slice(0, 24)} className="text-[13px] md:text-sm leading-relaxed text-mist">
                      {p}
                    </p>
                  ))}
                  {section.bullets && <Bullets items={section.bullets} />}
                  {section.bulletsAfter && (
                    <p className="text-[13px] md:text-sm leading-relaxed text-white font-semibold">
                      {section.bulletsAfter}
                    </p>
                  )}
                  {section.bullets2 && (
                    <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold mb-2">
                        {s.familyMissionSub}
                      </p>
                      <Bullets items={section.bullets2} />
                    </div>
                  )}
                </div>
              </section>
            );
          })}

          {/* ---------- Final statement + dua ---------- */}
          <section className="relative liquid-glass rounded-3xl p-5 md:p-6 overflow-hidden animate-fade-up">
            <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <div className="rounded-2xl liquid-gold px-4 py-4 text-center">
              <p className="text-sm md:text-base font-bold leading-relaxed">
                {finalStatement}
              </p>
            </div>
            <p className="mt-3 text-[13px] md:text-sm leading-relaxed text-white font-semibold text-center">
              {finalEcho}
            </p>
            <p className="mt-3 text-[13px] md:text-sm leading-relaxed text-mist">
              {dua}
            </p>
            <p className="mt-4 text-center font-display text-lg md:text-xl font-extrabold text-gold">
              {ameen}
            </p>
          </section>
        </div>

        <div className="mt-5 text-center">
          <a
            href="/family"
            className="liquid-gold inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold hover:scale-[1.03] active:scale-95 transition-all"
          >
            <BookOpen size={16} />
            {s.navFamily}
          </a>
        </div>
      </div>
    </main>
  );
}
