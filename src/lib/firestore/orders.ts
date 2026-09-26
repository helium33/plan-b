/**
 * Past orders, stored under the signed-in buyer.
 *
 * ── What is stored, and why it is a snapshot ───────────────────────────────
 * Unlike the *draft*, which holds only quantities so it always re-prices against
 * the live catalogue, a submitted order stores the full priced snapshot: the
 * line descriptions, the unit prices and the total, exactly as they stood when
 * it was sent.
 *
 * That inversion is deliberate. A draft is a question ("what would this cost?")
 * and must stay current. A sent order is a record of what the buyer and the shop
 * agreed, and re-deriving it later against changed prices would silently rewrite
 * history — a buyer opening last month's invoice would see today's total.
 *
 * `quantities` is kept alongside the snapshot purely so Re-Order can refill the
 * draft, which then re-prices at today's rates. Those are different jobs and the
 * document carries both on purpose.
 */
import {
  collection,
  doc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { USERS_COLLECTION } from '@/lib/firestore/users';
import type { Bank, PaymentMethod } from '@/lib/payment';
import type { QuantityMap } from '@/lib/wholesale';

export const ORDERS_SUBCOLLECTION = 'orders';

/** Most recent orders to read. A buyer scanning history never needs more. */
const MAX_HISTORY = 50;

/** One priced line, flattened for storage. */
export type OrderHistoryLine = {
  frameId: string;
  frameCode: string;
  name: string;
  unitPriceKyat: number;
  /** `[{ cNumber, qty }]`, in catalogue order. */
  colours: { cNumber: string; qty: number }[];
  totalPieces: number;
  subtotalKyat: number;
};

export type OrderHistoryDoc = {
  /** The `PBW-XXXX` reference shown on the voucher. Also the document id. */
  id: string;
  createdAtMs: number;

  lines: OrderHistoryLine[];
  totalPieces: number;
  /** What the order came to. There are no discounts to break it down into. */
  subtotalKyat: number;

  shopName: string;
  contactName: string;
  phone: string;
  shipTo: string;
  paymentMethod: PaymentMethod;
  bank: Bank | null;
  note: string;

  /** For Re-Order: frame id → C-number → pieces. */
  quantities: Record<string, QuantityMap>;
};

/**
 * Saves an order under `users/{uid}/orders/{reference}`.
 *
 * The reference is the document id, so sending the same unchanged order twice
 * updates one record instead of creating a duplicate the shop then has to work
 * out is the same order. `orderReference` is content-derived, which is what makes
 * that idempotence real rather than accidental.
 *
 * Failures are surfaced to the caller rather than swallowed: unlike the sign-in
 * record, the buyer is actively looking at this and a silently missing invoice is
 * worse than an error they can retry.
 */
export async function saveOrder(uid: string, order: OrderHistoryDoc): Promise<void> {
  const { id, ...rest } = order;

  await setDoc(doc(db, USERS_COLLECTION, uid, ORDERS_SUBCOLLECTION, id), {
    ...rest,
    // Client clock drives the sort key so the list orders correctly before the
    // server round-trip lands; `submittedAt` is the authoritative one.
    createdAtMs: order.createdAtMs,
    submittedAt: serverTimestamp(),
  });
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/** Reads a stored order back, defending every field the UI renders. */
function normalizeOrder(id: string, data: Record<string, unknown>): OrderHistoryDoc {
  const lines = Array.isArray(data.lines)
    ? (data.lines as Record<string, unknown>[]).map((line) => ({
        frameId: asString(line.frameId),
        frameCode: asString(line.frameCode),
        name: asString(line.name),
        unitPriceKyat: asNumber(line.unitPriceKyat),
        colours: Array.isArray(line.colours)
          ? (line.colours as Record<string, unknown>[]).map((colour) => ({
              cNumber: asString(colour.cNumber),
              qty: asNumber(colour.qty),
            }))
          : [],
        totalPieces: asNumber(line.totalPieces),
        // `netKyat` is what orders written before the discounts were removed
        // called this figure. Those documents are real history and must keep
        // rendering their own totals, so the old name is read as a fallback.
        subtotalKyat: asNumber(line.subtotalKyat) || asNumber(line.netKyat),
      }))
    : [];

  return {
    id,
    createdAtMs: asNumber(data.createdAtMs),
    lines,
    totalPieces: asNumber(data.totalPieces),
    subtotalKyat: asNumber(data.subtotalKyat) || asNumber(data.netKyat),
    shopName: asString(data.shopName),
    contactName: asString(data.contactName),
    phone: asString(data.phone),
    shipTo: asString(data.shipTo),
    paymentMethod: asString(data.paymentMethod, 'kpay') as PaymentMethod,
    bank: (data.bank as Bank | null) ?? null,
    note: asString(data.note),
    quantities: (data.quantities as Record<string, QuantityMap>) ?? {},
  };
}

/** The buyer's own orders, newest first. */
export async function listOrders(uid: string): Promise<OrderHistoryDoc[]> {
  const snap = await getDocs(
    query(
      collection(db, USERS_COLLECTION, uid, ORDERS_SUBCOLLECTION),
      orderBy('createdAtMs', 'desc'),
      fbLimit(MAX_HISTORY),
    ),
  );

  return snap.docs.map((d) => normalizeOrder(d.id, d.data()));
}
