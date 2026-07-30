/**
 * Saved frames.
 *
 * Open to guests, deliberately. Requiring sign-in to *view* a list the customer
 * already built locally would be gatekeeping their own data. The page explains
 * what signing in adds — the list following them to another device — and lets them
 * decide.
 */
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Loader2, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ProductCard } from '@/app/components/product/product-card';
import { Button } from '@/app/components/ui/button';
import { ROUTES } from '@/app/config/navigation';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { resolveFrames, useFrames } from '@/app/hooks/use-frames';
import { useWishlist } from '@/app/hooks/use-wishlist';

export function WishlistPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('pages.wishlist.title'));

  const wishlist = useWishlist();
  const { frames, failed } = useFrames();

  const saved = resolveFrames(wishlist.ids, frames);

  /**
   * Saved ids that no longer resolve to a frame.
   *
   * Counted rather than ignored, so the page can account for the difference. A
   * customer who saved six frames and sees four needs to know the shop withdrew
   * two — otherwise the list looks like it lost them.
   */
  const missing = frames ? wishlist.ids.length - saved.length : 0;

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t('pages.wishlist.title')}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {wishlist.count === 0
              ? t('pages.wishlist.description')
              : t('wishlist.savedCount', { count: wishlist.count })}
          </p>
        </div>

        {wishlist.count > 0 ? (
          <Button variant="ghost" size="sm" onClick={wishlist.clear}>
            {t('wishlist.clearAll')}
          </Button>
        ) : null}
      </header>

      {/* Sign-in nudge, shown only to a guest who has something to lose. */}
      {wishlist.isGuest && wishlist.count > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-200/70 bg-brand-50/50 p-4 dark:border-brand-800/70 dark:bg-brand-950/40"
        >
          <div className="flex min-w-0 gap-3">
            <Smartphone
              className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-300"
              strokeWidth={1.9}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-foreground">{t('wishlist.guestTitle')}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{t('wishlist.guestBody')}</p>
            </div>
          </div>

          <Button asChild size="sm">
            <Link to={ROUTES.signIn} state={{ from: { pathname: ROUTES.wishlist } }}>
              {t('actions.signIn')}
            </Link>
          </Button>
        </motion.div>
      ) : null}

      {wishlist.count === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Heart className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">{t('wishlist.emptyTitle')}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t('wishlist.emptyBody')}
          </p>
          <Button asChild className="mt-5">
            <Link to={ROUTES.shop}>{t('actions.shopNow')}</Link>
          </Button>
        </div>
      ) : null}

      {wishlist.count > 0 && frames === null && !failed ? (
        <p className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t('common.loading')}
        </p>
      ) : null}

      {failed ? (
        <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">{t('common.error')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('common.errorBody')}</p>
        </div>
      ) : null}

      {saved.length > 0 ? (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {saved.map((frame) => (
              <ProductCard key={frame.id} frame={frame} />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to={ROUTES.compare}>{t('wishlist.compareThese')}</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to={ROUTES.shop}>{t('wishlist.keepBrowsing')}</Link>
            </Button>
          </div>
        </>
      ) : null}

      {missing > 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-muted/40 p-3.5 text-xs leading-relaxed text-muted-foreground">
          {t('wishlist.unavailable', { count: missing })}
        </p>
      ) : null}
    </div>
  );
}
