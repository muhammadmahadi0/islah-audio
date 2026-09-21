'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { usePlayerStore, type Track } from '@/store/player-store';
import { Search as SearchIcon, Music, Loader2, X, ListPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_CHANNEL_ID } from '@/lib/invidious';
import AddToPlaylistMenu from '@/components/AddToPlaylistMenu';

interface ChannelVideo {
  videoId: string;
  id?: string;
  title: string;
  thumbnail: string;
  duration: number;
  publishedAt?: string;
}

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

function SearchRow({
  video,
  onPlay,
  isActive,
  isPlaying,
}: {
  video: ChannelVideo;
  onPlay: () => void;
  isActive: boolean;
  isPlaying: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const videoId = video.videoId || video.id || '';

  return (
    <div
      onClick={onPlay}
      className={cn(
        'relative flex items-center gap-3.5 p-3 cursor-pointer transition-colors',
        isActive ? 'bg-brand/[0.08]' : 'hover:bg-white/[0.04]'
      )}
    >
      <div className="w-16 h-12 shrink-0 rounded-lg overflow-hidden bg-ink-700 ring-1 ring-white/10">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold leading-snug clamp-2',
            isActive ? 'text-brand-light' : 'text-white'
          )}
        >
          {video.title}
        </p>
        <p className="text-mist-dark text-xs mt-0.5">Islah</p>
      </div>
      {video.duration > 0 && (
        <span className="shrink-0 text-xs font-medium text-mist-dark tabular-nums">
          {formatDuration(video.duration)}
        </span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        aria-label="Save to playlist"
        className="p-1.5 rounded-lg text-mist-dark hover:text-gold-light hover:bg-white/10 transition-colors shrink-0"
      >
        <ListPlus size={16} />
      </button>
      {isActive && isPlaying && (
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
      {menuOpen && (
        <AddToPlaylistMenu
          track={{
            id: videoId,
            title: video.title,
            thumbnail: video.thumbnail,
            duration: video.duration || 0,
            channelName: 'Islah',
            videoId,
          }}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [indexing, setIndexing] = useState(false);
  const [totalVideos, setTotalVideos] = useState(0);

  const { playTrack, currentTrack, isPlaying } = usePlayerStore();

  // Index the whole catalog in the background (100 first, then 200-chunks)
  // so search covers every video, not just the first page.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // NOTE: channel ID goes in the path — query strings are dropped
        // by our hosting before function invocation.
        const res = await fetch(`/api/channel/${DEFAULT_CHANNEL_ID}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.success && Array.isArray(data.videos)) {
          setVideos(data.videos);
          setTotalVideos(data.total || data.videos.length);
          let token: string | null = data.nextPageToken || null;
          if (token) setIndexing(true);
          const seen = new Set(data.videos.map((v: ChannelVideo) => v.videoId || v.id));
          while (token && !cancelled) {
            const more = await fetch(
              `/api/channel/${DEFAULT_CHANNEL_ID}/more/${encodeURIComponent(token)}`
            );
            const mdata = await more.json();
            if (!mdata.success || !Array.isArray(mdata.videos)) break;
            const fresh = mdata.videos.filter(
              (v: ChannelVideo) => !seen.has(v.videoId || v.id)
            );
            fresh.forEach((v: ChannelVideo) => seen.add(v.videoId || v.id));
            if (!cancelled) setVideos((prev) => [...prev, ...fresh]);
            token = mdata.nextPageToken || null;
          }
        }
      } catch (error) {
        console.error('Search catalog load error:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIndexing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSubmittedQuery(query.trim());
    },
    [query]
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setSubmittedQuery('');
  }, []);

  const results = useMemo(() => {
    const q = submittedQuery.toLowerCase();
    if (!q) return [];
    return videos.filter((v) => v.title.toLowerCase().includes(q));
  }, [videos, submittedQuery]);

  const toTrack = (video: ChannelVideo): Track => ({
    id: video.videoId || video.id || '',
    title: video.title,
    thumbnail: video.thumbnail,
    duration: video.duration || 0,
    channelName: 'Islah',
    videoId: video.videoId || video.id || '',
  });

  const handlePlayVideo = (video: ChannelVideo) => {
    const trackList: Track[] = results.map(toTrack);
    const currentIndex = results.findIndex(
      (v) => (v.videoId || v.id) === (video.videoId || video.id)
    );
    playTrack(toTrack(video), trackList, currentIndex >= 0 ? currentIndex : 0);
  };

  return (
    <main className="pb-44 md:pb-36">
      <div className="mx-auto max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-1">
          Search
        </h1>
        <p className="text-sm text-mist-dark mb-5">
          Find bayans, waz and nasheeds from the channel
          {indexing && (
            <span className="ml-2 text-brand-light">
              • indexing {videos.length}{totalVideos ? `/${totalVideos}` : ''}…
            </span>
          )}
        </p>

        <form onSubmit={handleSearch}>
          <div className="relative group">
            <SearchIcon
              className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-dark group-focus-within:text-brand-light transition-colors"
              size={20}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lectures…"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-12 pr-12 text-white placeholder:text-mist-dark outline-none focus:border-brand/60 focus:bg-white/[0.06] focus:shadow-glow transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-mist-dark hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </form>

        <div className="mt-6">
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={26} className="animate-spin text-brand-light" />
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-mist-dark mb-3">
                {results.length} result{results.length === 1 ? '' : 's'}
              </p>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.05]">
                {results.map((video) => {
                  const videoId = video.videoId || video.id || '';
                  return (
                    <SearchRow
                      key={videoId}
                      video={video}
                      onPlay={() => handlePlayVideo(video)}
                      isActive={currentTrack?.videoId === videoId}
                      isPlaying={isPlaying}
                    />
                  );
                })}
              </div>
            </>
          )}

          {!isLoading && submittedQuery && results.length === 0 && (
            <div className="text-center py-16 rounded-3xl border border-dashed border-white/10">
              <SearchIcon size={40} className="mx-auto mb-4 text-mist-dark" />
              <p className="text-white font-bold">No results for “{submittedQuery}”</p>
              <p className="text-mist-dark text-sm mt-1">Try different keywords</p>
            </div>
          )}

          {!isLoading && !submittedQuery && (
            <div className="text-center py-16 rounded-3xl border border-dashed border-white/10">
              <span className="w-16 h-16 rounded-full bg-brand/10 border border-brand/25 flex items-center justify-center mx-auto mb-4">
                <SearchIcon size={26} className="text-brand-light" />
              </span>
              <p className="text-white font-bold">Search the collection</p>
              <p className="text-mist-dark text-sm mt-1">
                {videos.length > 0
                  ? `${videos.length} lectures indexed`
                  : 'Type above to begin'}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
