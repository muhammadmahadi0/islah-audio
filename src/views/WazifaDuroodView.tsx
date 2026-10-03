import { Sunrise, BookOpen, Star, ArrowLeft } from 'lucide-react';
import { useLanguageStore } from '@/store/language-store';
import { t } from '@/lib/i18n';

/**
 * Wazifa & Durood hub — three Bengali-only card buttons.
 * Content stays in Bengali in both app languages (owner request),
 * so titles/subs are hardcoded, not read from i18n. Only the back
 * link (chrome) translates.
 */
const CARDS = [
  {
    icon: Sunrise,
    title: "ছালেকীনের সকাল-সন্ধ্যার মা'মূলত বা ওয়াজিফা",
    sub: 'সকাল-সন্ধ্যার দৈনন্দিন মা’মূলত',
    href: '/wazifa-durood/morning',
  },
  {
    icon: BookOpen,
    title: 'দরূদ শরীফ সংকলন',
    sub: 'দরূদ শরীফের সংকলন',
    href: '/wazifa-durood/durood',
  },
  {
    icon: Star,
    title: "ইছমে-আ'যম",
    sub: 'আল্লাহর মহান নামসমূহ',
    href: '/wazifa-durood/isme-azam',
  },
] as const;

export default function WazifaDuroodView() {
  const { lang } = useLanguageStore();
  const s = t(lang);

  return (
    <main className="pb-44 md:pb-36">
      <div className="mx-auto max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
        <a
          href="/more"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-mist-dark hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          {s.navMore}
        </a>

        <section aria-label="ওজিফা ও দরুদ" className="animate-fade-up">
          <h1 className="px-1 mb-1 text-xl md:text-2xl font-extrabold tracking-tight text-white text-center">
            ওজিফা ও দরুদ
          </h1>
          <p className="px-1 mb-2.5 text-center text-[11px] text-mist-dark">
            ওজিফা ও দরুদ সংগ্রহ
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:gap-3">
            {CARDS.map((c) => {
              const Icon = c.icon;
              return (
                <a
                  key={c.href}
                  href={c.href}
                  className="relative liquid-glass rounded-3xl p-5 md:p-6 text-center transition-all overflow-hidden hover:border-white/30 hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center gap-3 min-h-[150px] justify-center"
                >
                  <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                  <span className="liquid-gold w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0 w-full text-center">
                    <span className="block text-[15px] font-bold text-white leading-snug">
                      {c.title}
                    </span>
                    <span className="block text-[11px] text-mist-dark mt-1">
                      {c.sub}
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
