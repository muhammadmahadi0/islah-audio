'use client';

import { usePlayerStore, type Track } from '@/store/player-store';
import { Music, Clock, Heart, ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function LibraryPage() {
  const { playlist, currentTrack, isPlaying, playTrack, setIsPlaying } = usePlayerStore();

  const handlePlayTrack = (track: Track, index: number) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      playTrack(track, playlist, index);
    }
  };

  return (
    <main className="pb-44 md:pb-36">
      <div className="mx-auto max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
        {/* Header card */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-brand-deep/50 via-ink-800 to-ink-900 p-6 md:p-8 mb-6">
          <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-brand/20 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-12 w-64 h-64 rounded-full bg-gold/10 blur-[90px]" />
          <div className="relative flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-light to-brand-dark flex items-center justify-center shadow-glow shrink-0">
              <ListMusic size={26} className="text-ink-950" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold">
                Collection
              </p>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Your Library
              </h1>
              <p className="text-[13px] text-mist mt-0.5">
                {playlist.length > 0
                  ? `${playlist.length} track${playlist.length === 1 ? '' : 's'} in queue`
                  : 'Tracks you play will appear here'}
              </p>
            </div>
          </div>
        </section>

        {playlist.length > 0 ? (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.05]">
            {playlist.map((track, index) => {
              const active = currentTrack?.id === track.id;
              return (
                <div
                  key={`${track.id}-${index}`}
                  onClick={() => handlePlayTrack(track, index)}
                  className={cn(
                    'flex items-center gap-3.5 p-3 cursor-pointer transition-colors',
                    active ? 'bg-brand/[0.08]' : 'hover:bg-white/[0.04]'
                  )}
                >
                  <span className="w-6 text-center text-xs font-bold text-mist-dark tabular-nums shrink-0">
                    {index + 1}
                  </span>
                  <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-ink-700 ring-1 ring-white/10">
                    {track.thumbnail ? (
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={18} className="text-brand-light" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-semibold truncate',
                        active ? 'text-brand-light' : 'text-white'
                      )}
                    >
                      {track.title}
                    </p>
                    <p className="text-mist-dark text-xs truncate">{track.channelName}</p>
                  </div>
                  <span className="text-xs font-medium text-mist-dark tabular-nums shrink-0">
                    {formatDuration(track.duration)}
                  </span>
                  {active && isPlaying && (
                    <span className="flex items-end gap-[3px] h-4 text-brand-light shrink-0 pr-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="eq-bar h-full"
                          style={{ animationDelay: `${i * 0.22}s` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 rounded-3xl border border-dashed border-white/10">
            <span className="w-16 h-16 rounded-full bg-brand/10 border border-brand/25 flex items-center justify-center mx-auto mb-4">
              <Music size={26} className="text-brand-light" />
            </span>
            <p className="text-white font-bold text-lg">Your library is empty</p>
            <p className="text-mist-dark text-sm mt-1">
              Play some lectures and they’ll show up here
            </p>
          </div>
        )}

        {/* Info sections */}
        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={17} className="text-gold" />
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Recently Played
              </h2>
            </div>
            <p className="text-mist-dark text-[13px] leading-relaxed">
              Your listening history will appear here as you play more lectures.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={17} className="text-gold" />
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Favorites
              </h2>
            </div>
            <p className="text-mist-dark text-[13px] leading-relaxed">
              Save your favorite bayans here for quick access, anytime.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
