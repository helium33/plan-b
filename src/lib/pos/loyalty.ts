/**
 * The on-time payment score, and the 2% coupon it earns.
 *
 * ── What counts as "on time" ───────────────────────────────────────────────
 * The 14-day term, exactly as the credit rules count it: a voucher settled on
 * or before its due date is on time; one settled after it — or still open and
 * already past it — is late. A voucher that is open and not yet due has not
 * been decided either way and is left out, so a shop is never marked down for
 * a bill it still has days to pay.
 *
 * ── Why a rolling window ───────────────────────────────────────────────────
 * The brief says the shop must *maintain* a perfect score, which is about how
 * it pays now. Counting all history would mean one late payment two years ago
 * disqualifies a shop forever; counting only the most recent decided vouchers
 * lets a good payer earn its way back. The window is a named constant because
 * how long a memory to keep is a business choice, not a technical one.
 *
 * ── One coupon per on-time settlement ──────────────────────────────────────
 * "A 2% coupon on the next order" — so the coupon is earned by paying a bill on
 * time and spent by the next order. Without that, a shop with one on-time
 * payment on record could place ten discounted orders in a row off the back of
 * it. The coupon is available when an on-time settlement has landed since the
 * last order that used one.
 *
 * Pure — no Firestore, no clock of its own — so the dashboard that shows the
 * score and `handlePurchase` that applies the discount cannot disagree.
 */
import { endOfDay } from 'date-fns';

import { ageVoucher, computeDueDate } from '@/lib/pos/credit';
import { toDate, type PosVoucher } from '@/lib/pos/schema';

/** The coupon, as a percentage of the order subtotal. */
export const LOYALTY_DISCOUNT_PCT = 2;

/** Written to `vouchers.discountReason` so the POS can tell why a total dropped. */
export const LOYALTY_DISCOUNT_REASON = 'LOYALTY_ON_TIME';

/** How many of the shop's most recent decided vouchers the score looks at. */
export const LOYALTY_WINDOW = 10;

/** A shop needs at least this much paid history before the score means anything. */
export const LOYALTY_MIN_HISTORY = 1;

export type LoyaltyState = {
  /** 0–100, or `null` when there is no decided history yet. */
  scorePct: number | null;
  onTime: number;
  late: number;
  /** Decided vouchers inside the window. */
  considered: number;
  /** Open vouchers already past due — each one blocks the coupon on its own. */
  currentlyOverdue: number;
  perfect: boolean;
  /** Whether the next order gets `LOYALTY_DISCOUNT_PCT` off. */
  couponAvailable: boolean;
};

type Outcome = { voucher: PosVoucher; decidedAt: Date; onTime: boolean };

/**
 * When a voucher was paid off, as best the documents can say.
 *
 * `settledAt` is written by the POS's payment batch and by `processReturn`. A
 * voucher paid in full at the counter never gets one — it was paid the moment
 * it was issued. Older documents may have neither, so `updatedAt` is the last
 * resort: the settling write is the last write such a voucher receives.
 */
function settledAt(voucher: PosVoucher): Date | null {
  const explicit = toDate(voucher.settledAt);
  if (explicit) return explicit;
  if (voucher.paymentAtIssue >= voucher.grandTotal) return toDate(voucher.issueDate);
  return toDate(voucher.updatedAt);
}

function outcomeOf(voucher: PosVoucher, today: Date): Outcome | null {
  if (voucher.type !== 'SALE' || voucher.status === 'VOID' || voucher.status === 'DRAFT') {
    return null;
  }

  const issueDate = toDate(voucher.issueDate);
  const dueDate = toDate(voucher.dueDate) ?? (issueDate ? computeDueDate(issueDate, voucher.termDays) : null);
  if (!dueDate) return null;

  if (voucher.status === 'PAID' || voucher.balanceDue <= 0) {
    const paid = settledAt(voucher);
    if (!paid) return null;
    // Due *on* the due date means any time that day counts.
    return { voucher, decidedAt: paid, onTime: paid <= endOfDay(dueDate) };
  }

  const aging = ageVoucher(voucher, today);
  return aging.isOverdue ? { voucher, decidedAt: today, onTime: false } : null;
}

export function evaluateLoyalty(vouchers: readonly PosVoucher[], today: Date): LoyaltyState {
  const decided = vouchers
    .map((voucher) => outcomeOf(voucher, today))
    .filter((outcome): outcome is Outcome => outcome !== null)
    .sort((a, b) => b.decidedAt.getTime() - a.decidedAt.getTime());

  const window = decided.slice(0, LOYALTY_WINDOW);
  const onTime = window.filter((o) => o.onTime).length;
  const late = window.length - onTime;

  // Counted over *all* vouchers, not the window: an old bill that is still
  // unpaid and overdue is a present-day problem, however many newer vouchers
  // were settled since.
  const currentlyOverdue = vouchers.filter(
    (v) => v.type === 'SALE' && v.balanceDue > 0 && v.status !== 'VOID' && ageVoucher(v, today).isOverdue,
  ).length;

  const scorePct = window.length > 0 ? Math.round((onTime / window.length) * 100) : null;
  const perfect = window.length >= LOYALTY_MIN_HISTORY && late === 0 && currentlyOverdue === 0;

  // The coupon is spent by an order that used it. It is earned again only by
  // an on-time settlement that happened *after* that order was placed.
  const lastCouponUse = vouchers
    .filter((v) => v.discountReason === LOYALTY_DISCOUNT_REASON && v.status !== 'VOID')
    .map((v) => toDate(v.issueDate)?.getTime() ?? 0)
    .reduce((latest, at) => Math.max(latest, at), 0);

  const earnedSinceLastUse = window.some(
    (o) => o.onTime && o.decidedAt.getTime() > lastCouponUse,
  );

  return {
    scorePct,
    onTime,
    late,
    considered: window.length,
    currentlyOverdue,
    perfect,
    couponAvailable: perfect && earnedSinceLastUse,
  };
}

/** The coupon's value on a given subtotal, in whole kyat. */
export function loyaltyDiscount(subtotal: number): number {
  return Math.round((Math.max(0, subtotal) * LOYALTY_DISCOUNT_PCT) / 100);
}
