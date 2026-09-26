/**
 * The catalogue's sticky top row: search, the All/Saved tabs, and — on a phone —
 * the way in to the attribute filters.
 *
 * ── How the filters ended up split across two places ───────────────────────
 * Everything used to live in one collapsible panel above the grid. On a desktop
 * that panel now duplicates the left sidebar, and on a phone it cost four rows
 * of vertical space above a catalogue people came to look at.
 *
 * So the controls are split by how often they are touched rather than by what
 * they are. Search and All/Saved are reached for constantly and stay on screen
 * at every size. Category, material and shape are set once and left alone, so
 * they live in the sidebar on a desktop and behind this row's Filters button on
 * a phone — rendered from the same `CatalogFilterGroups` in both cases.
 *
 * The button carries a count of what is active, because a filter you have
 * forgotten is switched on is the one way this arrangement could mislead: on a
 * phone the chips are not visible, and an empty-looking catalogue has to be
 * explainable without opening anything.
 */
import { useState } from 'react';
import { Heart, Search, SlidersHorizontal, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CatalogFilterGroups, Chip } from '@/app/components/catalog/filter-groups';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/app/components/ui/sheet';
import { cn } from '@/app/components/ui/utils';
import { useCatalogFilters } from '@/app/stores/catalog-filters-store';
import { activeFilterCount } from '@/lib/catalog-query';

export function FilterBar({ savedCount }: { savedCount: number }) {
  const { t } = useTranslation();

  const filters = useCatalogFilters((s) => s.filters);
  const patch = useCatalogFilters((s) => s.patch);

  const [sheetOpen, setSheetOpen] = useState(false);
  const activeCount = activeFilterCount(filters);

  return (
    <div className="flex items-center gap-2 px-4 py-2.5">
      {/* ── Filters, phone only — the sidebar has these on a desktop ──────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label={t('catalog.openFilters')}
            className={cn(
              'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[0.8rem] font-medium transition-colors md:hidden',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              activeCount > 0
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {activeCount > 0 ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.68rem] font-bold text-primary-foreground">
                {activeCount}
              </span>
            ) : null}
          </button>
        </SheetTrigger>

        {/*
          `aria-describedby={undefined}` opts out of Radix's description slot
          rather than filling it. The only sentence available to put there is
          the title again, and a screen reader announcing "Filters. Filters." is
          worse than one announcing the title alone.
        */}
        <SheetContent
          side="left"
          aria-describedby={undefined}
          className="w-[86%] max-w-sm overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="font-myanmar">{t('catalog.filtersTitle')}</SheetTitle>
          </SheetHeader>

          <div className="px-4 pb-8">
            <CatalogFilterGroups />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={2}
          aria-hidden="true"
        />
        <input
          type="search"
          value={filters.query}
          onChange={(event) => patch({ query: event.target.value })}
          placeholder={t('catalog.searchPlaceholder')}
          aria-label={t('catalog.searchLabel')}
          // `search` type gives iOS the right keyboard; the explicit button
          // below covers every other platform's missing clear affordance.
          className="h-11 w-full rounded-full border border-border bg-card pl-9 pr-11 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
        />
        {filters.query ? (
          <button
            type="button"
            onClick={() => patch({ query: '' })}
            aria-label={t('catalog.clearSearch')}
            className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {/* ── All / Saved ──────────────────────────────────────────────────── */}
      <div className="flex shrink-0 gap-2">
        <Chip active={!filters.savedOnly} onClick={() => patch({ savedOnly: false })}>
          <span className="font-myanmar">{t('catalog.tabAll')}</span>
        </Chip>

        <Chip active={filters.savedOnly} onClick={() => patch({ savedOnly: true })}>
          <Heart
            className={cn('h-3.5 w-3.5 sm:mr-1.5', filters.savedOnly && 'fill-current')}
            strokeWidth={2.2}
            aria-hidden="true"
          />
          <span className="hidden font-myanmar sm:inline">{t('catalog.tabSaved')}</span>
          {savedCount > 0 ? <span className="ml-1.5 tabular-nums">{savedCount}</span> : null}
        </Chip>
      </div>
    </div>
  );
}
