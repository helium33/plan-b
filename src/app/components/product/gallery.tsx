/**
 * Image and video gallery for the selected C-number.
 *
 * The gallery is keyed to the variant, not the frame: choosing a different colour
 * replaces the whole media set rather than filtering one long list. That is what
 * the shop's own data shape implies — each C-number is photographed separately —
 * and it means the thumbnail strip only ever shows media of the colour on screen.
 *
 * Video is listed alongside stills rather than in a separate tab. The clips exist
 * to show reflections and frame thickness, which is exactly what someone flicking
 * through photos is trying to judge, so making them a separate destination hides
 * them from the people who need them.
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Glasses, Play, Video as VideoIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/components/ui/utils';
import type { FrameVariant } from '@/lib/product';

type Slide =
  | { kind: 'image'; src: string }
  | { kind: 'video'; src: string };

export function ProductGallery({
  variant,
  frameName,
}: {
  variant: FrameVariant | undefined;
  frameName: string;
}) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const slides: Slide[] = [
    ...(variant?.images ?? []).map((src) => ({ kind: 'image' as const, src })),
    ...(variant?.videos ?? []).map((src) => ({ kind: 'video' as const, src })),
  ];

  // Reset to the first slide whenever the colour changes — slide 4 of the old
  // variant is meaningless in a set that may only have two.
  useEffect(() => {
    setIndex(0);
  }, [variant?.cNumber]);

  /**
   * Pause the video when navigating away from it.
   *
   * Without this, moving to the next still leaves audio playing from a clip that
   * is no longer on screen — the element stays mounted in the slide list.
   */
  useEffect(() => {
    const video = videoRef.current;
    if (video && slides[index]?.kind !== 'video') video.pause();
  }, [index, slides]);

  const current = slides[index];
  const canPage = slides.length > 1;

  const go = (delta: number) => {
    // Wraps, so paging never dead-ends at either edge.
    setIndex((value) => (value + delta + slides.length) % slides.length);
  };

  if (slides.length === 0) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-2xl border border-border bg-muted">
        <Glasses className="h-20 w-20 text-muted-foreground/25" strokeWidth={1.1} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-muted"
        // Arrow keys page the gallery, which is what a keyboard user reaches for.
        onKeyDown={(event) => {
          if (!canPage) return;
          if (event.key === 'ArrowRight') { event.preventDefault(); go(1); }
          if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1); }
        }}
        tabIndex={canPage ? 0 : -1}
        role="group"
        aria-label={t('product.galleryLabel', { name: frameName })}
      >
        <div className="aspect-[4/3]">
          {current.kind === 'image' ? (
            <img
              src={current.src}
              alt={t('product.imageAlt', { name: frameName, color: variant?.colorName ?? '' })}
              className="h-full w-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              src={current.src}
              controls
              // `muted` + `playsInline` so tapping play works on iOS without
              // going fullscreen, and autoplay policies do not block it.
              muted
              playsInline
              preload="metadata"
              className="h-full w-full bg-slate-950 object-contain"
            />
          )}
        </div>

        {canPage ? (
          <>
            <GalleryArrow side="left" onClick={() => go(-1)} label={t('product.previousImage')} />
            <GalleryArrow side="right" onClick={() => go(1)} label={t('product.nextImage')} />

            <span className="absolute bottom-3 right-3 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur" dir="ltr">
              {index + 1} / {slides.length}
            </span>
          </>
        ) : null}
      </div>

      {canPage ? (
        <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {slides.map((slide, slideIndex) => (
            <li key={`${slide.kind}-${slideIndex}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(slideIndex)}
                aria-current={slideIndex === index}
                aria-label={
                  slide.kind === 'video'
                    ? t('product.videoThumb')
                    : t('product.imageThumb', { number: slideIndex + 1 })
                }
                className={cn(
                  'relative block h-16 w-20 overflow-hidden rounded-lg border transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  slideIndex === index
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border opacity-70 hover:opacity-100',
                )}
              >
                {slide.kind === 'image' ? (
                  <img src={slide.src} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                ) : (
                  // A video has no still to show without decoding a frame, so the
                  // thumbnail is a labelled placeholder rather than a black box.
                  <span className="grid h-full w-full place-items-center bg-slate-900 text-white">
                    <VideoIcon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  </span>
                )}

                {slide.kind === 'video' ? (
                  <span className="absolute inset-0 grid place-items-center bg-slate-950/30">
                    <Play className="h-4 w-4 text-white" strokeWidth={2.4} aria-hidden="true" />
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function GalleryArrow({
  side,
  onClick,
  label,
}: {
  side: 'left' | 'right';
  onClick: () => void;
  label: string;
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'absolute top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/85 text-foreground backdrop-blur transition-colors hover:bg-background',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        side === 'left' ? 'left-3' : 'right-3',
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}
