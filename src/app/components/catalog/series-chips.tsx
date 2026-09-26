/**
 * The catalogue's name groups, as one scrolling row of chips.
 *
 * Every distinct name in the catalogue gets a chip, with how many models it
 * holds. Names are compared exactly (see `seriesOf`): "Soulmate" and
 * "Soulmate 2" are two chips, because to the shop they are two ranges.
 *
 * Hidden when there is only one name — a single chip that filters to
 * everything is a control that does nothing.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/app/components/catalog/filter-groups';
import { useCatalogFilters } from '@/app/stores/catalog-filters-store';
import { listSeries } from '@/lib/catalog-query';
import type { FrameDoc } from '@/lib/product';

export function SeriesChips({ frames }: { frames: readonly FrameDoc[] }) {
  const { t } = useTranslation();
  const selected = useCatalogFilters((s) => s.filters.series);
  const patch = useCatalogFilters((s) => s.patch);

  const series = useMemo(() => listSeries(frames), [frames]);

  if (series.length < 2) return null;

  return (
    <div
      role="toolbar"
      aria-label={t('catalog.seriesLabel')}
      className="flex gap-2 overflow-x-auto px-4 pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <Chip active={selected === null} onClick={() => patch({ series: null })}>
        <span className="font-myanmar">{t('catalog.all')}</span>
      </Chip>

      {series.map(({ name, count }) => (
        <Chip
          key={name}
          active={selected === name}
          onClick={() => patch({ series: selected === name ? null : name })}
        >
          <span className="whitespace-nowrap">{name}</span>
          <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
        </Chip>
      ))}
    </div>
  );
}
