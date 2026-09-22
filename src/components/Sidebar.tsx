import { useState, useEffect } from 'react';
import { Home, Search, Library, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHANNELS } from '@/lib/channels';
import { useChannelStore } from '@/store/channel-store';

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
  const [meta, setMeta] = useState<Record<string, ChannelMeta>>({});

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
        'flex-col bg-ink-900/60 overflow-y-auto',
        mobile ? 'flex h-full w-full px-3 py-4' : 'hidden md:flex w-60 lg:w-64 shrink-0 px-3 py-4'
      )}
    >
      {/* Brand (desktop only — drawer has its own header in Layout) */}
      {!mobile && (
        <a href="/" className="flex items-center gap-3 px-3 mb-5 group">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand via-brand-dark to-emerald-950 flex items-center justify-center shadow-glow ring-1 ring-gold/40 group-hover:scale-105 transition-transform">
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
                'flex items-center gap-5 rounded-lg px-3 h-10 text-sm transition-colors',
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/90 hover:bg-white/10 font-normal'
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
                'w-full flex items-center gap-4 rounded-lg px-3 h-11 text-sm transition-colors text-left',
                active ? 'bg-brand/[0.12] text-white font-medium' : 'text-white/90 hover:bg-white/10'
              )}
            >
              <span className="w-6 h-6 rounded-full overflow-hidden bg-ink-700 ring-1 ring-white/10 shrink-0 flex items-center justify-center">
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

      <div className="flex-1" />

      {/* Footer */}
      <p className="px-3 text-[11px] leading-relaxed text-mist-dark">
        Audio streaming from public YouTube lectures. For listening &amp; learning.
      </p>
    </aside>
  );
}
