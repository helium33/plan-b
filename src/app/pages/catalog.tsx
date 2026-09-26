/**
 * The catalogue — ငါတို့ကိုင်း. The app's landing page.
 *
 * ── One product per row ────────────────────────────────────────────────────
 * The feed shows a big picture, the model number, and one button. That is the
 * whole page. It replaced a five-across grid whose cards were about 160px wide
 * on a phone — enough to prove a frame existed, not enough to decide anything
 * about it, so buyers opened every model just to see it properly.
 *
 * Everything that used to sit under each card — price, material, shape, colour
 * count — moved into the modal. None of it helped answer the only question the
 * feed is for, which is "do I like the look of this one?".
 *
 * ── What is not here any more, and why ─────────────────────────────────────
 * The New Arrivals and Best Sellers rails are gone. They were horizontal strips
 * of small cards, which is precisely the shape this layout exists to get rid
 * of, and at one product per row they would have pushed the catalogue itself
 * two screens down. Best sellers keep a badge on the row instead, so the
 * information survives without a second layout carrying it.
 *
 * ── What stayed, against the letter of the brief ───────────────────────────
 * Search and the attribute filters. They are not *in* the feed — they are in
 * the sticky row and the sidebar — and a single-column catalogue is the layout
 * that needs them most: at roughly one model per screen, finding a specific
 * code by scrolling stops being viable somewhere around thirty frames.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FilterBar } from '@/app/components/catalog/filter-bar';
import { ProductModal } from '@/app/components/catalog/product-modal';
import { ProductRow } from '@/app/components/catalog/product-row';
import { Button } from '@/app/components/ui/button';
import { ROUTES } from '@/app/config/navigation';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { useFrames } from '@/app/hooks/use-frames';
import { useCatalogFilters } from '@/app/stores/catalog-filters-store';
import { useFavouritesStore } from '@/app/stores/favourites-store';
import { draftPieceCount, useOrderStore } from '@/app/stores/order-store';
import { hasAnyFilter, queryCatalog } from '@/lib/catalog-query';
import { formatKyat } from '@/lib/format';
import type { FrameDoc } from '@/lib/product';
import { priceOrder } from '@/lib/wholesale';

/** Rows rendered with eager images — roughly the first screenful, which at this
    size is one row and the top of the next. */
const EAGER_ROWS = 2;

function FeedSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden border-y border-border bg-card sm:rounded-3xl sm:border"
        >
          <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="h-12 w-40 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CatalogPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('nav.catalog'));

  const { frames, failed } = useFrames();

  const filters = useCatalogFilters((s) => s.filters);
  const clear = useCatalogFilters((s) => s.clear);

  const quantities = useOrderStore((s) => s.quantities);
  const favouriteIds = useFavouritesStore((s) => s.ids);

  /** The model whose modal is open. `null` when the feed is just a feed. */
  const [opened, setOpened] = useState<FrameDoc | null>(null);

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
    () => (opened ? (frames ?? []).find((f) => f.id === opened.id) ?? opened : null),
    [opened, frames],
  );

  return (
    <div className="flex flex-col">
      <div className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur-md">
        <FilterBar savedCount={favouriteIds.length} />
      </div>

      <div className="py-3 sm:px-4">
        {failed ? (
          <div className="mx-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center sm:mx-0">
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
            <FeedSkeleton />
          </>
        ) : visible.length === 0 ? (
          <div className="mx-4 rounded-2xl border border-border bg-card p-8 text-center sm:mx-0">
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
            {/* `max-w-2xl` rather than the shell's full width: a photograph
                stretched across a 1280px desktop is not more useful, it is just
                further from the button underneath it. */}
            <div className="mx-auto max-w-2xl space-y-6 sm:space-y-8">
              {visible.map((frame, index) => (
                <ProductRow
                  key={frame.id}
                  frame={frame}
                  eager={index < EAGER_ROWS}
                  onBuy={setOpened}
                />
              ))}
            </div>

            {/* `aria-live` so a screen-reader user typing in the search box hears
                the result count change without leaving the field. */}
            <p
              aria-live="polite"
              className="px-4 pt-6 text-center text-[0.72rem] text-muted-foreground"
            >
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

      <ProductModal frame={openedFrame} onClose={() => setOpened(null)} />
    </div>
  );
}
