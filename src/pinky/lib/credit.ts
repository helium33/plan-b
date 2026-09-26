/**
 * The B2B credit and accounts-receivable engine.
 *
 * Pure functions over plain data — no React, no Firestore — because every figure
 * on the AR dashboard is a number someone will be chased for, and a balance that
 * depends on hidden component state is a balance nobody can audit.
 *
 * ── The one rule everything else follows from ──────────────────────────────
 * An invoice is due a fixed number of days after it is issued (14, by default).
 * Age is measured from that *issue* date, not from the due date, because that is
 * how the trade speaks: "this one is thirty days old" means thirty days since
 * the goods went out, not thirty days past due. Getting that wrong shifts every
 * bucket by a fortnight and makes the aging report quietly useless.
 */

/** Days from invoice date to due date. The shop's standard term. */
export const CREDIT_TERM_DAYS = 14;

/**
 * How many days past *due* an account may run before it is frozen.
 *
 * Distinct from `CREDIT_TERM_DAYS` even though both happen to be 14: one is a
 * commercial term, the other a collections policy. Tying them to a single
 * constant would mean changing the payment terms silently changed when accounts
 * get blocked.
 */
export const AUTO_HOLD_OVERDUE_DAYS = 14;

/** Reminders fire this many days before the due date. */
export const PRE_DUE_ALERT_DAYS = 3;

/** 1 lakh = 100,000 Ks. Credit limits are always quoted in lakhs. */
export const KYAT_PER_LAKH = 100_000;

/* ── Shapes ────────────────────────────────────────────────────────────────── */

/** One credit sale awaiting payment. */
export type Invoice = {
  id: string;
  /** `YYYY-MM-DD`, the day the goods went out. */
  issuedOn: string;
  /** Original invoice value in kyat. */
  amountKyat: number;
  /**
   * What has been paid against it so far.
   *
   * Partial payments are the norm in this trade — a buyer clears half on the due
   * date and the rest next cycle — so this is a running total rather than a
   * boolean `paid` flag. The remainder stays outstanding and keeps ageing from
   * its *original* issue date, which is what stops a token payment from
   * resetting the clock on an old debt.
   */
  paidKyat: number;
};

export type CreditCustomer = {
  id: string;
  name: string;
  phone: string;
  /** Ceiling on total outstanding, in kyat. */
  creditLimitKyat: number;
  invoices: Invoice[];
  /**
   * Set by a human to freeze an account regardless of the numbers.
   *
   * Kept separate from the computed auto-hold so that a manual block survives
   * the customer paying down their balance — releasing it should be a decision,
   * not a side effect of arithmetic.
   */
  manualHold: boolean;
};

/** The three buckets the aging report is built from. */
export const AGING_BUCKETS = ['current', 'days15to30', 'over30'] as const;
export type AgingBucket = (typeof AGING_BUCKETS)[number];

export type AccountStatus =
  /** Inside terms and inside the limit. */
  | 'active'
  /** Due within `PRE_DUE_ALERT_DAYS` — the reminder trigger. */
  | 'due-soon'
  /** Past due, but not yet far enough past to freeze. */
  | 'overdue'
  /** Frozen: too far past due, over the limit, or blocked by hand. */
  | 'hold';

/* ── Date helpers ──────────────────────────────────────────────────────────── */

const DAY_MS = 86_400_000;

/**
 * Parses `YYYY-MM-DD` as UTC noon.
 *
 * Noon rather than midnight so no timezone offset can push the date onto the
 * previous or next day — a one-day slip here moves invoices between aging
 * buckets, which is the difference between "call them" and "freeze them".
 */
function parseDay(iso: string): number {
  return new Date(iso + 'T12:00:00Z').getTime();
}

/** Whole days between two `YYYY-MM-DD` dates. Negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseDay(to) - parseDay(from)) / DAY_MS);
}

/** `YYYY-MM-DD` for a JS date, in UTC. */
export function toIsoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The due date for an invoice, `CREDIT_TERM_DAYS` after it was issued. */
export function dueDateOf(invoice: Invoice, termDays = CREDIT_TERM_DAYS): string {
  return toIsoDay(new Date(parseDay(invoice.issuedOn) + termDays * DAY_MS));
}

/* ── Invoice-level derivations ─────────────────────────────────────────────── */

/** What is still owed. Never negative — an overpayment is not a debt. */
export function outstandingOf(invoice: Invoice): number {
  return Math.max(0, invoice.amountKyat - invoice.paidKyat);
}

export function isSettled(invoice: Invoice): boolean {
  return outstandingOf(invoice) === 0;
}

/** Age in days since the invoice was issued. */
export function ageOf(invoice: Invoice, today: string): number {
  return daysBetween(invoice.issuedOn, today);
}

/** Days past the due date. Negative means still within terms. */
export function daysOverdue(invoice: Invoice, today: string, termDays = CREDIT_TERM_DAYS): number {
  return daysBetween(dueDateOf(invoice, termDays), today);
}

/**
 * Which aging bucket an invoice falls in.
 *
 * Measured from the issue date, per the note at the top of this file. The
 * boundaries match the brief: under 14 days, 15–30, and over 30.
 */
export function bucketOf(invoice: Invoice, today: string): AgingBucket {
  const age = ageOf(invoice, today);
  if (age <= 14) return 'current';
  if (age <= 30) return 'days15to30';
  return 'over30';
}

/* ── Account-level derivations ─────────────────────────────────────────────── */

export type AgingTotals = Record<AgingBucket, number>;

export type HoldReason = 'over-limit' | 'overdue' | 'manual';

export type AccountSummary = {
  customer: CreditCustomer;
  /** Total still owed across every unsettled invoice. */
  balanceKyat: number;
  /** Limit less balance. Negative when the account has breached its limit. */
  availableKyat: number;
  overLimit: boolean;
  aging: AgingTotals;
  /** The earliest due date among unsettled invoices, or `null` when clear. */
  nextDueOn: string | null;
  /** Days until `nextDueOn`. Negative once past due. `null` when clear. */
  daysUntilDue: number | null;
  /** Worst overdue figure on the account, in days. Zero when nothing is late. */
  worstOverdueDays: number;
  status: AccountStatus;
  /** Why the account is frozen, so the dashboard can explain rather than assert. */
  holdReasons: HoldReason[];
  /** True when a pre-due reminder should go out today. */
  needsReminder: boolean;
};

const emptyAging = (): AgingTotals => ({ current: 0, days15to30: 0, over30: 0 });

/**
 * Everything the dashboard needs about one account, derived in one pass.
 *
 * Returned as a single object rather than a dozen exported helpers because the
 * figures are interdependent — status depends on the balance, which depends on
 * the invoices — and computing them separately invites two call sites to
 * disagree about the same customer.
 *
 * @param today `YYYY-MM-DD`. Passed in rather than read from the clock so the
 *              boundary cases (exactly due, exactly 14 days over) can be checked
 *              without waiting for them.
 */
export function summarise(customer: CreditCustomer, today: string): AccountSummary {
  const open = customer.invoices.filter((invoice) => !isSettled(invoice));

  const aging = emptyAging();
  let balanceKyat = 0;
  let nextDueOn: string | null = null;
  let worstOverdueDays = 0;

  for (const invoice of open) {
    const outstanding = outstandingOf(invoice);
    balanceKyat += outstanding;
    aging[bucketOf(invoice, today)] += outstanding;

    const due = dueDateOf(invoice);
    if (nextDueOn === null || due < nextDueOn) nextDueOn = due;

    worstOverdueDays = Math.max(worstOverdueDays, daysOverdue(invoice, today));
  }

  const availableKyat = customer.creditLimitKyat - balanceKyat;
  const overLimit = balanceKyat > customer.creditLimitKyat;

  const holdReasons: HoldReason[] = [];
  if (customer.manualHold) holdReasons.push('manual');
  if (overLimit) holdReasons.push('over-limit');
  if (worstOverdueDays >= AUTO_HOLD_OVERDUE_DAYS) holdReasons.push('overdue');

  const daysUntilDue = nextDueOn === null ? null : daysBetween(today, nextDueOn);

  const status: AccountStatus = (() => {
    if (holdReasons.length > 0) return 'hold';
    if (worstOverdueDays > 0) return 'overdue';
    if (daysUntilDue !== null && daysUntilDue <= PRE_DUE_ALERT_DAYS) return 'due-soon';
    return 'active';
  })();

  return {
    customer,
    balanceKyat,
    availableKyat,
    overLimit,
    aging,
    nextDueOn,
    daysUntilDue,
    worstOverdueDays,
    status,
    holdReasons,
    // Only for accounts still inside terms: an invoice already past due needs a
    // collection call, not a courtesy note that it is "coming up".
    needsReminder:
      daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= PRE_DUE_ALERT_DAYS,
  };
}

/* ── Purchase gating ───────────────────────────────────────────────────────── */

export type PurchaseDecision =
  | { allowed: true; remainingKyat: number }
  | { allowed: false; reason: 'account-on-hold' | 'exceeds-limit'; shortfallKyat: number };

/**
 * Whether a customer may put another sale on credit.
 *
 * This is the auto-block the brief asks for, and it deliberately returns a
 * *reason* rather than a boolean: "you cannot order" with no explanation is the
 * fastest way to generate a phone call, and the two reasons need different
 * answers — one is paid down, the other is released by the office.
 */
export function canPurchase(summary: AccountSummary, amountKyat: number): PurchaseDecision {
  if (summary.status === 'hold') {
    return { allowed: false, reason: 'account-on-hold', shortfallKyat: 0 };
  }

  const remaining = summary.availableKyat - amountKyat;
  if (remaining < 0) {
    return { allowed: false, reason: 'exceeds-limit', shortfallKyat: Math.abs(remaining) };
  }

  return { allowed: true, remainingKyat: remaining };
}

/* ── Payments ──────────────────────────────────────────────────────────────── */

/**
 * Applies a payment across a customer's open invoices, oldest first.
 *
 * Oldest-first is the standard allocation and the only one that makes the aging
 * report behave: paying the newest invoice first would leave the oldest debt
 * ageing forever while the balance appeared to move. Any remainder beyond the
 * total owed is returned rather than silently absorbed, because an unexplained
 * surplus sitting on an account is a reconciliation problem later.
 */
export function applyPayment(
  customer: CreditCustomer,
  amountKyat: number,
): { customer: CreditCustomer; appliedKyat: number; unappliedKyat: number } {
  let remaining = Math.max(0, Math.round(amountKyat));
  let applied = 0;

  const ordered = [...customer.invoices].sort((a, b) => a.issuedOn.localeCompare(b.issuedOn));

  const invoices = ordered.map((invoice) => {
    const outstanding = outstandingOf(invoice);
    if (remaining === 0 || outstanding === 0) return invoice;

    const take = Math.min(remaining, outstanding);
    remaining -= take;
    applied += take;

    return { ...invoice, paidKyat: invoice.paidKyat + take };
  });

  return {
    customer: { ...customer, invoices },
    appliedKyat: applied,
    unappliedKyat: remaining,
  };
}

/* ── Portfolio ─────────────────────────────────────────────────────────────── */

export type LedgerTotals = {
  accounts: AccountSummary[];
  /** Total receivable across every account. */
  totalArKyat: number;
  aging: AgingTotals;
  onHold: number;
  needingReminder: number;
  overdue: number;
};

/** Summarises the whole book, sorted worst-first so attention lands correctly. */
export function summariseLedger(customers: CreditCustomer[], today: string): LedgerTotals {
  const accounts = customers.map((customer) => summarise(customer, today));

  const aging = emptyAging();
  let totalArKyat = 0;

  for (const account of accounts) {
    totalArKyat += account.balanceKyat;
    for (const bucket of AGING_BUCKETS) aging[bucket] += account.aging[bucket];
  }

  // Most overdue first, then largest balance. A dashboard sorted by name buries
  // the account that actually needs chasing.
  accounts.sort(
    (a, b) => b.worstOverdueDays - a.worstOverdueDays || b.balanceKyat - a.balanceKyat,
  );

  return {
    accounts,
    totalArKyat,
    aging,
    onHold: accounts.filter((a) => a.status === 'hold').length,
    needingReminder: accounts.filter((a) => a.needsReminder).length,
    overdue: accounts.filter((a) => a.worstOverdueDays > 0).length,
  };
}

/** `750000` → `7.5`, for the "Ks 7.5 L" shorthand the trade uses. */
export function toLakhs(amountKyat: number): number {
  return Math.round((amountKyat / KYAT_PER_LAKH) * 10) / 10;
}

/** Grouped thousands. Kyat has no minor unit, so never any decimals. */
export function formatKs(amountKyat: number): string {
  return 'Ks ' + new Intl.NumberFormat('en-US').format(Math.round(amountKyat));
}
