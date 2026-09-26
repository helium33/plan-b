/**
 * The POS's 14-day credit rules, as this app needs them.
 *
 * ── A port, not a second opinion ───────────────────────────────────────────
 * The source of truth is `src/domain/credit.js` in the POS repo, pinned by its
 * `credit.test.js`. Everything here follows it line for line — the same day
 * maths, the same statuses, the same "open receivable" test — because a shop
 * that the POS considers LOCKED must not be able to order here, and a shop the
 * POS considers fine must not be refused here. If you change a rule, change it
 * there first and mirror it here.
 *
 * Only the pieces a customer screen needs are ported: ageing one voucher,
 * rolling a shop up, and the purchase gate. Portfolio roll-ups and collection
 * worklists stay in the POS, where the people who use them are.
 *
 * ── Why status is derived, not read ────────────────────────────────────────
 * Same reason as the POS: a shop that was ACTIVE at breakfast is LOCKED at
 * midnight with no document having changed. `shops/{id}.credit` is a cache for
 * lists; the status shown and enforced here is recomputed from `dueDate`
 * against today, every time.
 */
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';

import {
  DEFAULT_TERM_DAYS,
  toDate,
  type DateLike,
  type PosShop,
  type PosVoucher,
} from '@/lib/pos/schema';

/** Day 12 of 14 — when a shop is warned. Mirrors `APPROACHING_DAY`. */
export const APPROACHING_DAY = 12;

/** Days past due before the hard lock. The POS runs with none. */
export const GRACE_DAYS = 0;

/** The payment reminder fires this many days before a due date. */
export const DUE_REMINDER_DAYS = 3;

export type CreditStatus = 'ACTIVE' | 'WATCH' | 'OVERDUE' | 'LOCKED';

const OPEN_STATUSES = new Set(['ISSUED', 'PARTIAL', 'OVERDUE']);

/** A voucher that puts money on the shop's account. Mirrors `isOpenReceivable`. */
export function isOpenReceivable(voucher: PosVoucher): boolean {
  if (voucher.type === 'CONSIGNMENT') return false;
  if (!OPEN_STATUSES.has(voucher.status)) return false;
  return voucher.balanceDue > 0;
}

/** Calendar days from `from` to `to`, counted the way credit terms are. */
export function daysBetween(from: DateLike, to: DateLike): number | null {
  const a = toDate(from);
  const b = toDate(to);
  if (!a || !b) return null;
  return differenceInCalendarDays(startOfDay(b), startOfDay(a));
}

/** `issueDate + termDays`, at the start of that day — as the POS stores it. */
export function computeDueDate(issueDate: Date, termDays = DEFAULT_TERM_DAYS): Date {
  return addDays(startOfDay(issueDate), termDays);
}

export type VoucherAging = {
  dueDate: Date | null;
  daysOutstanding: number;
  /** Negative once past due; `null` when the voucher has no usable dates. */
  daysUntilDue: number | null;
  daysOverdue: number;
  isOverdue: boolean;
  isApproaching: boolean;
  balanceDue: number;
};

/** Mirrors `ageVoucher`. */
export function ageVoucher(voucher: PosVoucher, today: Date): VoucherAging {
  const issueDate = toDate(voucher.issueDate);
  const dueDate =
    toDate(voucher.dueDate) ?? (issueDate ? computeDueDate(issueDate, voucher.termDays) : null);

  const daysOutstanding = daysBetween(issueDate, today) ?? 0;
  const daysUntilDue = daysBetween(today, dueDate);
  const daysOverdue = daysUntilDue == null ? 0 : Math.max(0, -daysUntilDue);

  return {
    dueDate,
    daysOutstanding,
    daysUntilDue,
    daysOverdue,
    isOverdue: daysOverdue > 0,
    isApproaching: daysOverdue === 0 && daysOutstanding >= APPROACHING_DAY,
    balanceDue: voucher.balanceDue,
  };
}

export type ShopCreditState = {
  status: CreditStatus;
  /** Sum of open balances — the figure the dashboard calls "used". */
  outstanding: number;
  overdueAmount: number;
  maxDaysOverdue: number;
  openCount: number;
  /** `0` means the shop has no limit, exactly as in the POS. */
  creditLimit: number;
  /** `null` when there is no limit to measure against. */
  availableCredit: number | null;
  overLimit: boolean;
  manualHold: boolean;
  overrideActive: boolean;
  /** The earliest due date among open vouchers, and how far off it is. */
  nextDue: { voucherNo: string; dueDate: Date; daysUntilDue: number; balanceDue: number } | null;
};

/** Mirrors `evaluateShopCredit`, trimmed to what a customer screen shows. */
export function evaluateShopCredit(
  shop: PosShop,
  vouchers: readonly PosVoucher[],
  today: Date,
): ShopCreditState {
  const aged = vouchers
    .filter(isOpenReceivable)
    .map((voucher) => ({ voucher, aging: ageVoucher(voucher, today) }))
    .sort(
      (a, b) => (a.aging.dueDate?.getTime() ?? Infinity) - (b.aging.dueDate?.getTime() ?? Infinity),
    );

  let outstanding = 0;
  let overdueAmount = 0;
  let maxDaysOverdue = 0;

  for (const { aging } of aged) {
    outstanding += aging.balanceDue;
    if (aging.isOverdue) {
      overdueAmount += aging.balanceDue;
      maxDaysOverdue = Math.max(maxDaysOverdue, aging.daysOverdue);
    }
  }

  const oldest = aged[0] ?? null;

  let status: CreditStatus = 'ACTIVE';
  if (maxDaysOverdue > GRACE_DAYS) status = 'LOCKED';
  else if (maxDaysOverdue > 0) status = 'OVERDUE';
  else if (oldest?.aging.isApproaching) status = 'WATCH';

  if (shop.credit.manualHold) status = 'LOCKED';

  const overrideExpires = toDate(shop.credit.override?.expiresAt ?? null);
  const overrideActive = Boolean(overrideExpires && overrideExpires > today);

  const creditLimit = shop.creditLimit;

  return {
    status,
    outstanding,
    overdueAmount,
    maxDaysOverdue,
    openCount: aged.length,
    creditLimit,
    availableCredit: creditLimit > 0 ? Math.max(0, creditLimit - outstanding) : null,
    overLimit: creditLimit > 0 && outstanding > creditLimit,
    manualHold: shop.credit.manualHold,
    overrideActive,
    nextDue:
      oldest && oldest.aging.dueDate && oldest.aging.daysUntilDue != null
        ? {
            voucherNo: oldest.voucher.voucherNo,
            dueDate: oldest.aging.dueDate,
            daysUntilDue: oldest.aging.daysUntilDue,
            balanceDue: oldest.aging.balanceDue,
          }
        : null,
  };
}

export type PurchaseDenial = 'MANUAL_HOLD' | 'OVERDUE_LOCK' | 'OVER_LIMIT';

export type PurchaseGate =
  | { allowed: true }
  | { allowed: false; code: PurchaseDenial; projected?: number; limit?: number; days?: number };

/**
 * Whether a credit order of `amount` may go through. Mirrors `canIssueVoucher`
 * for a SALE, minus the master-password path: releasing a locked shop is an
 * owner's decision made in the POS, never something a customer self-serves.
 * A live override granted there is honoured here.
 */
export function canPurchase(state: ShopCreditState, amount: number): PurchaseGate {
  if (state.overrideActive) return { allowed: true };

  if (state.status === 'LOCKED') {
    return state.manualHold
      ? { allowed: false, code: 'MANUAL_HOLD' }
      : { allowed: false, code: 'OVERDUE_LOCK', days: state.maxDaysOverdue };
  }

  const projected = state.outstanding + Math.max(0, amount);
  if (state.creditLimit > 0 && projected > state.creditLimit) {
    return { allowed: false, code: 'OVER_LIMIT', projected, limit: state.creditLimit };
  }

  return { allowed: true };
}
