/**
 * The catalogue's name groups — brands, mostly — as one dropdown under the
 * search.
 *
 * It was a row of chips, one per name. With the POS catalogue synced in there
 * are dozens of names, and a chip row that long is one nobody scrolls to the
 * end of: a brand like "1st GemooD" sat many swipes to the right. A native
 * select lists every name with its count in the phone's own picker, and shows
 * the one chosen in the space a single chip took.
 *
 * Names are compared exactly (see `seriesOf`): "Soulmate" and "Soulmate 2" are
 * two entries, because to the shop they are two ranges. Hidden when there is
 * only one name — a dropdown with one choice is a control that does nothing.
 */
import { useMemo } from 'react';
import { ChevronDown, Tags, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/components/ui/utils';
import { useCatalogFilters } from '@/app/stores/catalog-filters-store';
import { listSeries } from '@/lib/catalog-query';
import type { FrameDoc } from '@/lib/product';

export function SeriesSelect({ frames }: { frames: readonly FrameDoc[] }) {
  const { t } = useTranslation();
  const selected = useCatalogFilters((s) => s.filters.series);
  const patch = useCatalogFilters((s) => s.patch);

  const series = useMemo(() => listSeries(frames), [frames]);

  if (series.length < 2) return null;

  // A remembered choice can name a brand that has since left the catalogue.
  // It stays listed, so the select shows what is actually filtering.
  const missing = selected !== null && !series.some((entry) => entry.name === selected);

  return (
    <div className="flex items-center gap-2 px-4 pb-2.5">
      <div className="relative min-w-0 flex-1">
        <Tags
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
            selected ? 'text-primary' : 'text-muted-foreground',
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
        <select
          value={selected ?? ''}
          onChange={(event) => patch({ series: event.target.value || null })}
          aria-label={t('catalog.seriesLabel')}
          className={cn(
            'h-10 w-full cursor-pointer appearance-none truncate rounded-full border pl-9 pr-9 font-myanmar text-sm font-semibold transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            selected
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-card text-foreground',
          )}
        >
          <option value="">{t('catalog.allSeries', { total: frames.length })}</option>
          {missing ? <option value={selected}>{selected}</option> : null}
          {series.map(({ name, count }) => (
            <option key={name} value={name}>
              {`${name} (${count})`}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </div>

      {selected ? (
        <button
          type="button"
          onClick={() => patch({ series: null })}
          aria-label={t('catalog.clearSeries')}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
