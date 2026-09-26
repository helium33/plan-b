/**
 * The voucher as a printed document, not a screenshot of a form.
 *
 * ── Why this is a separate component from the editable fields ──────────────
 * The page around this component lets someone type a shop name, tap a payment
 * chip, pick a branch. Exporting *that* — input boxes, placeholder text,
 * focus rings — produces an image that reads as "a photo of a website," which
 * is the opposite of what a voucher handed to a shop owner should look like.
 * This component takes the same data and renders it the way a printed receipt
 * would: plain text, a letterhead, a ruled total. `voucherRef` in `order.tsx`
 * wraps this and only this, so the PNG/PDF export captures a document.
 *
 * ── Why the colour is a literal hex and not a theme token ─────────────────
 * Everything else in the app resolves colour through the semantic tokens in
 * `theme.css`, and this file is the deliberate exception. The export runs the
 * rendered node through html2canvas, which resolves whatever the element
 * computes to *at that moment* — including the dark theme. A voucher is a
 * document: it is a white page with a teal letterhead whether or not the buyer
 * happens to have dark mode on, so the two colours it depends on are stated
 * outright rather than inherited.
 *
 * `BRAND_TEAL` is the Plan B Vision logo colour, #557C89.
 */
import { useTranslation } from 'react-i18next';

import { GlassesMark } from '@/app/components/brand/brand-logo';
import { env } from '@/lib/env';
import { formatKyat, formatNumber } from '@/lib/format';
import { frameDisplayName } from '@/lib/product';
import type { ShopDetails } from '@/app/stores/order-store';
import { formatPayment, type Bank, type PaymentMethod } from '@/lib/payment';
import type { OrderTotals } from '@/lib/wholesale';

const BRAND_TEAL = '#557C89';

/**
 * The document's own ink, for the same reason `BRAND_TEAL` is a literal.
 *
 * These were `text-foreground` and `text-muted-foreground` until the export was
 * tried in dark mode, where those tokens resolve to near-white — producing a
 * white page with white text on it. A printed voucher has one palette.
 */
const INK = '#1F2937';
const INK_MUTED = '#64748B';
const RULE = '#E2E8F0';

export function PrintableVoucher({
  totals,
  shop,
  shipTo,
  reference,
  paymentMethod,
  bank,
}: {
  totals: OrderTotals;
  shop: ShopDetails;
  /** Resolved destination line — the branch address, or the shop's own. */
  shipTo: string;
  reference: string;
  paymentMethod: PaymentMethod;
  bank: Bank | null;
}) {
  const { t } = useTranslation();

  const today = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <div
      className="overflow-hidden rounded-3xl border bg-white shadow-sm"
      style={{ borderColor: RULE, color: INK }}
    >
      {/* ── Letterhead ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ backgroundColor: BRAND_TEAL }}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
          <GlassesMark className="h-7 w-4 text-white" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-base font-bold tracking-wide text-white">
            {t('voucher.letterheadTitle')}
          </p>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-white/75">
            {t('voucher.letterheadSubtitle')}
          </p>
        </div>

        <p className="ml-auto shrink-0 text-right text-[0.68rem] leading-tight text-white/85" dir="ltr">
          #{reference}
          <br />
          {today}
        </p>
      </div>

      {/* ── Shop details, as text — not the input fields that collected them ── */}
      <div
        className="grid grid-cols-2 gap-x-4 gap-y-1 border-b border-dashed px-5 py-3 text-[0.78rem]"
        style={{ borderColor: RULE }}
      >
        <p className="col-span-2 truncate font-semibold">{shop.shopName.trim() || '—'}</p>
        {shop.contactName.trim() || shop.phone.trim() ? (
          <p style={{ color: INK_MUTED }} dir="ltr">
            {[shop.contactName.trim(), shop.phone.trim()].filter(Boolean).join(' · ')}
          </p>
        ) : null}
        <p className="truncate" style={{ color: INK_MUTED }}>
          {shipTo}
        </p>
        <p className="col-span-2" style={{ color: INK_MUTED }}>
          {t('order.paymentLabel')}:{' '}
          {formatPayment(paymentMethod, bank, (m) => t(`payment.methods.${m}`))}
        </p>
      </div>

      {/* ── Line items ─────────────────────────────────────────────────────── */}
      <table className="w-full text-[0.78rem]">
        <thead>
          <tr
            className="border-b text-left text-[0.65rem] uppercase tracking-wide"
            style={{ borderColor: RULE, color: INK_MUTED }}
          >
            <th className="px-5 py-2 font-medium">{t('voucher.itemColumn')}</th>
            <th className="px-2 py-2 text-right font-medium">{t('order.pieces')}</th>
            <th className="px-5 py-2 text-right font-medium">{t('order.subtotal')}</th>
          </tr>
        </thead>
        <tbody>
          {totals.lines.map((line) => (
            <tr key={line.frame.id} className="border-b last:border-0" style={{ borderColor: RULE }}>
              <td className="px-5 py-2 align-top">
                <p className="font-medium">
                  {line.frame.frameCode} — {frameDisplayName(line.frame)}
                </p>
                <p className="mt-0.5 text-[0.68rem]" style={{ color: INK_MUTED }} dir="ltr">
                  {line.entries.map((e) => `${e.variant.cNumber}×${e.qty}`).join('  ')}
                </p>
              </td>
              <td
                className="px-2 py-2 text-right align-top tabular-nums"
                style={{ color: INK_MUTED }}
              >
                {line.totalPieces}
              </td>
              <td className="px-5 py-2 text-right align-top font-medium tabular-nums">
                {formatKyat(line.subtotalKyat)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/*
        ── Total ───────────────────────────────────────────────────────────
        One row, not a subtotal above an identical net total. There are no
        automatic discounts left to sit between them (see `wholesale.ts`), and
        two rows showing the same figure reads as a sum that failed to apply
        something rather than as a document with nothing to apply.
      */}
      <div
        className="border-t-2 border-dashed px-5 py-3 text-[0.8rem]"
        style={{ borderColor: RULE }}
      >
        <div
          className="flex items-baseline justify-between text-base font-bold"
          style={{ color: BRAND_TEAL }}
        >
          <span>{t('order.netTotal')}</span>
          <span className="tabular-nums">{formatKyat(totals.subtotalKyat)}</span>
        </div>
        <p className="mt-0.5 text-right text-[0.65rem]" style={{ color: INK_MUTED }}>
          {t('order.pieces')}: {formatNumber(totals.totalPieces)}
        </p>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div
        className="px-5 py-3 text-center text-[0.65rem]"
        style={{ borderTop: `2px solid ${BRAND_TEAL}`, color: INK_MUTED }}
      >
        {t('voucher.footer', { telegram: `@${env.telegramHandle}` })}
      </div>
    </div>
  );
}
