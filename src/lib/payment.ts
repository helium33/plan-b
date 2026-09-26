/**
 * How a wholesale order gets paid for.
 *
 * ── Why the bank is a separate field from the method ───────────────────────
 * "Bank transfer" alone is not actionable: the shop has accounts at more than
 * one bank and needs to know which one the money is coming into, or the payment
 * sits unmatched for days. So choosing a transfer forces a bank choice, while
 * KPay and cash-on-delivery carry no second question at all.
 *
 * ── Why `credit` needs a shop name but not a shop *record* ──────────────────
 * This module has no idea the wholesale credit ledger (`lib/credit.ts`) exists,
 * and that is deliberate. The ordinary voucher is filled in by anyone — no
 * sign-in, no admin check — while `creditShops`/`creditOrders` in Firestore are
 * staff-only precisely because they hold a real running balance. Letting this
 * page read or write that ledger would mean opening it to the public to
 * support one payment chip. So `credit` here means only "put the shop's name
 * on the message and let staff reconcile it" — the shop name the buyer already
 * typed into the ordinary shop-details field is reused as the identifier, and
 * the actual balance is only ever touched from `/admin/credit`, by a human, on
 * purpose, after reading the message this produces.
 *
 * These values are written verbatim into the order message the shop receives,
 * so they are stored as stable ids and translated only for display.
 */

export const PAYMENT_METHODS = ['kpay', 'bank-transfer', 'cod', 'credit'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** The banks this shop actually holds accounts with. */
export const BANKS = ['AYA', 'CB', 'KBZ'] as const;
export type Bank = (typeof BANKS)[number];

export const paymentMethodKey = (v: PaymentMethod) => `payment.methods.${v}` as const;

/** True when the method needs a bank picked alongside it. */
export function needsBank(method: PaymentMethod): boolean {
  return method === 'bank-transfer';
}

/** True when the method needs a shop name to be reconciled against later. */
export function needsShopName(method: PaymentMethod): boolean {
  return method === 'credit';
}

/**
 * The payment line for the order message, already translated.
 *
 * Returns a single string because that is how it is read — "Payment: Bank
 * transfer (KBZ)" — rather than making every caller re-join the two parts and
 * pick its own separator.
 */
export function formatPayment(
  method: PaymentMethod,
  bank: Bank | null,
  label: (method: PaymentMethod) => string,
): string {
  return needsBank(method) && bank ? `${label(method)} (${bank})` : label(method);
}
