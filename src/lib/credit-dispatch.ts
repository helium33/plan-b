/**
 * Formatting a credit voucher as text, for Telegram/Viber/copy.
 *
 * A companion to `lib/dispatch.ts`, not a merge into it: the ordinary wholesale
 * voucher and the credit voucher price two genuinely different things — a
 * one-off order against the catalogue's own discount rules, versus an order
 * folded into a shop's running balance — and forcing one formatter to cover
 * both would mean every field on both had to make sense on either, which they
 * do not. `buildTelegramUrl`, `buildViberUrl` and `copyOrderMessage` are
 * already generic over a plain string and are reused as-is from there.
 */
import type { CreditOrderLine } from '@/lib/firestore/credit';
import type { CreditShop, CreditVoucherTotals } from '@/lib/credit';

/** Grouped thousands, no currency word — the message adds "Ks" per line. */
function ks(amount: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(amount));
}

/**
 * A short, content-derived reference — e.g. `WS-7QK2`.
 *
 * Derived rather than random, so the number shown while a voucher is being
 * drafted (before anything is saved) is the exact number it is saved under a
 * moment later. Changing the payment amount changes the reference, which is
 * the intended behaviour: the reference names *this specific voucher*, and a
 * voucher with a different payment is a different voucher, not an edit to the
 * old one.
 */
export function creditVoucherReference(shop: CreditShop, totals: CreditVoucherTotals): string {
  const seed = [shop.id, totals.totalDueKyat, totals.paymentKyat, totals.remainingKyat].join('|');

  // FNV-1a. Not a security hash — it just needs to spread similar vouchers
  // across different codes, and to be four lines rather than a dependency.
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return `WS-${hash.toString(36).toUpperCase().slice(-4).padStart(4, '0')}`;
}

export type CreditVoucherLabels = {
  heading: string;
  shopLabel: string;
  voucherNo: string;
  currentSubtotal: string;
  previousBalance: string;
  totalDue: string;
  todayPayment: string;
  remainingBalance: string;
  dueDate: string;
  dueDateTerm: string;
};

/**
 * The plain-text voucher, formatted to the shop's own layout convention — a
 * ruled banner, numbered lines, and the two figures that matter most (Total
 * Due and Remaining Balance) marked with ★ so they stand out even unformatted
 * in a chat bubble.
 */
export function formatCreditVoucherMessage(
  shop: CreditShop,
  lines: CreditOrderLine[],
  totals: CreditVoucherTotals,
  paymentMethod: string,
  dueDateIso: string,
  reference: string,
  labels: CreditVoucherLabels,
): string {
  const rule = '='.repeat(50);
  const thin = '-'.repeat(50);

  const out: string[] = [
    rule,
    labels.heading,
    rule,
    `${labels.shopLabel}: ${shop.name}`,
    `${labels.voucherNo}: #${reference}`,
    thin,
  ];

  lines.forEach((line) => {
    out.push(
      `${line.frameCode} — ${line.name}: ${line.colours.map((c) => `${c.cNumber}×${c.qty}`).join(' ')}`,
    );
  });
  if (lines.length > 0) out.push('');

  out.push(
    `${labels.currentSubtotal}: ${ks(totals.currentItemsKyat)} Ks`,
    `${labels.previousBalance}: ${ks(totals.previousBalanceKyat)} Ks`,
    thin,
    `${labels.totalDue}: ${ks(totals.totalDueKyat)} Ks`,
    `${labels.todayPayment}: ${ks(totals.paymentKyat)} Ks (${paymentMethod})`,
    thin,
    `★ ${labels.remainingBalance}: ${ks(totals.remainingKyat)} Ks`,
    `★ ${labels.dueDate}: ${dueDateIso} (${labels.dueDateTerm})`,
    rule,
  );

  return out.join('\n');
}
