/**
 * Order on credit — the voucher page's way into the POS.
 *
 * Shown to accounts that may buy on credit: a shop for itself, a sales rep or
 * an admin for the shop they have chosen. Everyone else keeps the Telegram /
 * Viber send below, which is unchanged — a buyer without a POS account still
 * orders the way they always have.
 *
 * ── Two taps, on purpose ───────────────────────────────────────────────────
 * This creates a debt. The first tap shows exactly what will be billed to
 * whom; the second commits it. A one-tap button a thumb can brush while
 * scrolling a voucher is not a button that should move money.
 *
 * ── The preview is a preview ───────────────────────────────────────────────
 * The figures here — available credit, the due date, whether an earlier bill
 * still has to be paid first — are derived live from the same rules
 * `handlePurchase` applies, so they agree.
 * But `handlePurchase` re-reads stock and credit at the moment of ordering,
 * and the database's rules check again as it commits; whatever it answers is
 * the truth, and its answer is what the buyer is shown.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Loader2, Store } from 'lucide-react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/app/components/ui/button';
import { ROUTES } from '@/app/config/navigation';
import { useRole } from '@/app/hooks/use-role';
import { useShopCredit } from '@/app/hooks/use-shop-credit';
import { useAuthStore } from '@/app/stores/auth-store';
import { useOrderStore } from '@/app/stores/order-store';
import { formatKyat } from '@/lib/format';
import { canPurchase, computeDueDate } from '@/lib/pos/credit';
import { handlePurchase, type PurchaseFailure } from '@/lib/pos/handle-purchase';
import type { OrderTotals } from '@/lib/wholesale';

function failureMessage(t: TFunction, failure: PurchaseFailure): string {
  switch (failure.code) {
    case 'NOT_LINKED':
      return t('account.checkout.errors.NOT_LINKED', { code: failure.frameCode });
    case 'COLOUR_NOT_IN_POS':
      return t('account.checkout.errors.COLOUR_NOT_IN_POS', { code: failure.frameCode, colour: failure.cNumber });
    case 'OUT_OF_STOCK':
      return t('account.checkout.errors.OUT_OF_STOCK', {
        lines: failure.shortages
          .map((s) => `${s.modelNo} ${s.colorCode} (${s.available}/${s.requested})`)
          .join(', '),
      });
    case 'UNPAID_PREVIOUS':
      return t('account.checkout.errors.UNPAID_PREVIOUS', {
        voucherNo: failure.voucherNo ?? '—',
        amount: formatKyat(failure.amount ?? 0),
      });
    case 'OVER_LIMIT':
      return t('account.checkout.errors.OVER_LIMIT', {
        projected: formatKyat(failure.projected ?? 0),
        limit: formatKyat(failure.limit ?? 0),
      });
    default:
      return t(`account.checkout.errors.${failure.code}`);
  }
}

/**
 * The due date in the reader's own calendar. `toISOString()` would print the
 * UTC date, which in Yangon (UTC+6:30) is the day before a midnight due date.
 */
function formatDay(date: Date, language: string): string {
  return new Intl.DateTimeFormat(language === 'my' ? 'my-MM' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    numberingSystem: 'latn',
  }).format(date);
}

export function CreditCheckout({ totals, note }: { totals: OrderTotals; note?: string }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const { role, ready, can, shopId, shopName } = useRole();
  const account = useShopCredit(shopId, role);
  const clearAll = useOrderStore((s) => s.clearAll);

  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!ready || !user || !role || !can('purchase:credit') || totals.lines.length === 0) return null;

  // Staff with no shop chosen yet: say where to choose one.
  if (!shopId) {
    return (
      <section className="rounded-3xl border border-primary/30 bg-primary/5 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Store className="h-4 w-4 text-primary" strokeWidth={2.2} aria-hidden="true" />
          <span className="font-myanmar">{t('account.checkout.title')}</span>
        </p>
        <p className="mt-1 font-myanmar text-[0.8rem] text-muted-foreground">{t('account.checkout.chooseShopFirst')}</p>
        <Button asChild size="lg" variant="outline" className="mt-3 min-h-11 w-full">
          <Link to={ROUTES.credit}>{t('account.checkout.chooseShopAction')}</Link>
        </Button>
      </section>
    );
  }

  const loaded = account.status === 'ready' ? account : null;
  const total = totals.subtotalKyat;
  const gate = loaded ? canPurchase(loaded.credit, total) : null;
  const dueDate = loaded ? computeDueDate(new Date(), loaded.shop.creditTermDays) : null;
  const name = loaded?.shop.name ?? shopName ?? '';

  const place = async () => {
    setBusy(true);
    const result = await handlePurchase({
      actor: { uid: user.uid, name: user.displayName ?? user.email, role },
      shopId,
      lines: totals.lines.map((line) => ({
        frame: line.frame,
        entries: line.entries.map((entry) => ({ cNumber: entry.variant.cNumber, qty: entry.qty })),
      })),
      note,
    });
    setBusy(false);
    setConfirming(false);

    if (result.ok) {
      clearAll();
      toast.success(t('account.checkout.placed', { voucherNo: result.voucherNo, amount: formatKyat(result.grandTotal) }));
      navigate(ROUTES.credit);
    } else {
      if (import.meta.env.DEV && 'cause' in result) console.warn('[credit order]', result.cause);
      toast.error(failureMessage(t, result));
    }
  };

  return (
    <section className="rounded-3xl border-2 border-primary/40 bg-card p-4">
      <h2 className="flex items-center gap-2 text-[0.95rem] font-bold text-foreground">
        <CreditCard className="h-5 w-5 text-primary" strokeWidth={2.2} aria-hidden="true" />
        <span className="font-myanmar">{t('account.checkout.title')}</span>
      </h2>
      <p className="mt-0.5 truncate text-[0.78rem] text-muted-foreground">{name}</p>

      {account.status === 'loading' ? (
        <div className="grid place-items-center py-6" aria-busy="true">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : !loaded ? (
        <p role="alert" className="mt-3 font-myanmar text-sm text-destructive">{t('account.loadFailed')}</p>
      ) : (
        <>
          <dl className="mt-3 space-y-1.5 text-[0.85rem]">
            <div className="flex justify-between gap-3">
              <dt className="font-myanmar font-bold text-foreground">{t('account.checkout.total')}</dt>
              <dd className="font-bold tabular-nums text-foreground">{formatKyat(total)}</dd>
            </div>
            {loaded.credit.creditLimit > 0 ? (
              <div className="flex justify-between gap-3">
                <dt className="font-myanmar text-muted-foreground">{t('account.checkout.availableAfter')}</dt>
                <dd className="tabular-nums text-foreground">
                  {formatKyat(Math.max(0, (loaded.credit.availableCredit ?? 0) - total))}
                </dd>
              </div>
            ) : null}
            {dueDate ? (
              <div className="flex justify-between gap-3">
                <dt className="font-myanmar text-muted-foreground">{t('account.checkout.dueBy')}</dt>
                <dd className="tabular-nums text-foreground">{formatDay(dueDate, i18n.language)}</dd>
              </div>
            ) : null}
          </dl>

          {gate && !gate.allowed ? (
            <p role="alert" className="mt-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-[0.8rem] text-foreground">
              <span className="font-myanmar">{failureMessage(t, { ok: false, ...gate })}</span>
            </p>
          ) : confirming ? (
            <div className="mt-4 space-y-2">
              <p className="font-myanmar text-[0.8rem] font-medium text-foreground">
                {t('account.checkout.confirmPrompt', { amount: formatKyat(total), shop: name })}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="min-h-12 flex-1"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                >
                  {t('account.checkout.cancel')}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="min-h-12 flex-[2] font-bold"
                  disabled={busy}
                  onClick={() => void place()}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  <span className="font-myanmar">{t('account.checkout.confirm')}</span>
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              size="lg"
              className="mt-4 min-h-12 w-full text-base font-bold"
              onClick={() => setConfirming(true)}
            >
              <span className="font-myanmar">{t('account.checkout.place')}</span>
              <span className="tabular-nums">· {formatKyat(total)}</span>
            </Button>
          )}
        </>
      )}
    </section>
  );
}
