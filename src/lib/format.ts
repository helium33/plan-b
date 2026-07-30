/**
 * Display formatting for money, points and dates.
 *
 * Numerals stay Western in both languages. That is a deliberate carry-over from
 * the Burmese locale file: Myanmar digits (၁၂၃) are correct in prose but prices,
 * phone numbers and dates are read in Western numerals in practice — including
 * on the shop's own receipts — and a price nobody can scan quickly is a price
 * that loses a sale.
 */

const GROUPED = new Intl.NumberFormat('en-US');

/** `450000` → `450,000 MMK`. */
export function formatKyat(amount: number, currency = 'MMK'): string {
  return `${GROUPED.format(Math.round(amount))} ${currency}`;
}

/** `1250` → `1,250`. Used for point totals, which are always whole. */
export function formatNumber(value: number): string {
  return GROUPED.format(Math.round(value));
}

/**
 * A Firestore timestamp as a short date, in the reader's language.
 *
 * Accepts the `{ toDate() }` shape rather than a `Date` because that is what
 * Firestore returns, and returns an em dash for the pending case — a document
 * read back before the server clock has been applied genuinely has no date yet,
 * and rendering "Invalid Date" is worse than admitting it.
 */
export function formatDate(
  value: { toDate(): Date } | null | undefined,
  language: string,
): string {
  const date = value?.toDate();
  if (!date || Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(language === 'my' ? 'my-MM' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    numberingSystem: 'latn',
  }).format(date);
}
