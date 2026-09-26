/**
 * The two badges that sit on a frame wherever it appears: availability, and
 * whether it is bookmarked.
 *
 * Shared between the grid card and the detail page so the two cannot disagree —
 * a frame showing "Low Stock" in the grid and "In Stock" one tap later would
 * make every badge in the app untrustworthy.
 */
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/components/ui/utils';
import { STOCK_STATUS_CLASSES, type StockStatus } from '@/lib/attributes';
import { useFavouritesStore, useIsFavourite } from '@/app/stores/favourites-store';

export function StockBadge({
  status,
  className,
}: {
  status: StockStatus;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold',
        STOCK_STATUS_CLASSES[status],
        className,
      )}
    >
      {/* A dot as well as the colour: colour alone is not a distinction someone
          with a red-green deficiency can rely on, and the label carries the
          meaning anyway. */}
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      <span className="font-myanmar">{t(`attributes.stock.${status}`)}</span>
    </span>
  );
}

/**
 * Heart toggle.
 *
 * `stopPropagation` because this sits inside the card's link: without it,
 * bookmarking a frame would also navigate to it, which is the opposite of what
 * someone triaging a catalogue wants.
 */
export function FavouriteButton({
  frameId,
  frameName,
  className,
}: {
  frameId: string;
  frameName: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const saved = useIsFavourite(frameId);
  const toggle = useFavouritesStore((state) => state.toggle);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={t(saved ? 'catalog.unsave' : 'catalog.save', { name: frameName })}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(frameId);
      }}
      className={cn(
        'grid h-11 w-11 place-items-center rounded-full bg-background/85 shadow-sm backdrop-blur transition-colors hover:bg-background',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        saved ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground',
        className,
      )}
    >
      <Heart className={cn('h-[1.15rem] w-[1.15rem]', saved && 'fill-current')} strokeWidth={2} />
    </button>
  );
}
