/**
 * One model in the feed: a big picture, its model number, and one button.
 *
 * ── Why the feed is one product per row ────────────────────────────────────
 * This replaced a five-across grid of small cards. On the phones this shop's
 * buyers actually use, a grid card was about 160px wide — big enough to prove a
 * frame exists, not big enough to decide anything about it. Buyers were opening
 * every model just to see what it looked like, which made the grid a table of
 * contents rather than a catalogue.
 *
 * One product per row costs scrolling and buys a photograph you can judge. That
 * is the whole trade, and for a range of a few dozen models it is the right way
 * round. It would be the wrong way round for a range of a thousand, which is why
 * search and the filters stay available above the feed.
 *
 * ── The "collage" ──────────────────────────────────────────────────────────
 * The reference shows a single supplied collage photo per model. This shop's
 * catalogue does not store one — it stores a photo per colour — so the collage
 * is composed here from those, a hero shot above a strip of the other colours.
 * That means it works for every model already uploaded, with nothing new to
 * shoot, and it stays correct when a colour is added or withdrawn. A model with
 * only one photo simply shows that photo.
 *
 * ── What is deliberately not here ──────────────────────────────────────────
 * No price, no material, no size, no colour count. All of it is one tap away in
 * the modal. The feed answers "do I like the look of this?" and nothing else;
 * every extra line was another thing to read before that question got answered.
 */
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FrameImage } from '@/app/components/catalog/frame-image';
import { FavouriteButton } from '@/app/components/catalog/frame-chrome';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useOrderStore } from '@/app/stores/order-store';
import {
  frameDisplayName,
  orderableVariants,
  primaryImage,
  type FrameDoc,
} from '@/lib/product';

/** Colour shots beside the hero. Past this the strip stops reading as a set. */
const MAX_STRIP = 5;

export function ProductRow({
  frame,
  eager,
  onBuy,
}: {
  frame: FrameDoc;
  eager?: boolean;
  onBuy: (frame: FrameDoc) => void;
}) {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();

  // Narrow subscription: the feed can be dozens of rows, and a stepper tap in
  // the modal must not re-render every one of them.
  const pieces = useOrderStore((state) => {
    const line = state.quantities[frame.id];
    if (!line) return 0;
    return Object.values(line).reduce((sum, qty) => sum + qty, 0);
  });

  const name = frameDisplayName(frame);
  const variants = orderableVariants(frame);

  const shots = variants
    .map((variant) => variant.images[0])
    .filter((src): src is string => Boolean(src));

  const hero = shots[0] ?? primaryImage(frame);
  const strip = shots.slice(1, 1 + MAX_STRIP);

  return (
    <article className="overflow-hidden border-y border-border bg-card sm:rounded-3xl sm:border">
      {/* ── The picture ──────────────────────────────────────────────────── */}
      <div className="relative">
        {/* White, not `bg-muted`: the range is shot on white, and a grey plate
            behind a white-backed photo reads as an image that failed to load. */}
        <div className="w-full bg-white">
          <FrameImage
            src={hero}
            alt={name}
            eager={eager}
            className="max-h-[58vh] w-full object-contain"
          />
        </div>

        {strip.length > 0 ? (
          <div
            className="grid gap-px border-t border-border bg-border"
            style={{ gridTemplateColumns: `repeat(${strip.length}, minmax(0, 1fr))` }}
          >
            {strip.map((src, index) => (
              <div key={src} className="bg-white">
                <FrameImage
                  src={src}
                  alt=""
                  eager={eager && index < 2}
                  className="aspect-square w-full object-contain"
                />
              </div>
            ))}
          </div>
        ) : null}

        {frame.bestSeller ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
            <Star className="h-3 w-3" strokeWidth={2.6} aria-hidden="true" />
            <span className="font-myanmar">{t('catalog.bestSellerBadge')}</span>
          </span>
        ) : null}

        <FavouriteButton frameId={frame.id} frameName={name} className="absolute right-3 top-3" />
      </div>

      {/* ── The model number and the one button ──────────────────────────── */}
      <div className="flex flex-col items-center gap-3 p-4 sm:flex-row sm:justify-between">
        <div className="min-w-0 text-center sm:text-left">
          <p className="truncate text-lg font-bold tracking-tight text-foreground" dir="ltr">
            {t('catalog.modelLabel')}: {frame.frameCode}
          </p>
          {pieces > 0 ? (
            <p className="mt-0.5 text-[0.78rem] font-medium text-primary">
              {t('catalog.pieces', { count: pieces })}
            </p>
          ) : null}
        </div>

        {isSignedIn ? (
          <button
            type="button"
            onClick={() => onBuy(frame)}
            className="min-h-12 w-full shrink-0 rounded-2xl bg-primary px-10 text-base font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:w-auto"
          >
            <span className="font-myanmar">{t('catalog.buyNow')}</span>
          </button>
        ) : (
          /*
            Still exactly one button, and still the same size and place — a
            signed-out buyer should not meet a different-shaped screen. It just
            goes somewhere else. A disabled button, or the reference's alert()
            on tap, both say "no" without saying how to fix it.
          */
          <Link
            to={ROUTES.signIn}
            className="flex min-h-12 w-full shrink-0 items-center justify-center rounded-2xl border-2 border-primary px-8 text-base font-bold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:w-auto"
          >
            <span className="font-myanmar">{t('catalog.signInToShop')}</span>
          </Link>
        )}
      </div>
    </article>
  );
}
