/**
 * Side-by-side comparison.
 *
 * ── Rows, not cards ────────────────────────────────────────────────────────
 * A real comparison needs the same attribute on the same line across every
 * column, so the eye can travel horizontally. Four product cards next to each
 * other are not a comparison — the reader has to hunt for "material" in a
 * different position in each one.
 *
 * ── Differences are marked ─────────────────────────────────────────────────
 * Rows where every frame agrees are visually quietened, and rows where they differ
 * are highlighted. That is the entire job of this page: nobody opens a comparison
 * to find out what two frames have in common.
 *
 * Seeded from the compare tray, and falling back to the wishlist when the tray is
 * empty — because "compare my saved frames" is how the wishlist page links here,
 * and arriving at an empty comparison from a full wishlist would be daft.
 */
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GitCompare, Loader2, Minus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import { ROUTES, productPath } from '@/app/config/navigation';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { resolveFrames, useFrames } from '@/app/hooks/use-frames';
import { useWishlist } from '@/app/hooks/use-wishlist';
import { MAX_COMPARE, MIN_COMPARE, useCompareStore } from '@/app/stores/compare-store';
import { formatKyat } from '@/lib/format';
import { type FrameDoc, frameDisplayName, isInStock, primaryImage } from '@/lib/product';

export function ComparePage() {
  const { t } = useTranslation();
  useDocumentTitle(t('pages.compare.title'));

  const compare = useCompareStore();
  // Selected separately so the seeding effect can depend on a stable reference
  // rather than the whole store object, which changes on every selection.
  const setMany = useCompareStore((s) => s.setMany);
  const wishlist = useWishlist();
  const { frames, failed } = useFrames();

  /**
   * Seed the tray from the wishlist when arriving with nothing selected.
   *
   * Uses `setMany`, not a loop of `toggle`. Toggling is a flip, and this effect can
   * run more than once against the same captured state — StrictMode does it on
   * every mount in development, and a remount does it in production — which turned
   * "select these three" into "select them, then deselect them". Assignment is
   * idempotent, so repeat runs are harmless.
   *
   * Reads the selection through `getState()` rather than the subscribed `compare`
   * object, so the guard sees the *current* tray instead of the render-time
   * snapshot the closure captured.
   */
  useEffect(() => {
    if (useCompareStore.getState().ids.length > 0) return;
    if (wishlist.ids.length < MIN_COMPARE) return;

    setMany(wishlist.ids.slice(0, MAX_COMPARE));
  }, [wishlist.ids, setMany]);

  const selected = resolveFrames(compare.ids, frames);

  /** Attribute rows, and whether the frames disagree on each. */
  const rows = useMemo(() => buildRows(selected, t), [selected, t]);

  if (failed) {
    return (
      <div className="container-page py-14">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('pages.compare.title')}
        </h1>
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">{t('common.error')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('common.errorBody')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t('pages.compare.title')}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {selected.length >= 2
              ? t('compare.comparing', { count: selected.length })
              : t('pages.compare.description')}
          </p>
        </div>

        {compare.ids.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => compare.clear()}>
            {t('actions.clear')}
          </Button>
        ) : null}
      </header>

      {compare.ids.length > 0 && frames === null ? (
        <p className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t('common.loading')}
        </p>
      ) : null}

      {frames !== null && selected.length < 2 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground">
            <GitCompare className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">{t('compare.emptyTitle')}</p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t('compare.emptyBody', { max: MAX_COMPARE })}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button asChild>
              <Link to={ROUTES.shop}>{t('actions.shopNow')}</Link>
            </Button>
            {wishlist.count > 0 ? (
              <Button asChild variant="outline">
                <Link to={ROUTES.wishlist}>{t('nav.account') === '' ? '' : t('actions.wishlist')}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {selected.length >= 2 ? (
        /*
          Horizontal scroll on the wrapper, not the page. Four columns will not fit
          a phone, and letting the whole document scroll sideways breaks the header
          and footer along with it.
        */
        <div className="mt-8 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <caption className="sr-only">{t('compare.tableCaption')}</caption>

            <thead>
              <tr>
                {/* Empty corner cell above the row labels. */}
                <th scope="col" className="w-32 sm:w-40" />

                {selected.map((frame) => (
                  <th key={frame.id} scope="col" className="p-2 align-top">
                    <ColumnHeader frame={frame} onRemove={() => compare.remove(frame.id)} />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className={cn(
                    'border-t border-border',
                    // Quietened when identical, so the eye lands on the rows that
                    // actually distinguish the frames.
                    row.differs ? 'bg-brand-50/40 dark:bg-brand-950/30' : undefined,
                  )}
                >
                  <th
                    scope="row"
                    className="py-3 pr-3 text-left align-top text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {row.label}
                    {row.differs ? (
                      <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-500 align-middle" aria-label={t('compare.differs')} />
                    ) : null}
                  </th>

                  {row.values.map((value, index) => (
                    <td
                      key={selected[index].id}
                      className={cn(
                        'p-3 align-top',
                        row.differs ? 'font-medium text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {value || (
                        <Minus className="h-3.5 w-3.5 text-muted-foreground/50" aria-label={t('compare.none')} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

/* ── Column header ─────────────────────────────────────────────────────────── */

function ColumnHeader({ frame, onRemove }: { frame: FrameDoc; onRemove: () => void }) {
  const { t } = useTranslation();
  const image = primaryImage(frame);

  return (
    <div className="relative w-40 text-left sm:w-48">
      <button
        type="button"
        onClick={onRemove}
        aria-label={t('compare.remove', { name: frameDisplayName(frame) })}
        className="absolute right-1 top-1 z-10 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-muted-foreground backdrop-blur transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
      </button>

      <Link
        to={productPath(frame.id)}
        className="block overflow-hidden rounded-xl border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="block aspect-[4/3] overflow-hidden">
          {image ? (
            <img src={image} alt="" aria-hidden="true" className="h-full w-full object-cover" />
          ) : null}
        </span>
      </Link>

      <p className="mt-2 text-sm font-medium leading-snug text-foreground">
        <Link to={productPath(frame.id)} className="hover:underline">
          {frameDisplayName(frame)}
        </Link>
      </p>
      <p className="mt-0.5 text-xs font-normal text-muted-foreground" dir="ltr">
        {frame.brand}
      </p>
    </div>
  );
}

/* ── Rows ──────────────────────────────────────────────────────────────────── */

type Row = { label: string; values: string[]; differs: boolean };

/**
 * Builds one row per attribute, flagging the ones the frames disagree on.
 *
 * Difference is decided on the *rendered* string, not the underlying value. Two
 * frames listing face shapes in a different order are the same to a reader, and
 * comparing arrays directly would mark that as a difference and highlight a row
 * that says the same thing twice.
 */
function buildRows(frames: FrameDoc[], t: (key: never, options?: never) => string): Row[] {
  if (frames.length === 0) return [];

  const tr = t as unknown as (key: string, options?: Record<string, unknown>) => string;

  const currency = tr('common.currency');

  const row = (label: string, pick: (frame: FrameDoc) => string): Row => {
    const values = frames.map(pick);
    return { label, values, differs: new Set(values).size > 1 };
  };

  return [
    row(tr('admin.priceLabel'), (f) => formatKyat(f.price, currency)),
    row(tr('admin.frameCodeLabel'), (f) => f.frameCode),
    row(tr('admin.frameSizeLabel'), (f) => tr(`attributes.frameSize.${f.frameSize}`)),
    row(tr('admin.materialLabel'), (f) => tr(`attributes.material.${f.material}`)),
    row(tr('compare.faceShapes'), (f) =>
      // Sorted so ordering never counts as a difference.
      [...f.faceShapes]
        .sort()
        .map((shape) => tr(`attributes.faceShape.${shape}`))
        .join(', '),
    ),
    row(tr('compare.categories'), (f) =>
      [...f.categories]
        .sort()
        .map((category) => tr(`attributes.category.${category}`))
        .join(', '),
    ),
    row(tr('admin.comfortLabel'), (f) =>
      [...f.comfortFeatures]
        .sort()
        .map((feature) => tr(`attributes.comfort.${feature}`))
        .join(', '),
    ),
    row(tr('compare.colours'), (f) =>
      f.variants.map((variant) => variant.colorName || variant.cNumber).join(', '),
    ),
    row(tr('compare.availability'), (f) =>
      isInStock(f) ? tr('compare.inStock') : tr('product.outOfStock'),
    ),
  ];
}
