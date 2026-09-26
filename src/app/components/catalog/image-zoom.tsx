/**
 * Full-screen photo preview for a frame's colourway.
 *
 * ── Why this earns its place ───────────────────────────────────────────────
 * A card thumbnail is roughly 160px wide on a phone. That is enough to tell a
 * round frame from a square one and nothing else — not the hinge, not the finish,
 * not whether the "tortoiseshell" is the warm one or the cold one. A wholesale
 * buyer committing to a dozen pieces needs to see the actual frame, and the
 * alternative to a zoom is a phone call to ask.
 *
 * Arrow keys and a thumbnail strip move between the angles the shop uploaded,
 * because the second photo is usually the one that answers the question.
 */
import { useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FrameImage } from '@/app/components/catalog/frame-image';
import { cn } from '@/app/components/ui/utils';

export type ZoomSubject = {
  /** Every image for the colourway being previewed. */
  images: string[];
  /** Accessible label — the frame name and the colour. */
  label: string;
  /** Shown under the photo, e.g. `C2 · Navy`. */
  caption: string;
};

export function ImageZoom({
  subject,
  onClose,
}: {
  /** `null` closes the dialog. */
  subject: ZoomSubject | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  const images = subject?.images ?? [];
  const count = images.length;

  // Reset to the first angle whenever a different colourway is opened, so the
  // preview never starts on photo 3 of a frame the buyer has not seen yet.
  useEffect(() => setIndex(0), [subject?.caption]);

  useEffect(() => {
    if (!subject || count < 2) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setIndex((i) => (i + 1) % count);
      if (event.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [subject, count]);

  return (
    <DialogPrimitive.Root open={subject !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        {/*
          ── No exit animation, deliberately ───────────────────────────────
          Radix holds a closing node mounted until it observes an `animationend`
          for the exit animation. In this app that event does not reliably
          arrive, which leaves a *full-screen opaque* preview sitting over the
          catalogue with no way to dismiss it — the worst possible version of
          this bug. Entering still animates; closing is instant, which is what
          dismissing a photo should feel like anyway.

          The same applies to the walkthrough modal; see the note there.
        */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <DialogPrimitive.Title className="sr-only">
            {subject?.label ?? ''}
          </DialogPrimitive.Title>

          <div className="flex justify-end p-3">
            <DialogPrimitive.Close
              aria-label={t('catalog.closePreview')}
              className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-3">
            <FrameImage
              src={images[index] ?? null}
              alt={subject?.label ?? ''}
              eager
              className="max-h-full max-w-full rounded-2xl bg-white object-contain"
            />

            {count > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i - 1 + count) % count)}
                  aria-label={t('catalog.previousPhoto')}
                  className="absolute left-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i + 1) % count)}
                  aria-label={t('catalog.nextPhoto')}
                  className="absolute right-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
                </button>
              </>
            ) : null}
          </div>

          <div className="shrink-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-center">
            <p className="text-sm font-medium text-white" dir="ltr">
              {subject?.caption ?? ''}
            </p>

            {count > 1 ? (
              <div className="mt-3 flex justify-center gap-2">
                {images.map((image, i) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={t('catalog.photoNumber', { number: i + 1 })}
                    aria-current={i === index}
                    className={cn(
                      'h-12 w-12 overflow-hidden rounded-lg border-2 transition-colors',
                      i === index ? 'border-white' : 'border-transparent opacity-60',
                    )}
                  >
                    <FrameImage src={image} alt="" className="h-full w-full bg-white" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
