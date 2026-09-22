import { useState, useEffect } from 'react';
import { Home, Search, Library, Radio, Settings, ChevronDown, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHANNELS } from '@/lib/channels';
import { useChannelStore } from '@/store/channel-store';
import { useDesignStore } from '@/store/design-store';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Library, label: 'Library', href: '/library' },
];

function usePath() {
  const [path, setPath] = useState('/');
  useEffect(() => {
    setPath(window.location.pathname);
  }, []);
  return path;
}

interface ChannelMeta {
  name: string;
  avatar: string;
}

function closeMobileDrawer() {
  document.getElementById('mobile-drawer')?.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

/**
 * YouTube-style sidebar with a Channels switcher section.
 * `mobile` renders a full-height variant for the slide-over drawer.
 */
export default function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePath();
  const { channelId, setChannelId } = useChannelStore();
  const { mode: designMode, toggle: toggleDesign } = useDesignStore();
  const [meta, setMeta] = useState<Record<string, ChannelMeta>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Channel avatars (lightweight meta fetch, CDN-cached server-side)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        CHANNELS.map(async (c) => {
          try {
            const res = await fetch(`/api/channel/${c.id}`);
            const data = await res.json();
            if (data.success && data.channel) {
              return [c.id, { name: data.channel.name, avatar: data.channel.avatar }] as const;
            }
          } catch {
            // ignore — monogram fallback below
          }
          return [c.id, { name: c.name, avatar: '' }] as const;
        })
      );
      if (!cancelled) setMeta(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const switchChannel = (id: string) => {
    setChannelId(id);
    if (mobile) closeMobileDrawer();
  };

  return (
    <aside
      className={cn(
        'flex-col overflow-y-auto relative',
        mobile
          ? 'flex h-full w-full px-3 py-4 bg-transparent'
          : 'hidden md:flex w-60 lg:w-64 shrink-0 h-full liquid-glass rounded-3xl px-3 py-4'
      )}
    >
      {!mobile && (
        <span aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      )}
      {/* Brand (desktop only — drawer has its own header in Layout) */}
      {!mobile && (
        <a href="/" className="flex items-center gap-3 px-3 mb-5 group">
          <span className="relative w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-brand-light via-brand to-brand-dark flex items-center justify-center shadow-glow ring-1 ring-white/30 group-hover:scale-105 transition-transform">
            <span className="pointer-events-none absolute top-0 inset-x-1.5 h-1/2 rounded-full bg-gradient-to-b from-white/40 to-transparent" />
            <span className="text-[#E7C55A] text-xl font-bold leading-none">إ</span>
          </span>
          <span className="min-w-0">
            <span className="block text-white font-extrabold tracking-tight leading-tight">
              Islah Audio
            </span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-gold/90">
              Bayan • Waz • Nasheed
            </span>
          </span>
        </a>
      )}

      {/* Nav */}
      <nav className="space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={mobile ? closeMobileDrawer : undefined}
              className={cn(
                'flex items-center gap-5 rounded-xl px-3 h-10 text-sm transition-all',
                isActive
                  ? 'liquid-chip text-white font-medium ring-1 ring-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
                  : 'text-white/90 hover:bg-white/[0.07] font-normal border border-transparent'
              )}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.2 : 1.8}
                fill={isActive ? 'currentColor' : 'none'}
                fillOpacity={isActive ? 0.2 : 0}
                className="shrink-0"
              />
              {item.label}
            </a>
          );
        })}
      </nav>

      <hr className="border-white/10 my-3" />

      {/* Channels switcher (YouTube "Subscriptions" style) */}
      <p className="px-3 pb-1 text-sm font-medium text-white">Channels</p>
      <div className="space-y-0.5">
        {CHANNELS.map((c) => {
          const m = meta[c.id];
          const active = channelId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => switchChannel(c.id)}
              className={cn(
                'w-full flex items-center gap-4 rounded-xl px-3 h-11 text-sm transition-all text-left',
                active
                  ? 'liquid-chip text-white font-medium ring-1 ring-brand/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
                  : 'text-white/90 hover:bg-white/[0.07] border border-transparent'
              )}
            >
              <span className="w-6 h-6 rounded-full overflow-hidden bg-white/[0.07] backdrop-blur-md ring-1 ring-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] shrink-0 flex items-center justify-center">
                {m?.avatar ? (
                  <img src={m.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <Radio size={12} className="text-brand-light" />
                )}
              </span>
              <span className="flex-1 min-w-0 truncate">{m?.name || c.name}</span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-brand-light shrink-0" />}
            </button>
          );
        })}
      </div>

      <hr className="border-white/10 my-3" />

      {/* Settings */}
      <div>
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          aria-expanded={settingsOpen}
          className={cn(
            'w-full flex items-center gap-5 rounded-xl px-3 h-10 text-sm transition-all',
            settingsOpen
              ? 'liquid-chip text-white font-medium ring-1 ring-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
              : 'text-white/90 hover:bg-white/[0.07] font-normal border border-transparent'
          )}
        >
          <Settings
            size={20}
            strokeWidth={settingsOpen ? 2.2 : 1.8}
            className="shrink-0"
          />
          <span className="flex-1 text-left">Settings</span>
          <ChevronDown
            size={17}
            className={cn('text-mist-dark transition-transform', settingsOpen && 'rotate-180')}
          />
        </button>
        {settingsOpen && (
          <div className="mt-1.5 mx-1 rounded-2xl liquid-glass p-1.5">
            {/* Liquid Glass toggle */}
            <button
              onClick={toggleDesign}
              role="switch"
              aria-checked={designMode === 'liquid'}
              aria-label="Liquid Glass design"
              className="w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-white/[0.06] transition-colors"
            >
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-light to-brand-dark ring-1 ring-white/30 flex items-center justify-center shrink-0">
                <Droplets size={15} className="text-ink-950" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold text-white">
                  Liquid Glass
                </span>
                <span className="block text-[11px] text-mist-dark">
                  {designMode === 'liquid' ? 'iPhone-style frosted look' : 'Off — Material 3 solid look'}
                </span>
              </span>
              {/* Toggle pill — stays glossy so it reads on both surfaces */}
              <span
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors shrink-0 ring-1 ring-white/25 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]',
                  designMode === 'liquid' ? 'bg-gradient-to-r from-brand-light to-brand-dark' : 'bg-white/10'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                    designMode === 'liquid' ? 'left-[22px]' : 'left-0.5'
                  )}
                />
              </span>
            </button>
          </div>
        )}
      </div>

      <hr className="border-white/10 my-3" />

      <div className="flex-1" />

      {/* Footer */}
      <p className="px-3 text-[11px] leading-relaxed text-mist-dark">
        Audio streaming from public YouTube lectures. For listening &amp; learning.
      </p>
    </aside>
  );
}
