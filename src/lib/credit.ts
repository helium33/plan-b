/**
 * The wholesale credit ledger: one running balance per shop, on a 14-day cycle.
 *
 * Pure functions over plain data — no React, no Firestore — because a credit
 * balance is money, and money that depends on hidden component state is money
 * nobody can audit. I/O lives in `firestore/credit.ts`.
 *
 * ── Why one balance, not per-invoice aging ──────────────────────────────────
 * The wholesale voucher tracks a single "previous balance" per shop rather than
 * a list of open invoices at different ages. That is a deliberate simplification
 * over a full accounts-receivable ledger: this trade settles by phone call, not
 * by matching individual invoice numbers, and a shop owner asking "what do I
 * owe?" wants one number, not a statement to reconcile. Every credit voucher
 * folds whatever was owed into the new total and rolls the unpaid remainder
 * forward as the *next* previous balance — so the ledger is always exactly one
 * figure, current as of the last voucher.
 *
 * ── The cycle, in one paragraph ─────────────────────────────────────────────
 * A shop's `dueDateIso` marks when its current balance is due. Every voucher
 * resets it to fourteen days out, whatever the remaining balance turns out to
 * be — paying in full, paying half, or paying nothing all produce a fresh
 * cycle, because a voucher is itself the event that re-starts the clock. What a
 * shop cannot do is let a cycle expire untouched: `deriveStatus` checks the
 * *calendar*, not the last voucher, so a balance still owed after its due date
 * has passed goes on hold automatically the next time anyone looks, with no
 * voucher required to trigger it.
 */

/** Every credit cycle is this many days, both the term and the reminder base. */
export const CREDIT_CYCLE_DAYS = 14;

/** A hold derived from stale time and money needs no confirmation click. */
export const AUTO_HOLD_AFTER_DAYS = CREDIT_CYCLE_DAYS;

/** Reminders are informational only, shown a few days ahead of the due date. */
export const DUE_SOON_WITHIN_DAYS = 3;

export const KYAT_PER_LAKH = 100_000;

/* ── Shapes ────────────────────────────────────────────────────────────────── */

export type CreditShop = {
  id: string;
  name: string;
  phone: string;
  creditLimitKyat: number;
  /** What is owed as of the last voucher. Zero means clear. */
  previousBalanceKyat: number;
  /** `YYYY-MM-DD` the current balance is due, or `null` with a zero balance. */
  dueDateIso: string | null;
  /**
   * A hold set by a person, independent of the calendar math.
   *
   * Distinct from the *derived* auto-hold so that releasing an auto-hold — by
   * simply granting a fresh cycle — cannot be confused with staff deliberately
   * freezing an account that is otherwise in good standing (a dispute, a
   * bounced payment, a relationship on pause). The two must be lifted through
   * different actions, because they mean different things.
   */
  manualHold: boolean;
  createdAtMs: number;
};

export type CreditStatus = 'active' | 'due-soon' | 'hold';

export type HoldReason = 'manual' | 'overdue';

export type ShopStanding = {
  shop: CreditShop;
  status: CreditStatus;
  holdReasons: HoldReason[];
  /** Days until `dueDateIso`; negative once past due. `null` with no balance. */
  daysUntilDue: number | null;
};

/* ── Dates ─────────────────────────────────────────────────────────────────── */

const DAY_MS = 86_400_000;

/** Parses `YYYY-MM-DD` at UTC noon, so no timezone offset can shift the day. */
function parseDay(iso: string): number {
  return new Date(iso + 'T12:00:00Z').getTime();
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseDay(toIso) - parseDay(fromIso)) / DAY_MS);
}

export function toIsoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** A fresh due date, `CREDIT_CYCLE_DAYS` after the given day. */
export function nextDueDate(fromIso: string): string {
  return toIsoDay(new Date(parseDay(fromIso) + CREDIT_CYCLE_DAYS * DAY_MS));
}

/* ── Standing ──────────────────────────────────────────────────────────────── */

/**
 * A shop's status, worked out fresh from its stored fields and today's date.
 *
 * Not stored, on purpose: a stored `status` field is a cache, and a cache that
 * silently goes stale is exactly how a shop keeps ordering three weeks past its
 * due date. Deriving it means the hold applies itself the moment anyone opens
 * the page — no cron job, no reminder that has to fire on time to matter.
 */
export function deriveStanding(shop: CreditShop, todayIso: string): ShopStanding {
  // A due date only means anything while money is actually owed against it. A
  // fully paid shop's `dueDateIso` is leftover metadata from its last voucher —
  // arbitrarily far in the past by the time the balance sits at zero — and
  // must not drive status at all, positively or negatively. Every date check
  // below is therefore gated on a positive balance, not just the "overdue"
  // hold: without that same gate on "due soon", a stale date sitting deep in
  // the past satisfies `daysUntilDue <= DUE_SOON_WITHIN_DAYS` from the wrong
  // side — `-14 <= 3` is true — and a shop that owes nothing gets flagged as
  // needing a reminder it will never receive a bill for.
  const hasBalance = shop.previousBalanceKyat > 0;
  const daysUntilDue = hasBalance && shop.dueDateIso ? daysBetween(todayIso, shop.dueDateIso) : null;

  const holdReasons: HoldReason[] = [];
  if (shop.manualHold) holdReasons.push('manual');
  if (daysUntilDue !== null && daysUntilDue < 0) holdReasons.push('overdue');

  const status: CreditStatus =
    holdReasons.length > 0
      ? 'hold'
      : daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= DUE_SOON_WITHIN_DAYS
        ? 'due-soon'
        : 'active';

  return { shop, status, holdReasons, daysUntilDue };
}

/* ── Voucher math ──────────────────────────────────────────────────────────── */

export type CreditVoucherTotals = {
  /** The order being placed today, before credit is applied. */
  currentItemsKyat: number;
  previousBalanceKyat: number;
  totalDueKyat: number;
  paymentKyat: number;
  /** What stays owed after today's payment. Never negative. */
  remainingKyat: number;
  /** True when `remainingKyat` alone would exceed the shop's credit limit. */
  overLimit: boolean;
};

/**
 * The arithmetic behind one voucher.
 *
 * `paymentKyat` is clamped to the total due — a payment larger than what is
 * owed is not credit-worthy input, it is a typo, and letting it produce a
 * negative remaining balance would silently hand the shop a credit in kyat this
 * ledger has no field to represent.
 */
export function computeCreditVoucher(
  currentItemsKyat: number,
  shop: CreditShop,
  paymentInputKyat: number,
): CreditVoucherTotals {
  const totalDueKyat = currentItemsKyat + shop.previousBalanceKyat;
  const paymentKyat = Math.min(Math.max(0, Math.round(paymentInputKyat)), totalDueKyat);
  const remainingKyat = totalDueKyat - paymentKyat;

  return {
    currentItemsKyat,
    previousBalanceKyat: shop.previousBalanceKyat,
    totalDueKyat,
    paymentKyat,
    remainingKyat,
    overLimit: remainingKyat > shop.creditLimitKyat,
  };
}

/** `750000` → `7.5`, the "Ks 7.5 L" shorthand the trade quotes limits in. */
export function toLakhs(amountKyat: number): number {
  return Math.round((amountKyat / KYAT_PER_LAKH) * 10) / 10;
}
