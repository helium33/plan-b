/**
 * The attribute filters — who a frame is for, what it is made of, its shape.
 *
 * Rendered in the left sidebar on a desktop and inside a sheet on a phone, from
 * the same component and against the same store, so the two can never disagree
 * about what is currently switched on.
 *
 * ── Single-select, with an explicit "All" ──────────────────────────────────
 * A buyer is answering one question at a time ("show me the titanium").
 * Multi-select would make the commonest interaction — switching from one
 * material to another — two taps instead of one, with a state in between
 * showing the union of two things nobody asked to see together.
 *
 * Shape keeps its own nested toggle. Even once the buyer has the panel in front
 * of them, shape is the row they reach for least, so it stays one tap further
 * away than the other two — not zero, and not two.
 */
import { useState, type ReactNode } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/components/ui/utils';
import { useCatalogFilters } from '@/app/stores/catalog-filters-store';
import {
  FRAME_CATEGORIES,
  FRAME_MATERIALS,
  FRAME_SHAPES,
  type FrameCategory,
  type FrameMaterial,
  type FrameShape,
} from '@/lib/attributes';
import { hasAnyFilter } from '@/lib/catalog-query';

/* ── Chip ──────────────────────────────────────────────────────────────────── */

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      // `aria-pressed` rather than a radio: these are toggles in a toolbar, and
      // "pressed" is what a screen reader should announce.
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        // `min-h-11` is 44px — the smallest target reliably hittable with a
        // thumb, and the floor this whole app is built to.
        'inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-[0.8rem] font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

/* ── One filter group ──────────────────────────────────────────────────────── */

function Group<T extends string>({
  label,
  options,
  value,
  optionLabel,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  optionLabel: (option: T) => string;
  onChange: (next: T | null) => void;
}) {
  const { t } = useTranslation();

  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="font-myanmar">{label}</span>
      </legend>

      <div className="flex flex-wrap gap-2">
        <Chip active={value === null} onClick={() => onChange(null)}>
          <span className="font-myanmar">{t('catalog.all')}</span>
        </Chip>

        {options.map((option) => (
          <Chip
            key={option}
            active={value === option}
            // Tapping the active chip clears it. On a phone that is the gesture
            // people reach for, and the alternative is hunting back for "All".
            onClick={() => onChange(value === option ? null : option)}
          >
            <span className="font-myanmar">{optionLabel(option)}</span>
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}

/* ── Shape: a group with its own nested toggle ────────────────────────────── */

/**
 * `open` starts from whether a shape is already selected, so a filter carried
 * over from elsewhere is never hidden behind a collapsed toggle with no sign it
 * is active.
 */
function CollapsibleShapeGroup({
  label,
  value,
  onChange,
}: {
  label: string;
  value: FrameShape | null;
  onChange: (next: FrameShape | null) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(value !== null);

  return (
    <fieldset className="min-w-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={cn(
          'flex min-h-11 w-full items-center justify-between gap-2 rounded-lg text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <span className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="font-myanmar">{label}</span>

          {/* Visible even while collapsed, so an active shape filter is never
              silently hidden behind a closed toggle. */}
          {value !== null ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.68rem] font-bold normal-case tracking-normal text-primary">
              <span className="font-myanmar">{t(`attributes.shape.${value}`)}</span>
            </span>
          ) : null}
        </span>

        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="mt-1.5 flex flex-wrap gap-2">
          <Chip active={value === null} onClick={() => onChange(null)}>
            <span className="font-myanmar">{t('catalog.all')}</span>
          </Chip>

          {FRAME_SHAPES.map((shape) => (
            <Chip
              key={shape}
              active={value === shape}
              onClick={() => onChange(value === shape ? null : shape)}
            >
              <span className="font-myanmar">{t(`attributes.shape.${shape}`)}</span>
            </Chip>
          ))}
        </div>
      ) : null}
    </fieldset>
  );
}

/* ── The three groups together ─────────────────────────────────────────────── */

export function CatalogFilterGroups() {
  const { t } = useTranslation();
  const filters = useCatalogFilters((s) => s.filters);
  const patch = useCatalogFilters((s) => s.patch);
  const clear = useCatalogFilters((s) => s.clear);

  return (
    <div className="space-y-3">
      <Group<FrameCategory>
        label={t('catalog.filterCategory')}
        options={FRAME_CATEGORIES}
        value={filters.category}
        optionLabel={(v) => t(`attributes.category.${v}`)}
        onChange={(category) => patch({ category })}
      />
      <Group<FrameMaterial>
        label={t('catalog.filterMaterial')}
        options={FRAME_MATERIALS}
        value={filters.material}
        optionLabel={(v) => t(`attributes.material.${v}`)}
        onChange={(material) => patch({ material })}
      />
      <CollapsibleShapeGroup
        label={t('catalog.filterShape')}
        value={filters.shape}
        onChange={(shape) => patch({ shape })}
      />

      {hasAnyFilter(filters) ? (
        <button
          type="button"
          onClick={clear}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-[0.78rem] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
          <span className="font-myanmar">{t('catalog.clearFilters')}</span>
        </button>
      ) : null}
    </div>
  );
}
