/**
 * Getting the finished order out: to Telegram, to Viber, to the clipboard, or
 * saved as an image or PDF.
 *
 * ── Why the copy fallback is always present, not only on failure ───────────
 * Three things can go wrong on the way out, and none are visible to us: the
 * deep link can exceed what the OS will hand to the app, the app may not be
 * installed, and a desktop browser may simply do nothing with a `viber://` URL.
 * A silent no-op looks exactly like a sent order, which is the one outcome that
 * must not happen — so the message is always available to copy, and an
 * over-length order swaps the buttons out for the full text instead of offering
 * a link that would arrive truncated.
 */
import { useState } from 'react';
import { AlertTriangle, Check, Copy, Download, FileText, Image, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { TelegramIcon, ViberIcon } from '@/app/components/order/brand-icons';
import { Button } from '@/app/components/ui/button';
import type { Branch, ShopDetails } from '@/app/stores/order-store';
import {
  buildTelegramUrl,
  buildViberUrl,
  copyOrderMessage,
  dispatchBlockReason,
  formatOrderMessage,
  orderReference,
  resolveShipTo,
  type DispatchContext,
  type DispatchLabels,
} from '@/lib/dispatch';
import { env } from '@/lib/env';
import { exportVoucher } from '@/lib/media/download';
import { formatPayment, type Bank, type PaymentMethod } from '@/lib/payment';
import type { OrderTotals } from '@/lib/wholesale';

export function DispatchPanel({
  totals,
  shop,
  branch,
  paymentMethod,
  bank,
  voucherRef,
  onSent,
}: {
  totals: OrderTotals;
  shop: ShopDetails;
  /** The chosen destination, or `null` for the main shop address. */
  branch: Branch | null;
  paymentMethod: PaymentMethod;
  bank: Bank | null;
  /** The voucher element, captured for the image and PDF exports. */
  voucherRef: React.RefObject<HTMLElement>;
  /** Called once the order has actually left, so it can be filed in history. */
  onSent: (reference: string, message: string) => void;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null);

  const labels: DispatchLabels = {
    heading: t('dispatch.heading'),
    shop: t('order.fields.shopName'),
    contact: t('order.fields.contactName'),
    location: t('order.fields.location'),
    shipTo: t('order.shipToLabel'),
    // The section heading carries a bilingual decoration for the screen; the
    // message wants the bare word.
    payment: t('order.paymentLabel'),
    pieces: t('order.pieces'),
    total: t('order.netTotal'),
    note: t('order.fields.note'),
    reference: t('order.reference'),
    currency: t('common.currency'),
  };

  const context: DispatchContext = {
    shipTo: resolveShipTo(branch, shop, t('order.mainShop')),
    payment: formatPayment(paymentMethod, bank, (method) => t(`payment.methods.${method}`)),
  };

  const reference = orderReference(totals, shop);
  const message = formatOrderMessage(totals, shop, labels, context);
  const telegram = buildTelegramUrl(message);
  const viber = buildViberUrl(message);
  const tooLong = !telegram.ok && !viber.ok;

  // Shared with the cart drawer's own send buttons — see `dispatchBlockReason`.
  const blockedReason = dispatchBlockReason(paymentMethod, bank, shop);
  const blocked = blockedReason !== null;

  const copy = async () => {
    const ok = await copyOrderMessage(message);
    setCopied(ok);
    toast[ok ? 'success' : 'error'](t(ok ? 'dispatch.copied' : 'dispatch.copyFailed'));
    if (ok) {
      onSent(reference, message);
      window.setTimeout(() => setCopied(false), 2_500);
    }
  };

  const save = async (format: 'png' | 'pdf') => {
    if (!voucherRef.current) return;
    setExporting(format);

    const result = await exportVoucher(
      voucherRef.current,
      `${reference}-${shop.shopName.trim() || 'voucher'}`,
      format,
    );

    setExporting(null);
    toast[result.ok ? 'success' : 'error'](
      t(result.ok ? 'dispatch.exportSaved' : 'dispatch.exportFailed'),
    );
    if (result.ok) onSent(reference, message);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">
        <span className="font-myanmar">{t('dispatch.title')}</span>
      </h2>
      <p className="mt-0.5 text-[0.72rem] leading-relaxed text-muted-foreground">
        {t('dispatch.hint', { reference })}
      </p>

      {blockedReason ? (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-orange-500/40 bg-orange-500/5 px-3 py-2 text-[0.78rem] text-foreground"
        >
          <span className="font-myanmar">
            {t(blockedReason === 'bank' ? 'order.bankRequired' : 'order.shopNameRequiredForCredit')}
          </span>
        </p>
      ) : null}

      {tooLong ? (
        <div className="mt-3 rounded-xl border border-gold-500/40 bg-gold-500/5 p-3">
          <p className="flex items-center gap-2 text-[0.78rem] font-medium text-foreground">
            <AlertTriangle
              className="h-4 w-4 shrink-0 text-gold-600 dark:text-gold-300"
              strokeWidth={2}
              aria-hidden="true"
            />
            {t('dispatch.tooLongTitle')}
          </p>
          <p className="mt-1 text-[0.72rem] leading-relaxed text-muted-foreground">
            {t('dispatch.tooLongBody')}
          </p>
        </div>
      ) : (
        <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
          {telegram.ok ? (
            <Button asChild={!blocked} size="lg" className="min-h-11 w-full" disabled={blocked}>
              {blocked ? (
                <span>
                  <TelegramIcon className="h-4 w-4" />
                  {t('dispatch.telegram')}
                </span>
              ) : (
                // `noreferrer` on an outbound link carrying the order: the
                // referrer would leak this app's URL into Telegram's logs.
                <a
                  href={telegram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onSent(reference, message)}
                >
                  <TelegramIcon className="h-4 w-4" />
                  {t('dispatch.telegram')}
                </a>
              )}
            </Button>
          ) : null}

          {viber.ok ? (
            <Button
              asChild={!blocked}
              size="lg"
              variant="outline"
              className="min-h-11 w-full"
              disabled={blocked}
            >
              {blocked ? (
                <span>
                  <ViberIcon className="h-4 w-4" />
                  {t('dispatch.viber')}
                </span>
              ) : (
                <a href={viber.url} onClick={() => onSent(reference, message)}>
                  <ViberIcon className="h-4 w-4" />
                  {t('dispatch.viber')}
                </a>
              )}
            </Button>
          ) : null}
        </div>
      )}

      <Button
        type="button"
        variant={tooLong ? 'default' : 'secondary'}
        size="lg"
        className="mt-2 min-h-11 w-full"
        onClick={() => void copy()}
      >
        {copied ? (
          <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        )}
        <span className="font-myanmar">{t(copied ? 'dispatch.copied' : 'dispatch.copy')}</span>
      </Button>

      {/* ── Save a copy ──────────────────────────────────────────────────── */}
      <div className="mt-4 border-t border-border pt-3">
        <p className="text-[0.75rem] font-medium text-foreground">
          <span className="font-myanmar">{t('dispatch.saveSection')}</span>
        </p>
        <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">
          {t('dispatch.saveHint')}
        </p>

        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11 w-full"
            disabled={exporting !== null}
            onClick={() => void save('png')}
          >
            {exporting === 'png' ? (
              <Download className="h-4 w-4 animate-pulse" aria-hidden="true" />
            ) : (
              <Image className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            )}
            {t('dispatch.saveImage')}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11 w-full"
            disabled={exporting !== null}
            onClick={() => void save('pdf')}
          >
            {exporting === 'pdf' ? (
              <Download className="h-4 w-4 animate-pulse" aria-hidden="true" />
            ) : (
              <FileText className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            )}
            {t('dispatch.savePdf')}
          </Button>
        </div>
      </div>

      {/*
        The raw message, collapsed.

        Kept selectable rather than hidden: when a deep link silently fails —
        which on desktop it does — this is the only way the order gets out, and
        asking someone to re-type it is not a recovery path.
      */}
      <details className="mt-3">
        <summary className="cursor-pointer list-none py-2 text-[0.72rem] font-medium text-muted-foreground transition-colors hover:text-foreground">
          <Send className="mr-1 inline h-3 w-3" strokeWidth={2} aria-hidden="true" />
          {t('dispatch.preview')}
        </summary>
        <textarea
          readOnly
          value={message}
          rows={10}
          aria-label={t('dispatch.preview')}
          onFocus={(event) => event.currentTarget.select()}
          className="mt-2 w-full resize-y rounded-lg border border-border bg-muted/40 p-2.5 font-mono text-[0.68rem] leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </details>

      <p className="mt-3 text-center text-[0.68rem] text-muted-foreground">
        {t('dispatch.contactLine', { telegram: `@${env.telegramHandle}`, viber: env.viberNumber })}
      </p>
    </section>
  );
}
