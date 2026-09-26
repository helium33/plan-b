/**
 * Past orders, and one-tap re-ordering.
 *
 * ── Why this needs a sign-in and the rest of the app does not ──────────────
 * Everything else in this app works anonymously, because the order leaves over
 * Telegram and the shop identifies the buyer there. History is the exception:
 * it has to survive a cleared browser and follow the buyer to a new phone, and
 * only an account can do that. So the drawer is honest about it — signed-out
 * buyers see what it is for and a way in, not an empty list.
 *
 * Re-Order copies the stored *quantities* into the draft, never the stored
 * prices. Last month's totals are a record; this month's order re-prices against
 * today's catalogue, which is the only figure the shop will honour.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Loader2, LogIn, PackageCheck, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/app/components/ui/drawer';
import { Button } from '@/app/components/ui/button';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useOrderStore } from '@/app/stores/order-store';
import { listOrders, type OrderHistoryDoc } from '@/lib/firestore/orders';
import { formatKyat } from '@/lib/format';

function OrderRow({ order, onReorder }: { order: OrderHistoryDoc; onReorder: () => void }) {
  const { t, i18n } = useTranslation();

  const date = new Intl.DateTimeFormat(i18n.language === 'my' ? 'my-MM' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    numberingSystem: 'latn',
  }).format(new Date(order.createdAtMs));

  return (
    <li className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.78rem] font-semibold text-foreground" dir="ltr">
            {order.id}
          </p>
          <p className="mt-0.5 text-[0.72rem] text-muted-foreground">
            {date} · {t('catalog.pieces', { count: order.totalPieces })}
          </p>
        </div>

        <p className="shrink-0 text-sm font-bold tabular-nums text-foreground">
          {formatKyat(order.subtotalKyat)}
        </p>
      </div>

      <ul className="mt-2 space-y-0.5">
        {order.lines.slice(0, 3).map((line) => (
          <li key={line.frameId} className="truncate text-[0.7rem] text-muted-foreground">
            {line.frameCode} — {line.colours.map((c) => `${c.cNumber}×${c.qty}`).join(' ')}
          </li>
        ))}
        {order.lines.length > 3 ? (
          <li className="text-[0.7rem] text-muted-foreground">
            {t('history.andMore', { count: order.lines.length - 3 })}
          </li>
        ) : null}
      </ul>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[0.7rem] text-muted-foreground">
          <span className="font-myanmar">{t(`payment.methods.${order.paymentMethod}`)}</span>
          {order.bank ? ` (${order.bank})` : ''}
        </span>

        <Button type="button" size="sm" variant="outline" className="min-h-11" onClick={onReorder}>
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          <span className="font-myanmar">{t('history.reorder')}</span>
        </Button>
      </div>
    </li>
  );
}

export function OrderHistoryDrawer() {
  const { t } = useTranslation();
  const { isSignedIn, user } = useAuth();
  const replaceDraft = useOrderStore((s) => s.replaceDraft);

  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<OrderHistoryDoc[] | null>(null);
  const [failed, setFailed] = useState(false);

  // Fetched when the drawer opens rather than on mount: most visits never open
  // it, and a read per page load would cost the shop quota for nothing.
  useEffect(() => {
    if (!open || !user) return;

    let active = true;
    setFailed(false);
    setOrders(null);

    listOrders(user.uid)
      .then((result) => {
        if (active) setOrders(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [open, user]);

  const reorder = (order: OrderHistoryDoc) => {
    replaceDraft(order.quantities);
    setOpen(false);
    toast.success(t('history.reordered', { reference: order.id }));
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button type="button" variant="outline" size="lg" className="min-h-11 w-full">
          <History className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          <span className="font-myanmar">{t('history.open')}</span>
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-myanmar">{t('history.title')}</DrawerTitle>
          <DrawerDescription>{t('history.subtitle')}</DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {!isSignedIn ? (
            <div className="py-8 text-center">
              <PackageCheck
                className="mx-auto h-8 w-8 text-muted-foreground"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-medium text-foreground">
                <span className="font-myanmar">{t('history.signInTitle')}</span>
              </p>
              <p className="mx-auto mt-1 max-w-xs text-[0.8rem] leading-relaxed text-muted-foreground">
                {t('history.signInBody')}
              </p>

              <DrawerClose asChild>
                <Button asChild className="mt-4 min-h-11">
                  <Link to={ROUTES.signIn}>
                    <LogIn className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    {t('actions.signIn')}
                  </Link>
                </Button>
              </DrawerClose>
            </div>
          ) : failed ? (
            <p role="alert" className="py-8 text-center text-sm text-muted-foreground">
              {t('history.loadFailed')}
            </p>
          ) : orders === null ? (
            <div className="grid place-items-center py-10" aria-busy="true">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
            </div>
          ) : orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              <span className="font-myanmar">{t('history.empty')}</span>
            </p>
          ) : (
            <ul className="space-y-2">
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} onReorder={() => reorder(order)} />
              ))}
            </ul>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
