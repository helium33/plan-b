/**
 * The catalogue, one product per screen — swipe up for the next.
 *
 * ── Why a vertical swiper ──────────────────────────────────────────────────
 * The single-column feed made each frame big; this makes each frame the only
 * thing on screen. A buyer deciding "do I like this one?" gets one photograph,
 * edge to edge, and the next model is one flick away — the gesture everyone
 * already knows from short-video apps. Nothing half-visible below the fold
 * competes for the decision.
 *
 * It is native scrolling with CSS scroll-snap, not a carousel library: the
 * browser's own momentum, the trackpad and the mouse wheel all just work, and
 * there is no JavaScript between a finger and the page. JavaScript only
 * watches which slide is showing, for the counter and the keyboard.
 *
 * ── What sits on the photograph ────────────────────────────────────────────
 * The wishlist heart in the corner, and at the bottom one panel: the model
 * number, its colours as swatches, and the Buy button. A swatch changes the
 * photograph to that colour — the collage became the swatch row, so the one
 * image on screen is always the colour being looked at — and Buy opens the
 * order sheet on that colour. Signed out, Buy becomes "Sign in to shop", in
 * the same place and size: the screen does not change shape, only where the
 * button goes.
 *
 * ── Images ─────────────────────────────────────────────────────────────────
 * Only slides within a few of the one showing render their photo. A catalogue
 * of eighty models is eighty full-screen images; loading them all on arrival
 * would spend a buyer's mobile data on frames they will never reach.
 */
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ShoppingBag, Sparkles, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FavouriteButton } from '@/app/components/catalog/frame-chrome';
import { FrameImage } from '@/app/components/catalog/frame-image';
import { cn } from '@/app/components/ui/utils';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useOrderStore } from '@/app/stores/order-store';
import {
  frameDisplayName,
  orderableVariants,
  primaryImage,
  type FrameDoc,
} from '@/lib/product';

/** Slides either side of the current one whose photos are loaded. */
const RENDER_WINDOW = 2;

/** Swatches shown before the row collapses into "+N". */
const MAX_SWATCHES = 7;

type SlideProps = {
  frame: FrameDoc;
  index: number;
  total: number;
  isNew: boolean;
  near: boolean;
  onBuy: (frame: FrameDoc, cNumber: string | null) => void;
};

function Slide({ frame, index, total, isNew, near, onBuy }: SlideProps) {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();

  const variants = orderableVariants(frame);
  const [shownC, setShownC] = useState<string | null>(variants[0]?.cNumber ?? null);
  const shown = variants.find((v) => v.cNumber === shownC) ?? variants[0] ?? null;

  // Narrow subscription: a stepper tap in the order sheet must not re-render
  // every slide in the catalogue.
  const pieces = useOrderStore((state) => {
    const line = state.quantities[frame.id];
    return line ? Object.values(line).reduce((sum, qty) => sum + qty, 0) : 0;
  });

  const name = frameDisplayName(frame);
  const image = shown?.images[0] ?? primaryImage(frame);
  const extra = variants.length - MAX_SWATCHES;

  return (
    <article
      aria-roledescription={t('swiper.slide')}
      aria-label={t('swiper.position', { current: index + 1, total, name })}
      className="relative h-full w-full overflow-hidden bg-white"
    >
      {/* ── The one image ────────────────────────────────────────────────── */}
      {near ? (
        <FrameImage
          src={image}
          alt={shown ? `${name} — ${shown.cNumber} ${shown.colorName}` : name}
          eager
          className="h-full w-full object-contain pb-40 pt-14"
        />
      ) : (
        <div className="h-full w-full" aria-hidden="true" />
      )}

      {/* ── Top: badges, counter, wishlist ─────────────────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <div className="flex flex-wrap gap-1.5">
          {frame.bestSeller ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
              <Star className="h-3 w-3" strokeWidth={2.6} aria-hidden="true" />
              <span className="font-myanmar">{t('catalog.bestSellerBadge')}</span>
            </span>
          ) : null}
          {isNew ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-background shadow-sm">
              <Sparkles className="h-3 w-3" strokeWidth={2.6} aria-hidden="true" />
              <span className="font-myanmar">{t('swiper.newBadge')}</span>
            </span>
          ) : null}
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <span
            className="rounded-full bg-black/55 px-2.5 py-1 text-[0.7rem] font-semibold tabular-nums text-white"
            aria-hidden="true"
          >
            {index + 1} / {total}
          </span>
          <FavouriteButton frameId={frame.id} frameName={name} />
        </div>
      </div>

      {/* ── Bottom: model, colours, the one button ────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="mx-auto max-w-xl rounded-3xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="min-w-0 truncate text-lg font-bold tracking-tight text-foreground" dir="ltr">
              {t('catalog.modelLabel')}: {frame.frameCode}
            </p>
            {shown ? (
              <p className="shrink-0 truncate text-[0.78rem] font-medium text-muted-foreground" dir="ltr">
                {shown.cNumber} · {shown.colorName}
              </p>
            ) : null}
          </div>

          {variants.length > 1 ? (
            <div
              role="radiogroup"
              aria-label={t('swiper.colours')}
              className="mt-2 flex items-center gap-1.5 overflow-x-auto px-0.5 pb-0.5"
            >
              {variants.slice(0, MAX_SWATCHES).map((variant) => {
                const active = variant.cNumber === shown?.cNumber;
                return (
                  <button
                    key={variant.cNumber}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={`${variant.cNumber} ${variant.colorName}`}
                    onClick={() => setShownC(variant.cNumber)}
                    className={cn(
                      'grid h-11 w-11 shrink-0 place-items-center rounded-full transition-transform active:scale-95',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      style={{ backgroundColor: variant.swatch }}
                      className={cn(
                        'h-8 w-8 rounded-full border border-black/10 shadow-inner dark:border-white/15',
                        active && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                      )}
                    />
                  </button>
                );
              })}
              {extra > 0 ? (
                <span className="shrink-0 px-1 text-[0.75rem] font-semibold text-muted-foreground">
                  +{extra}
                </span>
              ) : null}
            </div>
          ) : null}

          {isSignedIn ? (
            <button
              type="button"
              onClick={() => onBuy(frame, shown?.cNumber ?? null)}
              className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
              <span className="font-myanmar">{t('catalog.buyNow')}</span>
              {pieces > 0 ? (
                <span className="rounded-full bg-white/20 px-2 text-sm tabular-nums">{pieces}</span>
              ) : null}
            </button>
          ) : (
            <Link
              to={ROUTES.signIn}
              className="mt-2 flex min-h-12 w-full items-center justify-center rounded-2xl border-2 border-primary px-6 text-base font-bold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="font-myanmar">{t('catalog.signInToShop')}</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductSwiper({
  frames,
  newIds,
  onBuy,
  className,
}: {
  frames: readonly FrameDoc[];
  /** Frames to badge as new arrivals — decided by the catalogue, not here. */
  newIds: ReadonlySet<string>;
  onBuy: (frame: FrameDoc, cNumber: string | null) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const scroller = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  // The list's identity, by content. The array itself is rebuilt whenever the
  // catalogue re-filters — including when a heart is tapped — and resetting on
  // that would throw the buyer back to the first frame for saving one.
  const listKey = frames.map((frame) => frame.id).join('|');

  // Which slide is showing: the one more than half on screen. An observer
  // rather than a scroll handler, so nothing runs per scroll frame.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setCurrent(Number((entry.target as HTMLElement).dataset.index));
          }
        }
      },
      { root, threshold: 0.55 },
    );

    for (const child of Array.from(root.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [listKey]);

  // A filter change swaps the list under the scroller; start it from the top
  // rather than leaving the buyer on slide 14 of a list that now has 3.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    setCurrent(0);
  }, [listKey]);

  const goTo = useCallback(
    (index: number) => {
      const root = scroller.current;
      const target = root?.children[Math.max(0, Math.min(frames.length - 1, index))];
      if (!(target instanceof HTMLElement) || !root) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      root.scrollTo({ top: target.offsetTop, behavior: reduce ? 'auto' : 'smooth' });
    },
    [frames.length],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Leave typing and in-panel controls alone; only the swiper itself pages.
    if (event.target !== event.currentTarget) return;
    if (['ArrowDown', 'PageDown', 'j', ' '].includes(event.key)) {
      event.preventDefault();
      goTo(current + 1);
    } else if (['ArrowUp', 'PageUp', 'k'].includes(event.key)) {
      event.preventDefault();
      goTo(current - 1);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div
        ref={scroller}
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="region"
        aria-roledescription={t('swiper.carousel')}
        aria-label={t('swiper.label')}
        className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-scrollbar]:hidden"
      >
        {frames.map((frame, index) => (
          <div key={frame.id} data-index={index} className="h-full snap-start snap-always">
            <Slide
              frame={frame}
              index={index}
              total={frames.length}
              isNew={newIds.has(frame.id)}
              near={Math.abs(index - current) <= RENDER_WINDOW}
              onBuy={onBuy}
            />
          </div>
        ))}
      </div>

      {/* Mouse and keyboard users get explicit steps; on a phone, the thumb. */}
      <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 flex-col gap-2 md:flex">
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          aria-label={t('swiper.previous')}
          className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background/90 text-foreground shadow-sm backdrop-blur transition-opacity hover:bg-background disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronUp className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          disabled={current >= frames.length - 1}
          aria-label={t('swiper.next')}
          className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background/90 text-foreground shadow-sm backdrop-blur transition-opacity hover:bg-background disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      {/* The first time through, say that there is more below. */}
      {current === 0 && frames.length > 1 ? (
        <p
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-[10.5rem] flex justify-center"
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-3 py-1 text-[0.72rem] font-medium text-white motion-safe:animate-bounce">
            <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.4} />
            <span className="font-myanmar">{t('swiper.hint')}</span>
          </span>
        </p>
      ) : null}
    </div>
  );
}
