/**
 * Fifty eye-care tips, filterable and searchable.
 *
 * A grid rather than a carousel, deliberately. A carousel shows two or three
 * tips at a time and hides the rest behind arrows nobody presses — which for
 * fifty short, unordered items is the wrong shape entirely. A grid with category
 * chips and a search box lets someone scan the lot, or jump straight to the one
 * subject they came for.
 *
 * Filtering happens in memory over a 50-item array, so there is no debounce and
 * no loading state to manage: the results update as fast as the keystrokes.
 */
import { useDeferredValue, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Apple,
  Baby,
  Contact,
  Droplets,
  Eye,
  Glasses,
  Monitor,
  Search,
  Sun,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/app/components/ui/input';
import { cn } from '@/app/components/ui/utils';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { useLanguage } from '@/app/hooks/use-language';
import {
  EYE_CARE_TIPS,
  TIP_CATEGORIES,
  type TipCategory,
  searchTips,
} from '@/app/data/eye-care-tips';

/** One icon per category, so the chips and cards are scannable without reading. */
const CATEGORY_ICONS: Record<TipCategory, typeof Eye> = {
  screens: Monitor,
  sunlight: Sun,
  hygiene: Droplets,
  children: Baby,
  contacts: Contact,
  nutrition: Apple,
  warning: TriangleAlert,
  care: Glasses,
};

export function EyeCarePage() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  useDocumentTitle(t('pages.eyeCare.title'));

  const [category, setCategory] = useState<TipCategory | null>(null);
  const [query, setQuery] = useState('');

  /**
   * `useDeferredValue` lets the input stay responsive if the list ever grows
   * past the point where filtering is instant. At fifty items it changes
   * nothing; it costs nothing either, and means the search box does not need
   * revisiting when the shop adds their hundredth tip.
   */
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const inCategory =
      category === null
        ? EYE_CARE_TIPS
        : EYE_CARE_TIPS.filter((tip) => tip.category === category);

    return searchTips(inCategory, deferredQuery, language);
  }, [category, deferredQuery, language]);

  /** Counts per category, so a chip can say how much is behind it. */
  const counts = useMemo(() => {
    const map = new Map<TipCategory, number>();
    for (const tip of EYE_CARE_TIPS) {
      map.set(tip.category, (map.get(tip.category) ?? 0) + 1);
    }
    return map;
  }, []);

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('pages.eyeCare.title')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t('eyeCare.intro', { count: EYE_CARE_TIPS.length })}
        </p>
      </header>

      {/* Search */}
      <div className="mt-8 max-w-md">
        <label htmlFor="tip-search" className="sr-only">
          {t('eyeCare.searchLabel')}
        </label>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.9}
            aria-hidden="true"
          />
          <Input
            id="tip-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('eyeCare.searchPlaceholder')}
            className="pl-9 pr-9"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('actions.clear')}
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Category chips */}
      <div
        role="group"
        aria-label={t('eyeCare.categoriesLabel')}
        className="mt-5 flex flex-wrap gap-2"
      >
        <CategoryChip
          active={category === null}
          onClick={() => setCategory(null)}
          label={t('eyeCare.allCategories')}
          count={EYE_CARE_TIPS.length}
        />

        {TIP_CATEGORIES.map((value) => {
          const Icon = CATEGORY_ICONS[value];
          return (
            <CategoryChip
              key={value}
              active={category === value}
              onClick={() => setCategory(category === value ? null : value)}
              label={t(`eyeCare.categories.${value}`)}
              count={counts.get(value) ?? 0}
              icon={<Icon className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />}
            />
          );
        })}
      </div>

      {/* Result count — reassures that a filter did something, and doubles as
          the live region announcing the change to a screen reader. */}
      <p className="mt-6 text-sm text-muted-foreground" role="status" aria-live="polite">
        {t('eyeCare.showing', { count: results.length, total: EYE_CARE_TIPS.length })}
      </p>

      {results.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="text-sm font-medium text-foreground">{t('eyeCare.noResults')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('eyeCare.noResultsBody')}</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((tip, index) => {
            const Icon = CATEGORY_ICONS[tip.category];
            const content = tip[language];
            const isWarning = tip.category === 'warning';

            return (
              <motion.li
                key={tip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  ease: 'easeOut',
                  // Stagger only the first screenful. Beyond that the delay
                  // would outlast the scroll and cards would pop in late.
                  delay: Math.min(index, 8) * 0.03,
                }}
                className={cn(
                  'flex h-full flex-col rounded-2xl border p-5 transition-colors',
                  isWarning
                    ? 'border-destructive/25 bg-destructive/[0.04]'
                    : 'border-border bg-card hover:border-brand-300 dark:hover:border-brand-700',
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                      isWarning
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300',
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`eyeCare.categories.${tip.category}`)}
                  </span>
                </div>

                <h2 className="mt-3.5 text-sm font-semibold leading-snug text-foreground">
                  {content.title}
                </h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {content.body}
                </p>
              </motion.li>
            );
          })}
        </ul>
      )}

      {/* Standing disclaimer. Present regardless of filter, because the warning
          tips are the ones most likely to be read as a diagnosis. */}
      <p className="mt-10 rounded-xl border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
        {t('eyeCare.disclaimer')}
      </p>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
  count,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      // `aria-pressed` rather than a radiogroup: chips are independently
      // toggleable and clicking an active one clears it, which is toggle
      // behaviour, not single-select.
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-brand-300 hover:text-foreground dark:hover:border-brand-700',
      )}
    >
      {icon}
      {label}
      <span className={cn('tabular-nums', active ? 'text-primary-foreground/70' : 'text-muted-foreground/60')}>
        {count}
      </span>
    </button>
  );
}
