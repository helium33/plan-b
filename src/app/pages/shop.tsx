/**
 * The shop: every frame, with filters, sorting and search.
 *
 * ── Filter state lives in the URL ──────────────────────────────────────────
 * `useSearchParams` is the single source of truth, not component state. That is
 * what makes a filtered view shareable, bookmarkable and survivable across the
 * back button — and it is what lets the lookbook link straight to
 * `/shop?frameCode=PBV-2041` without a second mechanism.
 *
 * The catalogue is fetched once and filtered in memory. Same reasoning as the
 * recommender: facet counts and multi-select filters cannot be expressed as a
 * Firestore query without a composite index per combination, and at this
 * catalogue size a single read is cheaper than any of them.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowUpDown,
  Filter,
  GitCompare,
  Loader2,
  Search,
  SearchX,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FilterPanel } from '@/app/components/shop/filter-panel';
import { ProductCard } from '@/app/components/product/product-card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { cn } from '@/app/components/ui/utils';
import { ROUTES } from '@/app/config/navigation';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { MAX_COMPARE, MIN_COMPARE, useCompareStore } from '@/app/stores/compare-store';
import { listFrames } from '@/lib/firestore/frames';
import type { FrameDoc } from '@/lib/product';
import {
  SORT_OPTIONS,
  type ShopFilters,
  type SortOption,
  activeFilterCount,
  applyShop,
  facetCounts,
  filtersToParams,
  paramsToFilters,
  priceBounds,
} from '@/lib/shop-filters';

export function ShopPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('pages.shop.title'));

  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, sort } = useMemo(() => paramsToFilters(searchParams), [searchParams]);

  const [frames, setFrames] = useState<FrameDoc[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /**
   * Local mirror of the search box.
   *
   * The URL is the source of truth, but writing to it on every keystroke would
   * push a history entry per character and make the back button useless. This
   * holds the typed value and commits it on submit or after a pause.
   */
  const [queryDraft, setQueryDraft] = useState(filters.query);
  useEffect(() => setQueryDraft(filters.query), [filters.query]);

  useEffect(() => {
    let active = true;

    listFrames()
      .then((result) => {
        if (active) setFrames(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, []);

  /** Writes filters back to the URL, replacing rather than pushing. */
  const update = (patch: Partial<ShopFilters>, nextSort: SortOption = sort) => {
    const next = { ...filters, ...patch };
    // `replace` so a session of ticking boxes leaves one history entry, not
    // twenty — otherwise "back" means "untick one thing" twenty times over.
    setSearchParams(filtersToParams(next, nextSort), { replace: true });
  };

  const clearAll = () => setSearchParams(new URLSearchParams(), { replace: true });

  const results = useMemo(
    () => (frames ? applyShop(frames, filters, sort) : []),
    [frames, filters, sort],
  );

  const counts = useMemo(
    () => facetCounts(frames ?? [], filters),
    [frames, filters],
  );

  const bounds = useMemo(() => priceBounds(frames ?? []), [frames]);
  const active = activeFilterCount(filters);

  const compare = useCompareStore();

  return (
    <div className="container-page py-8 sm:py-12">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('pages.shop.title')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t('pages.shop.description')}
        </p>
      </header>

      {/* Search + sort */}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            update({ query: queryDraft });
          }}
          className="relative min-w-0 flex-1 sm:max-w-sm"
        >
          <label htmlFor="shop-search" className="sr-only">
            {t('actions.searchPlaceholder')}
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.9}
            aria-hidden="true"
          />
          <Input
            id="shop-search"
            type="search"
            value={queryDraft}
            onChange={(event) => setQueryDraft(event.target.value)}
            // Committing on blur as well as submit: a customer who types and then
            // taps a filter expects the text to have taken effect.
            onBlur={() => {
              if (queryDraft !== filters.query) update({ query: queryDraft });
            }}
            placeholder={t('actions.searchPlaceholder')}
            className="pl-9 pr-9"
          />
          {queryDraft ? (
            <button
              type="button"
              onClick={() => {
                setQueryDraft('');
                update({ query: '' });
              }}
              aria-label={t('actions.clear')}
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
            </button>
          ) : null}
        </form>

        <div className="flex items-center gap-2">
          <ArrowUpDown
            className="h-4 w-4 shrink-0 text-muted-foreground"
            strokeWidth={1.9}
            aria-hidden="true"
          />
          <label htmlFor="shop-sort" className="sr-only">
            {t('shop.sortLabel')}
          </label>
          <select
            id="shop-sort"
            value={sort}
            onChange={(event) => update({}, event.target.value as SortOption)}
            className="rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`shop.sort.${option}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile filter trigger. The sidebar is always visible from `lg` up. */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden"
        >
          <Filter className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          {t('shop.filtersTitle')}
          {active > 0 ? (
            <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.65rem] font-semibold text-primary-foreground">
              {active}
            </span>
          ) : null}
        </Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <FilterPanel
            filters={filters}
            counts={counts}
            bounds={bounds}
            onChange={update}
            onClear={clearAll}
          />
        </aside>

        <div>
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            {frames === null
              ? t('common.loading')
              : t('shop.showing', { count: results.length, total: frames.length })}
          </p>

          {frames === null && !failed ? (
            <p className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('common.loading')}
            </p>
          ) : null}

          {failed ? (
            <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-sm font-medium text-foreground">{t('common.error')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('common.errorBody')}</p>
            </div>
          ) : null}

          {frames !== null && results.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                <SearchX className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <p className="mt-4 text-sm font-medium text-foreground">
                {frames.length === 0 ? t('shop.emptyCatalogue') : t('shop.noResults')}
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                {frames.length === 0 ? t('shop.emptyCatalogueBody') : t('shop.noResultsBody')}
              </p>
              {active > 0 ? (
                <Button variant="outline" size="sm" onClick={clearAll} className="mt-5">
                  {t('shop.clearAll', { count: active })}
                </Button>
              ) : null}
            </div>
          ) : null}

          {results.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((frame) => (
                <ProductCard key={frame.id} frame={frame} />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: '0%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            role="dialog"
            aria-modal="true"
            aria-label={t('shop.filtersTitle')}
            className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col border-l border-border bg-background"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-sm font-semibold text-foreground">{t('shop.filtersTitle')}</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label={t('nav.closeMenu')}
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <FilterPanel
                filters={filters}
                counts={counts}
                bounds={bounds}
                onChange={update}
                onClear={clearAll}
              />
            </div>

            <div className="border-t border-border p-4">
              <Button className="w-full" onClick={() => setDrawerOpen(false)}>
                {t('shop.showResults', { count: results.length })}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}

      {/* Compare tray — pinned, because a selection made while scrolling is
          worthless if the customer has to find their way back to act on it. */}
      {compare.ids.length > 0 ? (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur"
        >
          <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
            <p className="flex items-center gap-2 text-sm text-foreground">
              <GitCompare className="h-4 w-4 text-muted-foreground" strokeWidth={1.9} aria-hidden="true" />
              {t('shop.compareTray', { count: compare.ids.length, max: MAX_COMPARE })}
            </p>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => compare.clear()}>
                {t('actions.clear')}
              </Button>
              <Button asChild size="sm" disabled={compare.ids.length < MIN_COMPARE}>
                <Link
                  to={ROUTES.compare}
                  // A single frame has nothing to compare against, so the link is
                  // inert until there are two.
                  className={cn(compare.ids.length < MIN_COMPARE && 'pointer-events-none opacity-50')}
                >
                  {compare.ids.length < MIN_COMPARE
                    ? t('shop.compareNeedsTwo')
                    : t('actions.compare')}
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
