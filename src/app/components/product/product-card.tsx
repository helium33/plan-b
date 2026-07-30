/**
 * The frame card. Shared by the recommendations grid now and the shop grid in
 * Module 6, so hover, colour switching and badges behave identically in both.
 *
 * Colour switching happens **on the card**. Making someone open a product page
 * to find out whether a frame comes in tortoiseshell is the single most annoying
 * thing an eyewear shop can do, and swapping the image in place costs nothing
 * because every variant's photos are already in the document.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Glasses, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/components/ui/utils';
import { productPath } from '@/app/config/navigation';
import { useWishlist } from '@/app/hooks/use-wishlist';
import { MAX_COMPARE, useCompareStore } from '@/app/stores/compare-store';
import { formatKyat } from '@/lib/format';
import {
  type FrameDoc,
  type MatchReason,
  frameDisplayName,
  isInStock,
} from '@/lib/product';

export function ProductCard({
  frame,
  /** Match reasons from the recommender. Omitted in the plain shop grid. */
  reasons,
  /** Hidden on the compare page itself, where the checkbox would be circular. */
  showCompare = true,
  className,
}: {
  frame: FrameDoc;
  reasons?: MatchReason[];
  showCompare?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();

  const wishlist = useWishlist();
  const saved = wishlist.has(frame.id);

  const compare = useCompareStore();
  const inCompare = compare.ids.includes(frame.id);
  // Disabled only when full *and* this frame is not one of the chosen — otherwise
  // a full tray would trap the customer with no way to deselect.
  const compareDisabled = !inCompare && compare.ids.length >= MAX_COMPARE;

  // Default to the first variant that can actually be bought, so a card does not
  // open on a colour the customer cannot have.
  const [activeIndex, setActiveIndex] = useState(() => {
    const index = frame.variants.findIndex((variant) => variant.inStock);
    return index === -1 ? 0 : index;
  });

  const variant = frame.variants[activeIndex];
  const image = variant?.images[0] ?? null;
  const available = isInStock(frame);

  const discounted = frame.compareAtPrice !== null && frame.compareAtPrice > frame.price;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700',
        className,
      )}
    >
      <Link
        to={productPath(frame.id)}
        className="relative block aspect-[4/3] overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {image ? (
          <img
            src={image}
            // The frame name and colour are both rendered as text below, so a
            // descriptive alt here would be read out twice. Naming the colour is
            // the one thing the text does not tie to the image.
            alt={t('product.imageAlt', {
              name: frameDisplayName(frame),
              color: variant?.colorName ?? '',
            })}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-muted-foreground/30">
            <Glasses className="h-16 w-16" strokeWidth={1.1} aria-hidden="true" />
          </span>
        )}

        {/* Badges. Stacked top-left so they never collide with the wishlist button. */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {frame.categories.includes('New Arrival') ? (
            <Badge tone="brand">{t('attributes.category.New Arrival')}</Badge>
          ) : null}
          {frame.categories.includes('Best Seller') ? (
            <Badge tone="gold">{t('attributes.category.Best Seller')}</Badge>
          ) : null}
          {discounted ? (
            <Badge tone="sale">
              {t('product.percentOff', {
                percent: Math.round(
                  ((frame.compareAtPrice! - frame.price) / frame.compareAtPrice!) * 100,
                ),
              })}
            </Badge>
          ) : null}
        </div>

        {!available ? (
          <span className="absolute inset-0 grid place-items-center bg-background/70 text-sm font-medium text-foreground backdrop-blur-[2px]">
            {t('product.outOfStock')}
          </span>
        ) : null}
      </Link>

      {/*
        Saved state keeps the button visible; unsaved reveals it on hover.
        `opacity-100` when saved is not decoration — a heart that vanishes when the
        pointer leaves would make it impossible to see what you have saved while
        scanning the grid.
      */}
      <button
        type="button"
        onClick={() => wishlist.toggle(frame.id)}
        aria-pressed={saved}
        aria-label={
          saved
            ? t('shop.removeFromWishlist', { name: frameDisplayName(frame) })
            : t('shop.addToWishlist', { name: frameDisplayName(frame) })
        }
        className={cn(
          'absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-background/85 backdrop-blur transition-all',
          'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          saved
            ? 'text-destructive opacity-100'
            : 'text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100',
        )}
      >
        <Heart
          className="h-4 w-4"
          strokeWidth={1.9}
          // Filled when saved, so the state reads at a glance and not by colour
          // alone — which would be invisible to a colour-blind customer.
          fill={saved ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
      </button>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {frame.brand}
        </p>

        <h3 className="mt-1 text-sm font-medium leading-snug text-foreground">
          <Link
            to={productPath(frame.id)}
            className="hover:underline focus-visible:outline-none focus-visible:underline"
          >
            {frameDisplayName(frame)}
          </Link>
        </h3>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {t('product.frameCode', { code: frame.frameCode })}
        </p>

        {frame.variants.length > 1 ? (
          <div
            role="radiogroup"
            aria-label={t('product.colours')}
            className="mt-3 flex flex-wrap items-center gap-1.5"
          >
            {frame.variants.map((option, index) => (
              <button
                key={option.cNumber}
                type="button"
                role="radio"
                aria-checked={index === activeIndex}
                aria-label={`${option.colorName} (${option.cNumber})`}
                onClick={() => setActiveIndex(index)}
                title={`${option.colorName} · ${option.cNumber}`}
                className={cn(
                  'h-5 w-5 rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  index === activeIndex
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border hover:border-muted-foreground',
                  // Out-of-stock colours stay visible but are visibly struck
                  // through — knowing a colour exists but is unavailable is more
                  // useful than it vanishing.
                  !option.inStock && 'opacity-40',
                )}
                style={{ backgroundColor: option.swatch }}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-base font-semibold text-foreground">
            {formatKyat(frame.price, t('common.currency'))}
          </span>
          {discounted ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatKyat(frame.compareAtPrice!, t('common.currency'))}
            </span>
          ) : null}
        </div>

        {reasons && reasons.length > 0 ? <MatchReasons reasons={reasons} /> : null}

        {/* Compare toggle. `mt-auto` pins it to the bottom so the control sits on
            the same line across a row of cards with different title lengths. */}
        {showCompare ? (
          <label
            className={cn(
              'mt-auto flex cursor-pointer items-center gap-2 pt-3 text-xs transition-colors',
              inCompare ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              compareDisabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <input
              type="checkbox"
              checked={inCompare}
              disabled={compareDisabled}
              onChange={() => compare.toggle(frame.id)}
              className="h-3.5 w-3.5 rounded border-border"
            />
            {compareDisabled ? t('shop.compareFull', { max: MAX_COMPARE }) : t('actions.compare')}
          </label>
        ) : null}
      </div>
    </motion.article>
  );
}

/* ── Bits ──────────────────────────────────────────────────────────────────── */

function Badge({
  tone,
  children,
}: {
  tone: 'brand' | 'gold' | 'sale';
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide',
        tone === 'brand' && 'bg-brand-600 text-white',
        tone === 'gold' && 'bg-gold-500 text-slate-900',
        tone === 'sale' && 'bg-destructive text-white',
      )}
    >
      {children}
    </span>
  );
}

/**
 * Why the recommender picked this frame.
 *
 * Shown as explicit chips rather than a silent ranking. A recommendation the
 * customer cannot interrogate is one they have to take on trust, and "matches
 * your oval face" is the difference between a list and an explanation.
 */
function MatchReasons({ reasons }: { reasons: MatchReason[] }) {
  const { t } = useTranslation();

  return (
    <ul className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
      {reasons.map((reason) => (
        <li
          key={reason}
          className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.7rem] font-medium text-emerald-700 dark:text-emerald-400"
        >
          {t(`recommendations.reasons.${reason}`)}
        </li>
      ))}
    </ul>
  );
}
