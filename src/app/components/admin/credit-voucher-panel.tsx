/**
 * The voucher itself: today's order against the shop's running balance.
 *
 * ── Where "today's order" comes from ────────────────────────────────────────
 * This reuses the *same* draft cart the public catalogue writes to
 * (`useOrderStore`), rather than a second item picker. Staff browse the
 * catalogue on the same device — filters, C-colour steppers, all of it — build
 * up what a shop phoned in for, then land here to fold it into that shop's
 * credit. Duplicating a cart UI here would diverge from the one buyers already
 * use and double the surface area for the two to disagree.
 *
 * ── Why the send buttons double as the "save" action ────────────────────────
 * There is no separate "confirm" step before dispatch, matching the ordinary
 * wholesale voucher's own pattern: the *first successful send* — Telegram,
 * Viber, or copy — is what commits the voucher to Firestore and rolls the
 * shop's balance forward. Nothing is written while the admin is still turning
 * the payment amount over in their head. A voucher generated but never sent is
 * indistinguishable from one that was decided against, and should leave no
 * ledger trace.
 */
import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Copy, ReceiptText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import { useFrames } from '@/app/hooks/use-frames';
import { useOrderStore } from '@/app/stores/order-store';
import { computeCreditVoucher, nextDueDate, toIsoDay, type CreditShop } from '@/lib/credit';
import {
  creditVoucherReference,
  formatCreditVoucherMessage,
  type CreditVoucherLabels,
} from '@/lib/credit-dispatch';
import { buildTelegramUrl, buildViberUrl, copyOrderMessage } from '@/lib/dispatch';
import { env } from '@/lib/env';
import { recordCreditVoucher, type CreditOrderLine } from '@/lib/firestore/credit';
import { formatKyat } from '@/lib/format';
import { frameDisplayName } from '@/lib/product';
import { priceOrder } from '@/lib/wholesale';

const PAYMENT_METHODS = ['KPay', 'WavePay', 'Bank Transfer', 'Cash'] as const;

export function CreditVoucherPanel({
  shop,
  onSaved,
}: {
  shop: CreditShop;
  /** Fired after a voucher is actually recorded, so the caller can clear state. */
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const { frames } = useFrames();
  const quantities = useOrderStore((s) => s.quantities);
  const clearAll = useOrderStore((s) => s.clearAll);

  const [payment, setPayment] = useState('');
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>('KPay');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const draftTotals = useMemo(() => priceOrder(frames ?? [], quantities), [frames, quantities]);
  const hasDraft = draftTotals.lines.length > 0;

  const totals = computeCreditVoucher(draftTotals.subtotalKyat, shop, Number(payment) || 0);
  // Not memoised: it is a cheap computation and its one input is "now", which
  // memoising on an empty dependency array would freeze at mount time — wrong
  // for a page an admin might leave open across a day boundary.
  const dueDateIso = nextDueDate(toIsoDay(new Date()));

  const lines: CreditOrderLine[] = draftTotals.lines.map((line) => ({
    frameId: line.frame.id,
    frameCode: line.frame.frameCode,
    name: frameDisplayName(line.frame),
    unitPriceKyat: line.frame.wholesalePrice,
    colours: line.entries.map((e) => ({ cNumber: e.variant.cNumber, qty: e.qty })),
    totalPieces: line.totalPieces,
  }));

  const reference = creditVoucherReference(shop, totals);

  const labels: CreditVoucherLabels = {
    heading: 'PLAN B VISION WHOLESALE\n' + ' '.repeat(15) + 'WHOLESALE VOUCHER',
    shopLabel: t('credit.voucherShopLabel'),
    voucherNo: t('credit.voucherNoLabel'),
    currentSubtotal: t('credit.voucherCurrentSubtotal'),
    previousBalance: t('credit.voucherPreviousBalance'),
    totalDue: t('credit.voucherTotalDue'),
    todayPayment: t('credit.voucherTodayPayment'),
    remainingBalance: t('credit.voucherRemainingBalance'),
    dueDate: t('credit.voucherDueDate'),
    dueDateTerm: t('credit.voucherDueDateTerm'),
  };

  const message = formatCreditVoucherMessage(shop, lines, totals, method, dueDateIso, reference, labels);
  const telegram = buildTelegramUrl(message);
  const viber = buildViberUrl(message);

  /**
   * Writes the voucher and rolls the shop's balance forward.
   *
   * Deliberately *not* awaited by the Telegram/Viber click handlers below —
   * awaiting first would delay `window.location`/the anchor's own navigation
   * past the click that has to trigger it, and several browsers refuse to open
   * a `tg://` or `viber://` handler once it is no longer inside the original
   * user gesture. So the message goes out and the save races alongside it.
   *
   * What this function does NOT do, unlike the ordinary wholesale voucher's
   * save-after-send, is swallow a failure quietly. That pattern is right for a
   * one-off order where "the order already left, an error now would be a lie"
   * — but this write also moves real money on a running ledger, and a failed
   * transaction here means the shop's balance was never actually updated even
   * though a message just told them what they owe. Staff need to know that,
   * every time, so they can re-open the panel and try again rather than trust
   * a number that was never saved.
   */
  const save = async () => {
    if (saving) return false;
    setSaving(true);
    try {
      await recordCreditVoucher({
        shop,
        lines,
        currentItemsKyat: totals.currentItemsKyat,
        paymentKyat: totals.paymentKyat,
        paymentMethod: method,
        remainingKyat: totals.remainingKyat,
      });
      clearAll();
      setPayment('');
      onSaved();
      toast.success(t('credit.voucherSaved'));
      return true;
    } catch {
      toast.error(t('credit.voucherSaveFailed'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    const ok = await copyOrderMessage(message);
    setCopied(ok);
    if (ok) {
      await save();
      window.setTimeout(() => setCopied(false), 2_500);
    } else {
      toast.error(t('dispatch.copyFailed'));
    }
  };

  if (!hasDraft) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
        <ReceiptText className="mx-auto h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
        <p className="mt-2 text-sm font-medium text-foreground">
          <span className="font-myanmar">{t('credit.noDraft')}</span>
        </p>
        <p className="mt-1 text-[0.78rem] text-muted-foreground">{t('credit.noDraftHint')}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">
        <span className="font-myanmar">{t('credit.voucherSection')}</span>
      </h2>

      <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
        {draftTotals.lines.map((line) => (
          <li key={line.frame.id} className="flex items-center justify-between gap-2 px-3 py-2 text-[0.8rem]">
            <span className="min-w-0 truncate">
              <span className="font-semibold text-primary">{line.frame.frameCode}</span>{' '}
              <span className="text-muted-foreground">
                {line.entries.map((e) => `${e.variant.cNumber}×${e.qty}`).join(' ')}
              </span>
            </span>
            <span className="shrink-0 font-medium tabular-nums">
              {formatKyat(line.subtotalKyat)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 space-y-1.5 text-[0.82rem]">
        <div className="flex justify-between text-muted-foreground">
          <span className="font-myanmar">{t('credit.voucherCurrentSubtotal')}</span>
          <span className="tabular-nums">{formatKyat(totals.currentItemsKyat)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span className="font-myanmar">{t('credit.voucherPreviousBalance')}</span>
          <span className="tabular-nums">{formatKyat(totals.previousBalanceKyat)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold text-foreground">
          <span className="font-myanmar">{t('credit.voucherTotalDue')}</span>
          <span className="tabular-nums">{formatKyat(totals.totalDueKyat)}</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="block text-[0.72rem] font-medium text-foreground">
            <span className="font-myanmar">{t('credit.voucherTodayPayment')}</span>
          </span>
          <input
            value={payment}
            onChange={(e) => setPayment(e.target.value.replace(/[^\d]/g, ''))}
            inputMode="numeric"
            dir="ltr"
            placeholder="0"
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold"
          />
        </label>

        <label className="space-y-1">
          <span className="block text-[0.72rem] font-medium text-foreground">{t('credit.paymentMethod')}</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as (typeof PAYMENT_METHODS)[number])}
            className="h-11 w-full rounded-lg border border-border bg-background px-2 text-sm"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className={cn(
          'mt-3 rounded-xl border p-3 text-center',
          totals.overLimit ? 'border-destructive/30 bg-destructive/5' : 'border-primary/30 bg-primary/5',
        )}
      >
        <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          <span className="font-myanmar">{t('credit.voucherRemainingBalance')}</span>
        </p>
        <p
          className={cn(
            'text-xl font-bold tabular-nums',
            totals.overLimit ? 'text-destructive' : 'text-foreground',
          )}
        >
          {formatKyat(totals.remainingKyat)}
        </p>

        {totals.overLimit ? (
          <p className="mt-1 flex items-center justify-center gap-1 text-[0.72rem] font-medium text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="font-myanmar">{t('credit.overLimitWarning')}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {telegram.ok ? (
          <Button asChild size="lg" disabled={saving} className={cn(saving && 'pointer-events-none opacity-60')}>
            <a href={telegram.url} target="_blank" rel="noopener noreferrer" onClick={() => void save()}>
              {t('dispatch.telegram')}
            </a>
          </Button>
        ) : null}
        {viber.ok ? (
          <Button
            asChild
            size="lg"
            variant="outline"
            disabled={saving}
            className={cn(saving && 'pointer-events-none opacity-60')}
          >
            {/* No `target`: a custom `viber://` scheme is not a navigable
                document, so opening it in a new tab would just leave a blank
                one behind. The current tab handles the OS handoff and stays
                put on this page either way. */}
            <a href={viber.url} onClick={() => void save()}>
              {t('dispatch.viber')}
            </a>
          </Button>
        ) : null}
      </div>

      <Button type="button" variant="secondary" className="mt-2 w-full" disabled={saving} onClick={() => void copy()}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {t(copied ? 'dispatch.copied' : 'dispatch.copy')}
      </Button>

      <p className="mt-2 text-center text-[0.68rem] text-muted-foreground">
        {t('order.reference')}: #{reference} · {env.telegramHandle}
      </p>
    </section>
  );
}
