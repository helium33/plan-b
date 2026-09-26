/**
 * The floating cart: a button that follows the buyer around, and the drawer it
 * opens from the right.
 *
 * ── What this is for, given there is already a voucher page ────────────────
 * The voucher is where an order is finished: shop details, delivery address,
 * payment method, the printable document. This is where it is *checked* — the
 * question "what have I put in so far?" asked from the middle of the catalogue,
 * which previously cost a round trip to another screen and back.
 *
 * So the drawer removes lines and shows a running subtotal, and hands off to the
 * voucher for everything else rather than growing a second copy of it.
 *
 * ── Why it can still send ──────────────────────────────────────────────────
 * A repeat buyer whose shop details are already saved has nothing to fill in,
 * and making them open the voucher to press a button they could have pressed
 * here is friction with no purpose. But the send buttons obey exactly the same
 * gate the voucher's do — `dispatchBlockReason` — so an order that the voucher
 * would refuse to send cannot slip out of the drawer instead. When it is
 * blocked, the drawer says what is missing and points at the voucher.
 *
 * Signed-out buyers never see any of this: there is nothing in the draft,
 * because the catalogue would not let them add anything. See `ProductRow`.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { TelegramIcon, ViberIcon } from '@/app/components/order/brand-icons';
import { Button } from '@/app/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet';
import { cn } from '@/app/components/ui/utils';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useFrames } from '@/app/hooks/use-frames';
import { useCartUi } from '@/app/stores/cart-ui-store';
import { draftPieceCount, selectedBranch, useOrderStore } from '@/app/stores/order-store';
import {
  buildTelegramUrl,
  buildViberUrl,
  dispatchBlockReason,
  formatOrderMessage,
  resolveShipTo,
  type DispatchLabels,
} from '@/lib/dispatch';
import { formatKyat } from '@/lib/format';
import { formatPayment } from '@/lib/payment';
import { frameDisplayName } from '@/lib/product';
import { priceOrder } from '@/lib/wholesale';

export function CartDrawer() {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const { frames } = useFrames();

  // Shared, not local: the product modal's "done" button opens this drawer
  // as its confirmation step. See `cart-ui-store.ts`.
  const open = useCartUi((s) => s.open);
  const setOpen = useCartUi((s) => s.setOpen);

  const quantities = useOrderStore((s) => s.quantities);
  const shop = useOrderStore((s) => s.shop);
  const branches = useOrderStore((s) => s.branches);
  const shipToBranchId = useOrderStore((s) => s.shipToBranchId);
  const paymentMethod = useOrderStore((s) => s.paymentMethod);
  const bank = useOrderStore((s) => s.bank);
  const clearFrame = useOrderStore((s) => s.clearFrame);

  const totals = useMemo(() => priceOrder(frames ?? [], quantities), [frames, quantities]);
  const pieces = draftPieceCount(quantities);

  const blockedReason = dispatchBlockReason(paymentMethod, bank, shop);

  const message = useMemo(() => {
    if (totals.lines.length === 0) return '';

    const labels: DispatchLabels = {
      heading: t('dispatch.heading'),
      shop: t('order.fields.shopName'),
      contact: t('order.fields.contactName'),
      location: t('order.fields.location'),
      shipTo: t('order.shipToLabel'),
      payment: t('order.paymentLabel'),
      pieces: t('order.pieces'),
      total: t('order.netTotal'),
      note: t('order.fields.note'),
      reference: t('order.reference'),
      currency: t('common.currency'),
    };

    return formatOrderMessage(totals, shop, labels, {
      shipTo: resolveShipTo(
        selectedBranch({ branches, shipToBranchId }),
        shop,
        t('order.mainShop'),
      ),
      payment: formatPayment(paymentMethod, bank, (m) => t(`payment.methods.${m}`)),
    });
  }, [totals, shop, branches, shipToBranchId, paymentMethod, bank, t]);

  const telegram = buildTelegramUrl(message);
  const viber = buildViberUrl(message);

  // The whole feature is signed-in-only, and an empty draft has nothing to
  // float above — a permanent button opening a permanently empty drawer is
  // furniture, not an affordance.
  if (!isSignedIn || pieces === 0) return null;

  const canSend = blockedReason === null && totals.lines.length > 0;

  return (
    <>
      {/*
        Sits above the bottom tab bar on a phone and clear of the corner on a
        desktop. `env(safe-area-inset-bottom)` keeps it off the iOS home
        indicator, which the tab bar is already accounting for.
      */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('cart.open')}
        className={cn(
          'fixed right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform',
          'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6',
          'hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <span className="relative">
          <ShoppingBag className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
          <span className="absolute -right-2.5 -top-2 min-w-[1.15rem] rounded-full border-2 border-primary bg-destructive px-1 text-center text-[0.62rem] font-bold leading-[1.05rem] text-destructive-foreground">
            {pieces > 99 ? '99+' : pieces}
          </span>
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" strokeWidth={2} aria-hidden="true" />
              <span className="font-myanmar">{t('cart.title')}</span>
            </SheetTitle>
            <SheetDescription>{t('catalog.pieces', { count: pieces })}</SheetDescription>
          </SheetHeader>

          {/* ── Lines ────────────────────────────────────────────────────── */}
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4">
            {totals.lines.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t('order.linesUnavailable')}
              </p>
            ) : (
              totals.lines.map((line) => (
                <div
                  key={line.frame.id}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.72rem] font-semibold uppercase tracking-wider text-primary">
                      {line.frame.frameCode}
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {frameDisplayName(line.frame)}
                    </p>
                    <p className="mt-0.5 text-[0.7rem] text-muted-foreground" dir="ltr">
                      {line.entries.map((e) => `${e.variant.cNumber}×${e.qty}`).join('  ')}
                    </p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                      {formatKyat(line.subtotalKyat)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => clearFrame(line.frame.id)}
                    aria-label={t('cart.remove', { code: line.frame.frameCode })}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* ── Total and the way out ────────────────────────────────────── */}
          <div className="space-y-3 border-t border-border bg-card p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-foreground">
                <span className="font-myanmar">{t('order.netTotal')}</span>
              </span>
              <span className="text-lg font-bold tabular-nums text-primary">
                {formatKyat(totals.subtotalKyat)}
              </span>
            </div>

            <Button asChild size="lg" className="min-h-12 w-full" onClick={() => setOpen(false)}>
              <Link to={ROUTES.order}>
                <span className="font-myanmar">{t('cart.reviewVoucher')}</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              </Link>
            </Button>

            {canSend ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="min-h-12"
                  disabled={!telegram.ok}
                >
                  <a
                    href={telegram.ok ? telegram.url : undefined}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setOpen(false)}
                  >
                    <TelegramIcon className="h-4 w-4" />
                    Telegram
                  </a>
                </Button>

                <Button asChild size="lg" variant="outline" className="min-h-12">
                  <a href={viber.ok ? viber.url : undefined} onClick={() => setOpen(false)}>
                    <ViberIcon className="h-4 w-4" />
                    Viber
                  </a>
                </Button>
              </div>
            ) : blockedReason !== null ? (
              /*
                Deliberately not the voucher's own wording for these two. Those
                strings say "…above", which is true beside the fields that
                collect them and false in a drawer that has no fields at all.
                What the buyer needs here is where to go, and the button to get
                there is directly above this line.
              */
              <p className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-center text-[0.75rem] leading-relaxed text-foreground">
                <span className="font-myanmar">{t('cart.completeInVoucher')}</span>
              </p>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
