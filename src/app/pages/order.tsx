/**
 * The wholesale voucher — ဘောက်ချာ.
 *
 * One page holds the whole commercial side of the app: the lines, both
 * discounts, the net total, who is ordering, and the way out to Telegram or
 * Viber. That is deliberate. The alternative — a cart, then a checkout, then a
 * confirmation — is a retail shape, and it exists to collect payment details
 * this app never takes. Here there is nothing to collect, so there is nothing to
 * split across pages.
 *
 * Every figure is derived from the draft and the live catalogue on each render.
 * Nothing about the total is stored, so the voucher cannot quote a price the
 * catalogue no longer offers.
 */
import { Suspense, lazy, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ReceiptText, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { DispatchPanel } from '@/app/components/order/dispatch-panel';
import { OrderHistoryDrawer } from '@/app/components/order/order-history';
import { PrintableVoucher } from '@/app/components/order/printable-voucher';
import {
  BranchPicker,
  PaymentPicker,
  ShopDetailsForm,
} from '@/app/components/order/shop-details-form';
import { Button } from '@/app/components/ui/button';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { useFrames } from '@/app/hooks/use-frames';
import { useRole } from '@/app/hooks/use-role';
import { selectedBranch, useOrderStore } from '@/app/stores/order-store';
import { orderReference, resolveShipTo } from '@/lib/dispatch';
import { saveOrder } from '@/lib/firestore/orders';
import { frameDisplayName } from '@/lib/product';
import { priceOrder } from '@/lib/wholesale';

/**
 * Ordering on credit, loaded only for accounts that can. It carries the POS
 * integration — stock lookups, the credit rules, the batch write — which a
 * buyer who sends orders over Telegram never runs and should not download.
 */
const CreditCheckout = lazy(() =>
  import('@/app/components/credit/credit-checkout').then((m) => ({ default: m.CreditCheckout })),
);

/* ── Page ──────────────────────────────────────────────────────────────────── */

export function OrderPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('nav.order'));

  const { frames, failed } = useFrames();
  const { user } = useAuth();
  const { ready: roleReady, can } = useRole();

  const quantities = useOrderStore((s) => s.quantities);
  const shop = useOrderStore((s) => s.shop);
  const branches = useOrderStore((s) => s.branches);
  const shipToBranchId = useOrderStore((s) => s.shipToBranchId);
  const paymentMethod = useOrderStore((s) => s.paymentMethod);
  const bank = useOrderStore((s) => s.bank);
  const clearAll = useOrderStore((s) => s.clearAll);

  const totals = useMemo(() => priceOrder(frames ?? [], quantities), [frames, quantities]);
  const branch = selectedBranch({ branches, shipToBranchId });

  /** The printable part of the page — everything the image/PDF export captures. */
  const voucherRef = useRef<HTMLDivElement>(null);

  /**
   * Files the order under the buyer's account once it has actually gone out.
   *
   * Called from every dispatch path — Telegram, Viber, copy, save — because any
   * of them can be the one the buyer used, and a history that only recorded
   * Telegram orders would be quietly wrong for everyone else.
   *
   * Signed-out buyers simply get no history: `saveOrder` needs a uid, and the
   * drawer already explains that. Failures are swallowed rather than shown —
   * the order has *already left*, and an error toast at that moment reads as
   * "your order failed", which would be the opposite of the truth.
   */
  const recordOrder = useCallback(
    (reference: string) => {
      if (!user || totals.lines.length === 0) return;

      void saveOrder(user.uid, {
        id: reference,
        createdAtMs: Date.now(),
        lines: totals.lines.map((line) => ({
          frameId: line.frame.id,
          frameCode: line.frame.frameCode,
          name: frameDisplayName(line.frame),
          unitPriceKyat: line.frame.wholesalePrice,
          colours: line.entries.map((entry) => ({
            cNumber: entry.variant.cNumber,
            qty: entry.qty,
          })),
          totalPieces: line.totalPieces,
          subtotalKyat: line.subtotalKyat,
        })),
        totalPieces: totals.totalPieces,
        subtotalKyat: totals.subtotalKyat,
        shopName: shop.shopName,
        contactName: shop.contactName,
        phone: shop.phone,
        shipTo: branch
          ? [branch.label, branch.city, branch.address].filter(Boolean).join(', ')
          : shop.location,
        paymentMethod,
        bank,
        note: shop.note,
        quantities,
      }).catch(() => {
        /* See above: never surface this. */
      });
    },
    [user, totals, shop, branch, paymentMethod, bank, quantities],
  );

  // `quantities` is the source of truth for "is there a draft?", not `totals`:
  // until the catalogue loads there are no priced lines, and showing the empty
  // state then would tell a buyer their order had vanished.
  const hasDraft = Object.keys(quantities).length > 0;

  if (!hasDraft) {
    return (
      <div className="px-4 py-16 text-center">
        <ReceiptText
          className="mx-auto h-9 w-9 text-muted-foreground"
          strokeWidth={1.4}
          aria-hidden="true"
        />
        <h1 className="mt-4 text-base font-semibold text-foreground">
          <span className="font-myanmar">{t('order.emptyTitle')}</span>
        </h1>
        <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {t('order.emptyBody')}
        </p>

        <Button asChild className="mt-6 min-h-11">
          <Link to={ROUTES.catalog}>
            <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            <span className="font-myanmar">{t('order.emptyAction')}</span>
          </Link>
        </Button>

        {/* Offered here too: an empty voucher is exactly where a returning buyer
            reaches for "the same as last time". */}
        <div className="mx-auto mt-3 max-w-xs">
          <OrderHistoryDrawer />
        </div>
      </div>
    );
  }

  return (
    // Capped narrower than the catalogue on purpose: a voucher is a document to
    // read down, and stretching it across a 1280px screen turns every line into
    // a label at one edge and a number at the other.
    <div className="mx-auto max-w-2xl space-y-3 px-4 py-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            <span className="font-myanmar">{t('order.title')}</span>
          </h1>
          <p className="mt-0.5 text-[0.72rem] text-muted-foreground" dir="ltr">
            {t('order.reference')}: {orderReference(totals, shop)}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => {
            clearAll();
            toast.success(t('order.cleared'));
          }}
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          {t('order.clearAll')}
        </Button>
      </header>

      <OrderHistoryDrawer />

      {failed ? (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground"
        >
          {t('order.pricingUnavailable')}
        </p>
      ) : null}

      {/*
        `voucherRef` wraps only the printed document, not the editable fields
        below it. `PrintableVoucher` renders the shop's details as plain text
        from the very same store `ShopDetailsForm` writes to — the two are
        never out of sync, but only one of them belongs in an exported image.
        See the note at the top of `printable-voucher.tsx`.
      */}
      <div ref={voucherRef}>
        {frames === null ? (
          <p className="rounded-3xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            {t('common.loading')}
          </p>
        ) : totals.lines.length === 0 ? (
          <p className="rounded-3xl border border-destructive/30 bg-destructive/5 px-4 py-10 text-center text-sm text-foreground">
            {t('order.linesUnavailable')}
          </p>
        ) : (
          <PrintableVoucher
            totals={totals}
            shop={shop}
            shipTo={resolveShipTo(branch, shop, t('order.mainShop'))}
            reference={orderReference(totals, shop)}
            paymentMethod={paymentMethod}
            bank={bank}
          />
        )}
      </div>

      {/* Accounts with a POS credit account order straight into it; everyone
          else — and anyone who prefers — still sends it over Telegram below. */}
      {roleReady && can('purchase:credit') ? (
        <Suspense fallback={null}>
          <CreditCheckout totals={totals} note={shop.note} />
        </Suspense>
      ) : null}

      <ShopDetailsForm />

      <BranchPicker />

      <PaymentPicker />

      <DispatchPanel
        totals={totals}
        shop={shop}
        branch={branch}
        paymentMethod={paymentMethod}
        bank={bank}
        voucherRef={voucherRef}
        onSent={recordOrder}
      />
    </div>
  );
}
