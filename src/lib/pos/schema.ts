/**
 * The POS's side of the shared Firestore — the collections this app reads and
 * writes so that an order placed here is, to the POS, just another voucher.
 *
 * ── Whose schema this is ───────────────────────────────────────────────────
 * Not ours. Every shape below belongs to the POS (helium33/visionary) and is
 * documented in its `docs/FIRESTORE_SCHEMA.md`; this file only mirrors the
 * fields this app touches. When the two disagree, the POS is right and this
 * file is the bug — the POS's reports, credit screens and stock matrix read
 * these documents, and a field spelled differently here is a field they never
 * see.
 *
 * ── Why only a subset ──────────────────────────────────────────────────────
 * The POS carries costs, landed-cost history and commission data a customer
 * must never be shown. The types stop at what a shop or a sales rep needs, so
 * a component cannot reach for `unitCost` by accident: it is not on the type.
 */

/** Collection names, exactly as the POS spells them (`src/lib/firebase.js#COL`). */
export const POS = {
  users: 'users',
  shops: 'shops',
  ledger: 'ledger',
  vouchers: 'vouchers',
  creditNotes: 'creditNotes',
  products: 'products',
  variants: 'variants',
  inventoryMoves: 'inventoryMoves',
  auditLogs: 'auditLogs',
  /**
   * Returned-as-defective pieces awaiting inspection. New with this app — the
   * POS models damage as the `LOC-DAMAGED` stock bucket, which `processReturn`
   * still feeds; this collection adds the per-return record (who, which
   * voucher, why) that a bucket count cannot carry.
   */
  damagedStock: 'damaged_stock',
} as const;

/** Where sellable stock sits. A web order always ships from the warehouse. */
export const MAIN_LOCATION = 'LOC-MAIN';

/** The POS's bucket for defective stock (`stockLocations/LOC-DAMAGED`). */
export const DAMAGED_LOCATION = 'LOC-DAMAGED';

/** The POS's default term, overridable per shop with `creditTermDays`. */
export const DEFAULT_TERM_DAYS = 14;

/** Marks every document this app writes, so POS staff can tell where it came from. */
export const WEB_CHANNEL = 'WEB';

/**
 * The custom-claim role on the Firebase ID token.
 *
 * The four staff roles are the POS's own; `SHOP` is new and is how a customer
 * account is recognised. Set by `npm run set-role` in the POS repo — never by a
 * client, which is the whole point of reading it from the token.
 */
export type PosRole = 'ADMIN' | 'SALES' | 'ACCOUNTANT' | 'WAREHOUSE' | 'SHOP';

export const POS_ROLES: readonly PosRole[] = ['ADMIN', 'SALES', 'ACCOUNTANT', 'WAREHOUSE', 'SHOP'];

export function asPosRole(value: unknown): PosRole | null {
  return typeof value === 'string' && (POS_ROLES as readonly string[]).includes(value)
    ? (value as PosRole)
    : null;
}

/* ── Dates ─────────────────────────────────────────────────────────────────── */

/**
 * A Firestore `Timestamp`, a pending `serverTimestamp()`, a `Date`, an ISO
 * string or epoch millis — all of which a POS document can legitimately hold,
 * depending on whether it was written online, offline, or by an import.
 */
export type DateLike = { toDate(): Date } | Date | string | number | null | undefined;

/**
 * Normalises any of the above to a `Date`, or `null` when there is no real date
 * yet. The POS's `lib/dates.js#toDate` does the same job for the same reason:
 * a document read back from the cache before its server timestamp resolves is
 * the most common source of "Invalid Date" in this data.
 */
export function toDate(value: DateLike): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  return null;
}

/* ── Documents ─────────────────────────────────────────────────────────────── */

export type PosShop = {
  id: string;
  code: string;
  name: string;
  nameMM: string;
  township: string;
  /** Kyat. `0` means no limit, as in the POS. */
  creditLimit: number;
  creditTermDays: number;
  salesRepId: string | null;
  active: boolean;
  credit: {
    /** The cached roll-up. A hint for display — never a gating decision. */
    outstanding: number;
    onAccountCredit: number;
    manualHold: boolean;
    override: { expiresAt: DateLike } | null;
  };
};

export type PosVoucherStatus = 'DRAFT' | 'ISSUED' | 'PARTIAL' | 'PAID' | 'VOID' | 'CONSIGNED' | 'OVERDUE';

export type PosVoucherItem = {
  productId: string;
  modelNo: string;
  colorCode: string;
  colorName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type PosVoucher = {
  id: string;
  voucherNo: string;
  shopId: string;
  shopName: string;
  salesRepId: string | null;
  type: 'SALE' | 'CONSIGNMENT';
  status: PosVoucherStatus;
  channel: string | null;
  issueDate: DateLike;
  dueDate: DateLike;
  termDays: number;
  settledAt: DateLike;
  updatedAt: DateLike;
  items: PosVoucherItem[];
  subtotal: number;
  discount: number;
  discountReason: string | null;
  grandTotal: number;
  paidAmount: number;
  paymentAtIssue: number;
  balanceDue: number;
  /** `productId|colorCode` → pieces already returned against this voucher. */
  returnedQty: Record<string, number>;
};

/* ── Normalisation ─────────────────────────────────────────────────────────── */

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/**
 * Reads a `shops/{id}` document defensively. The POS writes these from three
 * places (the shops screen, the CSV import, and the credit batch), and older
 * documents predate some fields — a shop with no `credit` map at all is real.
 */
export function normalizeShop(id: string, data: Record<string, unknown>): PosShop {
  const credit = asRecord(data.credit);
  const override = credit.override ? asRecord(credit.override) : null;

  return {
    id,
    code: asString(data.code),
    name: asString(data.name),
    nameMM: asString(data.nameMM),
    township: asString(data.township),
    creditLimit: Math.max(0, asNumber(data.creditLimit)),
    creditTermDays: asNumber(data.creditTermDays, DEFAULT_TERM_DAYS) || DEFAULT_TERM_DAYS,
    salesRepId: typeof data.salesRepId === 'string' ? data.salesRepId : null,
    active: data.active !== false,
    credit: {
      outstanding: asNumber(credit.outstanding),
      onAccountCredit: asNumber(credit.onAccountCredit),
      manualHold: credit.manualHold === true,
      override: override ? { expiresAt: override.expiresAt as DateLike } : null,
    },
  };
}

export function normalizeVoucher(id: string, data: Record<string, unknown>): PosVoucher {
  const items = Array.isArray(data.items)
    ? (data.items as unknown[]).map((raw) => {
        const item = asRecord(raw);
        return {
          productId: asString(item.productId),
          modelNo: asString(item.modelNo),
          colorCode: asString(item.colorCode),
          colorName: asString(item.colorName),
          qty: asNumber(item.qty),
          unitPrice: asNumber(item.unitPrice),
          lineTotal: asNumber(item.lineTotal),
        };
      })
    : [];

  const returned = asRecord(data.returnedQty);

  return {
    id,
    voucherNo: asString(data.voucherNo, id),
    shopId: asString(data.shopId),
    shopName: asString(data.shopName),
    salesRepId: typeof data.salesRepId === 'string' ? data.salesRepId : null,
    type: data.type === 'CONSIGNMENT' ? 'CONSIGNMENT' : 'SALE',
    status: asString(data.status, 'ISSUED') as PosVoucherStatus,
    channel: typeof data.channel === 'string' ? data.channel : null,
    issueDate: data.issueDate as DateLike,
    dueDate: data.dueDate as DateLike,
    termDays: asNumber(data.termDays, DEFAULT_TERM_DAYS) || DEFAULT_TERM_DAYS,
    settledAt: data.settledAt as DateLike,
    updatedAt: data.updatedAt as DateLike,
    items,
    subtotal: asNumber(data.subtotal),
    discount: asNumber(data.discount),
    discountReason: typeof data.discountReason === 'string' ? data.discountReason : null,
    grandTotal: asNumber(data.grandTotal),
    paidAmount: asNumber(data.paidAmount),
    paymentAtIssue: asNumber(data.paymentAtIssue),
    balanceDue: asNumber(data.balanceDue),
    returnedQty: Object.fromEntries(
      Object.entries(returned).map(([key, value]) => [key, asNumber(value)]),
    ),
  };
}

/** The key `returnedQty` is indexed by. One place, so reader and writer agree. */
export function lineKey(productId: string, colorCode: string): string {
  return `${productId}|${colorCode}`;
}

/**
 * A human-readable, device-generated document number — `VN-WB260926-K4T9`.
 *
 * Same shape as the POS's `buildVoucherNo`, for the same reason: a shared
 * counter needs a transaction, and the POS's field reps cannot run one offline.
 * `WB` stands in for a rep code, so a web order is recognisable on sight in the
 * POS voucher list.
 */
export function buildDocNo(prefix: 'VN' | 'CN', issueDate: Date, code = 'WB'): string {
  const stamp = issueDate.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');
  return `${prefix}-${code}${stamp}-${rand}`;
}
