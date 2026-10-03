import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Facebook,
  FileText,
  Globe,
  Heart,
  House,
  MessageCircle,
  MoonStar,
  Send,
  Star,
  Youtube,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/store/language-store';
import { t } from '@/lib/i18n';
import { FAMILY_PROFILE } from '@/lib/family-profile';

const SOCIALS = [
  { icon: Youtube, label: 'YouTube', href: 'https://www.youtube.com/@islahbd', className: 'text-red-500' },
  { icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com/islahbd', className: 'text-blue-500' },
  { icon: Send, label: 'Telegram', href: 'https://t.me/islahbd', className: 'text-sky-500' },
  { icon: MessageCircle, label: 'WhatsApp', href: 'https://www.whatsapp.com/', className: 'text-green-500' },
] as const;

/**
 * Family page — Islah family hub. Welcome card for the Shaykh, mission
 * card, Bay'ah + Khanqah application cards, IslahBD/Markazul website
 * cards, and the social row. Built with the site's liquid-glass cards
 * + gold tokens so it follows light/dark + liquid/material + language.
 */
export default function FamilyView() {
  const { lang } = useLanguageStore();
  const s = t(lang);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <main className="pb-44 md:pb-36">
      <div className="mx-auto max-w-3xl px-4 md:px-8 pt-2 md:pt-3">
        {/* ---------- Header ---------- */}
        <h1 className="family-title mt-2 text-center text-xl md:text-2xl font-extrabold tracking-tight animate-fade-up">
          {s.navFamily}
        </h1>

        {/* ---------- Main welcome card ---------- */}
        <section className="relative liquid-glass rounded-[28px] p-6 md:p-8 mt-3 text-center overflow-hidden animate-fade-up">
          <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          <span className="liquid-gold w-12 h-12 rounded-2xl flex items-center justify-center mx-auto">
            <Heart size={22} fill="currentColor" />
          </span>
          <p className="mt-3 text-sm md:text-base font-medium text-mist-dark">
            {s.familyWelcomeTop}
          </p>
          <p className="font-display text-3xl md:text-4xl font-bold text-gold mt-1">
            {s.familyWelcomeHead}
          </p>
          {/* decorative divider with star */}
          <div className="mt-3 flex items-center justify-center gap-2" aria-hidden="true">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-brand/60" />
            <Star size={14} className="text-gold" fill="currentColor" />
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-brand/60" />
          </div>
          <p className="mt-3 text-[13px] md:text-sm leading-relaxed text-mist">
            {s.familyIntro1}
            <br />
            {s.familyIntro2}
            <br />
            {s.familyIntro3}
          </p>
          <p className="mt-3 font-display text-xl md:text-2xl font-extrabold uppercase tracking-wide text-gold leading-snug">
            {s.familyName}
          </p>
          <p className="mt-1 text-xs text-mist-dark">{s.familyDamat}</p>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            aria-expanded={profileOpen}
            className="liquid-gold mt-5 inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold hover:scale-[1.03] active:scale-95 transition-all"
          >
            {profileOpen ? s.familyShowLess : s.familyLearnMore}
            {profileOpen ? (
              <ChevronDown size={16} className="rotate-180 transition-transform" />
            ) : (
              <ArrowRight size={16} />
            )}
          </button>
        </section>

        {/* ---------- Hazrat's Profile (Learn More expander) ----------
            Full biography from the "হযরতের পরিচিতি" modal on
            islahbd.github.io/Islah — expands inline below the welcome card. */}
        <div
          className={cn(
            'grid transition-all duration-300 ease-out',
            profileOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="overflow-hidden">
            <section
              aria-label={s.familyProfile}
              className="relative liquid-glass rounded-[28px] p-6 md:p-8 mt-3 text-left overflow-hidden"
            >
              <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold text-center">
                {s.familyProfile}
              </p>
              <p className="mt-2 text-center font-display text-lg md:text-xl font-extrabold text-white leading-snug">
                {s.familyName}
              </p>
              <p className="mt-1 text-center text-xs text-mist-dark">{s.familyDamat}</p>
              <div className="mt-4 space-y-5">
                {FAMILY_PROFILE.map((section) => (
                  <div key={section.headingKey}>
                    <p className="text-sm md:text-[15px] font-bold text-gold">
                      {s[section.headingKey]}:
                    </p>
                    {section.paragraphs.map((p, i) => (
                      <p key={i} className="mt-1.5 text-[13px] md:text-sm leading-relaxed text-mist">
                        {p}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ---------- Mission card → full mission page ---------- */}
        <section
          aria-label={s.familyMissionTitle}
          className="mt-3 md:mt-4 animate-fade-up"
        >
          <a
            href="/mission"
            className="relative liquid-glass rounded-3xl p-4 md:p-5 overflow-hidden flex items-center gap-3.5 transition-all hover:border-white/30 hover:scale-[1.01] active:scale-[0.99]"
          >
            <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <span className="liquid-gold w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
              <BookOpen size={20} />
            </span>
            <span className="flex-1 min-w-0 text-left">
              <span className="block text-sm md:text-base font-bold text-white">
                {s.familyMissionTitle}
              </span>
              <span className="block text-xs md:text-[13px] text-mist-dark mt-0.5">
                {s.familyMissionSub}
              </span>
            </span>
            <ChevronRight size={20} className="text-gold shrink-0" />
          </a>
        </section>

        {/* ---------- Applications ---------- */}
        <section aria-label={s.familyApplications} className="mt-3 md:mt-4 animate-fade-up">
          <h2 className="px-1 mb-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
            {s.familyApplications}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
            <a
              href="https://islahbd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="relative liquid-glass rounded-3xl p-4 overflow-hidden flex items-center gap-3.5 transition-all hover:border-white/30 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              <span className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-blue-500/15 text-blue-400 ring-1 ring-blue-400/30">
                <FileText size={20} />
              </span>
              <span className="flex-1 min-w-0 text-left">
                <span className="block text-sm font-bold text-white">
                  {s.familyBayahTitle}
                </span>
                <span className="block text-xs text-mist-dark mt-0.5">
                  {s.familyBayahSub}
                </span>
              </span>
              <ChevronRight size={18} className="text-mist-dark shrink-0" />
            </a>
            <a
              href="https://islahbd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="relative liquid-glass rounded-3xl p-4 overflow-hidden flex items-center gap-3.5 transition-all hover:border-white/30 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              <span className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-purple-500/15 text-purple-400 ring-1 ring-purple-400/30">
                <House size={20} />
              </span>
              <span className="flex-1 min-w-0 text-left">
                <span className="block text-sm font-bold text-white">
                  {s.familyKhanqahTitle}
                </span>
                <span className="block text-xs text-mist-dark mt-0.5">
                  {s.familyKhanqahSub}
                </span>
              </span>
              <ChevronRight size={18} className="text-mist-dark shrink-0" />
            </a>
          </div>
        </section>

        {/* ---------- Connect with us ---------- */}
        <section aria-label={s.familyConnect} className="mt-3 md:mt-4 animate-fade-up">
          <h2 className="px-1 mb-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
            {s.familyConnect}
          </h2>
          <div className="grid grid-cols-2 gap-2.5 md:gap-3">
            <a
              href="https://islahbd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="relative liquid-glass rounded-3xl p-4 overflow-hidden flex flex-col items-center gap-1.5 text-center transition-all hover:border-white/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              <Globe size={22} className="text-gold" />
              <span className="text-sm font-bold text-white">{s.familyIslahBd}</span>
              <span className="text-[11px] text-mist-dark">islahbd.com</span>
            </a>
            <a
              href="https://markazulihsan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="relative liquid-glass rounded-3xl p-4 overflow-hidden flex flex-col items-center gap-1.5 text-center transition-all hover:border-white/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              <MoonStar size={22} className="text-gold" />
              <span className="text-sm font-bold text-white truncate w-full">{s.familyMarkaz}</span>
              <span className="text-[11px] text-mist-dark truncate w-full">markazulihsan.com</span>
            </a>
          </div>

          {/* social row */}
          <div className="relative liquid-glass rounded-3xl mt-2.5 md:mt-3 px-2 py-4 overflow-hidden">
            <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <div className="grid grid-cols-4 gap-1">
              {SOCIALS.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="flex flex-col items-center gap-1.5 rounded-2xl py-2 transition-all hover:bg-white/[0.06] active:scale-95"
                  >
                    <span className={cn('flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.07] ring-1 ring-white/20', item.className)}>
                      <Icon size={20} />
                    </span>
                    <span className="text-[10px] font-semibold text-mist-dark">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
