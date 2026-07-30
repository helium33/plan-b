/**
 * The filter sidebar.
 *
 * Each facet shows a count of how many frames the option would add, computed
 * against the *other* filters. That count is the difference between a filter list
 * and a usable one: without it a customer ticks boxes until the grid empties and
 * has no idea which choice did it.
 *
 * Options that would return nothing are shown disabled rather than hidden. A list
 * that changes length as you tick things is disorienting, and knowing the shop has
 * no titanium in your size is genuinely useful information.
 */
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/components/ui/utils';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import {
  CATEGORIES,
  COMFORT_FEATURES,
  FACE_SHAPES,
  FRAME_SIZES,
  MATERIALS,
} from '@/lib/attributes';
import { type ShopFilters, activeFilterCount, facetCounts } from '@/lib/shop-filters';
import { formatKyat } from '@/lib/format';

export function FilterPanel({
  filters,
  counts,
  bounds,
  onChange,
  onClear,
}: {
  filters: ShopFilters;
  counts: ReturnType<typeof facetCounts>;
  bounds: { min: number; max: number };
  onChange: (next: Partial<ShopFilters>) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const active = activeFilterCount(filters);

  /** Adds or removes a value from one of the array facets. */
  const toggle = <K extends 'faceShapes' | 'frameSizes' | 'materials' | 'comfortFeatures' | 'categories'>(
    key: K,
    value: ShopFilters[K][number],
  ) => {
    const current = filters[key] as string[];
    onChange({
      [key]: current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value],
    } as Partial<ShopFilters>);
  };

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">{t('shop.filtersTitle')}</h2>
        {active > 0 ? (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-auto px-2 py-1 text-xs">
            {t('shop.clearAll', { count: active })}
          </Button>
        ) : null}
      </div>

      {/* Stock — first, because it is the one filter that changes what is
          purchasable rather than what is shown. */}
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
        <input
          type="checkbox"
          checked={filters.inStockOnly}
          onChange={(event) => onChange({ inStockOnly: event.target.checked })}
          className="h-4 w-4 rounded border-border"
        />
        {t('shop.inStockOnly')}
      </label>

      <FacetGroup title={t('shop.facets.faceShape')}>
        {FACE_SHAPES.map((value) => (
          <FacetCheckbox
            key={value}
            label={t(`attributes.faceShape.${value}`)}
            count={counts.faceShapes[value] ?? 0}
            checked={filters.faceShapes.includes(value)}
            onChange={() => toggle('faceShapes', value)}
          />
        ))}
      </FacetGroup>

      <FacetGroup title={t('shop.facets.frameSize')}>
        {FRAME_SIZES.map((value) => (
          <FacetCheckbox
            key={value}
            label={t(`attributes.frameSize.${value}`)}
            count={counts.frameSizes[value] ?? 0}
            checked={filters.frameSizes.includes(value)}
            onChange={() => toggle('frameSizes', value)}
          />
        ))}
      </FacetGroup>

      <FacetGroup title={t('shop.facets.category')}>
        {CATEGORIES.map((value) => (
          <FacetCheckbox
            key={value}
            label={t(`attributes.category.${value}`)}
            count={counts.categories[value] ?? 0}
            checked={filters.categories.includes(value)}
            onChange={() => toggle('categories', value)}
          />
        ))}
      </FacetGroup>

      <FacetGroup title={t('shop.facets.material')}>
        {MATERIALS.map((value) => (
          <FacetCheckbox
            key={value}
            label={t(`attributes.material.${value}`)}
            count={counts.materials[value] ?? 0}
            checked={filters.materials.includes(value)}
            onChange={() => toggle('materials', value)}
          />
        ))}
      </FacetGroup>

      {/* The one AND-within facet, so it is labelled as requirements. */}
      <FacetGroup title={t('shop.facets.comfort')} hint={t('shop.comfortHint')}>
        {COMFORT_FEATURES.map((value) => (
          <FacetCheckbox
            key={value}
            label={t(`attributes.comfort.${value}`)}
            count={counts.comfortFeatures[value] ?? 0}
            checked={filters.comfortFeatures.includes(value)}
            onChange={() => toggle('comfortFeatures', value)}
          />
        ))}
      </FacetGroup>

      <FacetGroup title={t('shop.priceTitle')}>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            inputMode="numeric"
            value={filters.minPrice === null ? '' : String(filters.minPrice)}
            onChange={(event) => {
              const digits = event.target.value.replace(/[^\d]/g, '');
              onChange({ minPrice: digits ? Number(digits) : null });
            }}
            placeholder={String(bounds.min)}
            aria-label={t('shop.minPrice')}
            className="h-9 text-sm"
            dir="ltr"
          />
          <span aria-hidden="true" className="text-muted-foreground">
            –
          </span>
          <Input
            type="text"
            inputMode="numeric"
            value={filters.maxPrice === null ? '' : String(filters.maxPrice)}
            onChange={(event) => {
              const digits = event.target.value.replace(/[^\d]/g, '');
              onChange({ maxPrice: digits ? Number(digits) : null });
            }}
            placeholder={String(bounds.max)}
            aria-label={t('shop.maxPrice')}
            className="h-9 text-sm"
            dir="ltr"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t('shop.priceRangeHint', {
            min: formatKyat(bounds.min, t('common.currency')),
            max: formatKyat(bounds.max, t('common.currency')),
          })}
        </p>
      </FacetGroup>
    </div>
  );
}

function FacetGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </legend>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      <div className="mt-2.5 space-y-2">{children}</div>
    </fieldset>
  );
}

function FacetCheckbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  // An option with nothing behind it stays visible but inert — unless it is
  // already ticked, in which case disabling it would strand the customer with a
  // filter they cannot remove.
  const disabled = count === 0 && !checked;

  return (
    <label
      className={cn(
        'flex items-center justify-between gap-2 text-sm transition-colors',
        disabled
          ? 'cursor-not-allowed text-muted-foreground/50'
          : 'cursor-pointer text-foreground hover:text-primary',
      )}
    >
      <span className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="h-4 w-4 rounded border-border"
        />
        {label}
      </span>
      <span className="tabular-nums text-xs text-muted-foreground">{count}</span>
    </label>
  );
}
