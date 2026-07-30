/**
 * The bag.
 *
 * Deliberately thin: it lists what has been chosen, lets a line be removed, and
 * moves on. All the pricing complexity — promo, points, delivery — lives at
 * checkout, because showing a promo field twice invites a customer to enter a code
 * here and wonder why the total did not move.
 *
 * Each line shows its lens configuration, since that is what distinguishes two
 * otherwise identical entries.
 */
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { ROUTES, productPath } from '@/app/config/navigation';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { useCartStore } from '@/app/stores/cart-store';
import { formatKyat } from '@/lib/format';
import { formatDioptre } from '@/lib/prescription';

export function CartPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('pages.cart.title'));

  const items = useCartStore((s) => s.items);
  const remove = useCartStore((s) => s.remove);

  const subtotal = items.reduce((sum, item) => sum + item.lineTotalKyat, 0);

  if (items.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground">
          <ShoppingBag className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          {t('cart.emptyTitle')}
        </h1>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t('cart.emptyBody')}
        </p>
        <Button asChild className="mt-5">
          <Link to={ROUTES.shop}>{t('actions.shopNow')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {t('pages.cart.title')}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t('cart.count', { count: items.length })}
      </p>

      <ul className="mt-8 space-y-4">
        {items.map((item, index) => (
          <motion.li
            key={item.lineId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut', delay: Math.min(index, 5) * 0.04 }}
            className="flex flex-wrap gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
          >
            <Link
              to={productPath(item.frameId)}
              className="h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.image ? (
                <img src={item.image} alt="" aria-hidden="true" className="h-full w-full object-cover" />
              ) : null}
            </Link>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                <Link to={productPath(item.frameId)} className="hover:underline">
                  {item.frameName}
                </Link>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                {item.brand} {item.frameCode} · {item.colorName} ({item.cNumber})
              </p>

              <dl className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                <div className="flex gap-1.5">
                  <dt className="font-medium text-foreground">{t('cart.lens')}</dt>
                  <dd>{t(`lens.types.${item.lens.lensType}`)}</dd>
                </div>

                {item.lens.deferToStore ? (
                  <div>{t('cart.rxInStore')}</div>
                ) : (
                  <div className="flex gap-1.5" dir="ltr">
                    <dt className="font-medium text-foreground">Rx</dt>
                    <dd>
                      R {formatDioptre(item.lens.prescription.right.sph)} / L{' '}
                      {formatDioptre(item.lens.prescription.left.sph)}
                      {item.lens.prescription.pd !== null ? ` · PD ${item.lens.prescription.pd}mm` : ''}
                    </dd>
                  </div>
                )}

                {item.lens.coatings.length > 0 ? (
                  <div className="flex gap-1.5">
                    <dt className="font-medium text-foreground">{t('cart.coatings')}</dt>
                    <dd>{item.lens.coatings.map((c) => t(`lens.coatings.${c}`)).join(', ')}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="flex shrink-0 flex-col items-end justify-between gap-2">
              <p className="text-sm font-semibold text-foreground" dir="ltr">
                {formatKyat(item.lineTotalKyat, t('common.currency'))}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(item.lineId)}
                aria-label={t('cart.removeLine', { name: item.frameName })}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
                {t('checkout.remove')}
              </Button>
            </div>
          </motion.li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <p className="text-sm text-muted-foreground">{t('checkout.subtotal')}</p>
          <p className="text-xl font-semibold text-foreground" dir="ltr">
            {formatKyat(subtotal, t('common.currency'))}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('cart.discountsAtCheckout')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={ROUTES.shop}>{t('wishlist.keepBrowsing')}</Link>
          </Button>
          <Button asChild size="lg">
            <Link to={ROUTES.checkout}>
              {t('cart.checkout')}
              <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
