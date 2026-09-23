import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { shareVideo } from '@/lib/share';

/**
 * Small share button: native share sheet on mobile, copies the
 * `/watch/[videoId]` link on desktop. Shows a checkmark briefly on copy.
 * Callers must stopPropagation when nested inside a play-on-click row.
 */
export default function ShareButton({
  videoId,
  title,
  className,
  iconSize = 16,
}: {
  videoId: string;
  title?: string;
  className?: string;
  iconSize?: number;
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await shareVideo(videoId, title);
    if (result === 'copied') {
      setState('copied');
      setTimeout(() => setState('idle'), 1600);
    } else if (result === 'failed') {
      setState('failed');
      setTimeout(() => setState('idle'), 1600);
    }
  };

  return (
    <button
      onClick={handleShare}
      aria-label={state === 'copied' ? 'Link copied' : state === 'failed' ? 'Copy failed' : 'Share'}
      title={state === 'copied' ? 'Link copied!' : 'Share'}
      className={cn(
        'shrink-0 rounded-full flex items-center justify-center text-white transition-all',
        className
      )}
    >
      {state === 'copied' ? (
        <Check size={iconSize} className="text-brand-light" strokeWidth={3} />
      ) : (
        <Share2 size={iconSize} />
      )}
    </button>
  );
}
