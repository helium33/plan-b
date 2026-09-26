/**
 * The catalogue — ငါတို့ကိုင်း. The app's landing page.
 *
 * ── One product per screen ─────────────────────────────────────────────────
 * The catalogue is a vertical swiper: one frame fills the screen, the next is
 * a flick away (see `product-swiper.tsx`). It replaced a single-column feed,
 * which replaced a five-across grid — each step removing whatever competed
 * with the one question the catalogue is for, "do I like the look of this?".
 * Price, material and size live in the order sheet Buy opens.
 *
 * ── New arrivals and best sellers ──────────────────────────────────────────
 * Badges on the slide rather than shelves of their own: a shelf of small cards
 * is exactly the shape this layout exists to get rid of. `selectNewArrivals`
 * decides which frames are new, so the badge stops appearing on its own.
 *
 * ── What stayed ────────────────────────────────────────────────────────────
 * Search and the attribute filters, in the sticky row and the sidebar. At one
 * model per screen, finding a specific code by swiping stops being viable
 * somewhere around thirty frames.
 *
 * ── Sizing ─────────────────────────────────────────────────────────────────
 * The swiper must fill exactly the space between the header and the bottom
 * bar, or a slide's Buy button ends up under the bar. `main` pads the bottom
 * by 5rem on a phone (the bar) and 2rem on a desktop; the header is 3.5rem.
 * With a draft in progress, the running-total bar and the cart button float
 * above the tab bar too, so the swiper gives up that much more.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FilterBar } from '@/app/components/catalog/filter-bar';
import { ProductModal } from '@/app/components/catalog/product-modal';
import { ProductSwiper } from '@/app/components/catalog/product-swiper';
import { SeriesChips } from '@/app/components/catalog/series-chips';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import { ROUTES } from '@/app/config/navigation';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { useFrames } from '@/app/hooks/use-frames';
import { usePosCatalogueSync } from '@/app/hooks/use-pos-catalogue-sync';
import { useCatalogFilters } from '@/app/stores/catalog-filters-store';
import { useFavouritesStore } from '@/app/stores/favourites-store';
import { draftPieceCount, useOrderStore } from '@/app/stores/order-store';
import { hasAnyFilter, queryCatalog } from '@/lib/catalog-query';
import { formatKyat } from '@/lib/format';
import { selectNewArrivals, type FrameDoc } from '@/lib/product';
import { priceOrder } from '@/lib/wholesale';

function SwiperSkeleton() {
  return (
    <div className="relative h-full bg-white" aria-hidden="true">
      <div className="absolute inset-x-8 bottom-44 top-16 animate-pulse rounded-3xl bg-muted" />
      <div className="absolute inset-x-3 bottom-3 space-y-2 rounded-3xl border border-border bg-card p-3">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-12 w-full animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

export function CatalogPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('nav.catalog'));

  const { frames, failed, reload } = useFrames();

  // The owner's visit pulls new POS frames into the catalogue; see the hook.
  usePosCatalogueSync(reload);

  const filters = useCatalogFilters((s) => s.filters);
  const clear = useCatalogFilters((s) => s.clear);

  const quantities = useOrderStore((s) => s.quantities);
  const favouriteIds = useFavouritesStore((s) => s.ids);

  /** The model whose order sheet is open, and the colour it opens on. */
  const [opened, setOpened] = useState<{ frame: FrameDoc; colour: string | null } | null>(null);

  const visible = useMemo(
    () => queryCatalog(frames ?? [], filters, favouriteIds),
    [frames, filters, favouriteIds],
  );

  // Priced against the whole catalogue, not the filtered view: the running total
  // must not drop because the buyer typed into the search box.
  const totals = useMemo(() => priceOrder(frames ?? [], quantities), [frames, quantities]);
  const pieces = draftPieceCount(quantities);

  // Re-read from the live catalogue rather than holding the object captured at
  // open time, so a stock or colour change lands in an open modal instead of
  // being frozen behind it.
  const openedFrame = useMemo(
    () => (opened ? (frames ?? []).find((f) => f.id === opened.frame.id) ?? opened.frame : null),
    [opened, frames],
  );

  const newIds = useMemo(
    () => new Set(selectNewArrivals(frames ?? []).map((frame) => frame.id)),
    [frames],
  );

  return (
    <div
      className={cn(
        'flex h-[calc(100dvh-8.5rem-env(safe-area-inset-bottom))] flex-col md:h-[calc(100dvh-5.5rem)]',
        pieces > 0 && 'pb-14 md:pb-20',
      )}
    >
      <div className="z-10 shrink-0 border-b border-border bg-background/95 backdrop-blur-md">
        <FilterBar savedCount={favouriteIds.length} />
        <SeriesChips frames={frames ?? []} />
      </div>

      <div className="min-h-0 flex-1">
        {failed ? (
          <div className="m-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center">
            <AlertTriangle
              className="mx-auto h-6 w-6 text-destructive"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-medium text-foreground">{t('catalog.loadFailed')}</p>
            <p className="mt-1 text-[0.8rem] text-muted-foreground">
              {t('catalog.loadFailedHint')}
            </p>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              {t('common.retry')}
            </Button>
          </div>
        ) : frames === null ? (
          <>
            <p className="sr-only" role="status">
              {t('common.loading')}
            </p>
            <SwiperSkeleton />
          </>
        ) : visible.length === 0 ? (
          <div className="m-4 rounded-2xl border border-border bg-card p-8 text-center">
            <SearchX
              className="mx-auto h-7 w-7 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-medium text-foreground">
              {frames.length === 0
                ? t('catalog.emptyTitle')
                : filters.savedOnly && favouriteIds.length === 0
                  ? t('catalog.noSavedTitle')
                  : t('catalog.noMatchTitle')}
            </p>
            <p className="mt-1 text-[0.8rem] leading-relaxed text-muted-foreground">
              {frames.length === 0
                ? t('catalog.emptyBody')
                : filters.savedOnly && favouriteIds.length === 0
                  ? t('catalog.noSavedBody')
                  : t('catalog.noMatchBody')}
            </p>

            {/* An empty *catalogue* is a setup problem, not a filter problem —
                point staff at the admin area rather than offering to clear
                filters that are not the reason nothing is showing. */}
            {frames.length === 0 ? (
              <Button asChild size="lg" variant="outline" className="mt-4">
                <Link to={ROUTES.admin}>{t('catalog.emptyAction')}</Link>
              </Button>
            ) : hasAnyFilter(filters) ? (
              <Button type="button" size="lg" variant="outline" className="mt-4" onClick={clear}>
                {t('catalog.clearFilters')}
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <ProductSwiper
              frames={visible}
              newIds={newIds}
              onBuy={(frame, colour) => setOpened({ frame, colour })}
              className="h-full"
            />

            {/* `aria-live` so a screen-reader user typing in the search box hears
                the result count change without leaving the field. */}
            <p aria-live="polite" className="sr-only">
              {t('catalog.showing', { shown: visible.length, total: frames.length })}
            </p>
          </>
        )}
      </div>

      {/*
        Running total, docked above the tab bar once anything is in the draft.

        It is a link rather than a summary because the answer to "what does this
        come to?" is always the voucher — repeating the arithmetic here would be
        a second place to keep it correct. It stops short of the right-hand edge
        so it never sits under the floating cart button.
      */}
      {pieces > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 px-4 md:bottom-6">
          <Link
            to={ROUTES.order}
            className="mx-auto flex min-h-14 w-full max-w-2xl items-center gap-3 rounded-2xl bg-primary py-3 pl-4 pr-20 text-primary-foreground shadow-lg transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 text-sm font-bold tabular-nums">
              {pieces > 99 ? '99+' : pieces}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.7rem] opacity-80">
                {t('catalog.draftTotal')}
              </span>
              <span className="block truncate text-sm font-semibold tabular-nums">
                {formatKyat(totals.subtotalKyat)}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-1 text-[0.8rem] font-semibold">
              <span className="font-myanmar">{t('catalog.viewVoucher')}</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
            </span>
          </Link>
        </div>
      ) : null}

      <ProductModal
        frame={openedFrame}
        initialColour={opened?.colour ?? null}
        onClose={() => setOpened(null)}
      />
    </div>
  );
}
