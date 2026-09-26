import { useEffect, useState } from 'react';
import { Glasses } from 'lucide-react';

import { cn } from '@/app/components/ui/utils';

/**
 * A catalogue photo that degrades to a placeholder instead of a broken icon.
 *
 * Worth its own component because the two ways an image fails here are both
 * routine: a frame uploaded without photos yet (`src` is null), and a Firebase
 * Storage URL whose object was deleted with the document left behind. Neither is
 * a bug the buyer can do anything about, and a browser's broken-image glyph in a
 * grid of frames reads as "this app is broken" rather than "this frame has no
 * photo".
 */
export function FrameImage({
  src,
  alt,
  className,
  eager = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  /** Set on the first screenful so the catalogue does not fade in row by row. */
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  // Reset when the source changes — the expanded card swaps images as colours
  // are touched, and a previous failure must not blank a working photo.
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div
        className={cn('grid place-items-center bg-muted text-muted-foreground/40', className)}
        role="img"
        aria-label={alt}
      >
        <Glasses className="h-8 w-8" strokeWidth={1.4} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
