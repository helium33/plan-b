/**
 * Firestore reads and writes for the wholesale credit ledger.
 *
 * Two collections, both admin-only per `firestore.rules`:
 *
 *   creditShops/{id}   — the directory: one document per credit customer,
 *                        holding the single running balance described in
 *                        `lib/credit.ts`.
 *   creditOrders/{id}  — a permanent snapshot of every voucher issued, for the
 *                        history list. Never mutated after creation — a
 *                        voucher already sent to a shop is a record of what
 *                        was agreed, not a draft to edit.
 *
 * Nothing here is buyer-facing. The "buyer view" the credit system implies is
 * simply the voucher text a shop receives over Telegram or as an exported
 * image — there is no page a shop opens to see its own balance, because shops
 * are not Firebase Auth accounts in this app; they are entries in a directory
 * staff maintain.
 */
import {
  type Unsubscribe,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { nextDueDate, toIsoDay, type CreditShop } from '@/lib/credit';

export const CREDIT_SHOPS_COLLECTION = 'creditShops';
export const CREDIT_ORDERS_COLLECTION = 'creditOrders';

const MAX_LIST = 500;

/* ── Normalisation ─────────────────────────────────────────────────────────── */

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeShop(id: string, data: Record<string, unknown>): CreditShop {
  return {
    id,
    name: asString(data.name),
    phone: asString(data.phone),
    creditLimitKyat: asNumber(data.creditLimitKyat),
    previousBalanceKyat: asNumber(data.previousBalanceKyat),
    dueDateIso: typeof data.dueDateIso === 'string' ? data.dueDateIso : null,
    manualHold: data.manualHold === true,
    createdAtMs: asNumber(data.createdAtMs),
  };
}

/* ── Shops ─────────────────────────────────────────────────────────────────── */

/** Live directory, newest first. Small collection — a full subscribe is fine. */
export function subscribeToShops(
  onChange: (shops: CreditShop[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, CREDIT_SHOPS_COLLECTION), orderBy('createdAtMs', 'desc'), fbLimit(MAX_LIST)),
    (snap) => onChange(snap.docs.map((d) => normalizeShop(d.id, d.data()))),
    (error) => onError?.(error),
  );
}

export type NewShopInput = {
  name: string;
  phone: string;
  creditLimitKyat: number;
};

/** Registers a new credit customer, starting clear — no balance, no cycle. */
export async function createShop(input: NewShopInput): Promise<string> {
  const ref = doc(collection(db, CREDIT_SHOPS_COLLECTION));

  await setDoc(ref, {
    name: input.name.trim(),
    phone: input.phone.trim(),
    creditLimitKyat: Math.max(0, Math.round(input.creditLimitKyat)),
    previousBalanceKyat: 0,
    dueDateIso: null,
    manualHold: false,
    createdAtMs: Date.now(),
  });

  return ref.id;
}

/** Edits the directory entry itself — name, phone, limit. Never the balance. */
export async function updateShopDetails(
  id: string,
  patch: Partial<NewShopInput>,
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (patch.name !== undefined) data.name = patch.name.trim();
  if (patch.phone !== undefined) data.phone = patch.phone.trim();
  if (patch.creditLimitKyat !== undefined) {
    data.creditLimitKyat = Math.max(0, Math.round(patch.creditLimitKyat));
  }

  await setDoc(doc(db, CREDIT_SHOPS_COLLECTION, id), data, { merge: true });
}

export async function setManualHold(id: string, manualHold: boolean): Promise<void> {
  await setDoc(doc(db, CREDIT_SHOPS_COLLECTION, id), { manualHold }, { merge: true });
}

/**
 * Grants a fresh 14-day cycle from today, without touching the balance.
 *
 * This is how an *auto*-hold — a cycle that expired with money still owed — is
 * lifted: staff have collected on the phone, or extended goodwill, and the
 * shop should be able to order again without the balance itself changing. A
 * `manualHold`, being a separate flag, is unaffected and still needs its own
 * release.
 */
export async function extendCycle(id: string): Promise<void> {
  await setDoc(
    doc(db, CREDIT_SHOPS_COLLECTION, id),
    { dueDateIso: nextDueDate(toIsoDay(new Date())) },
    { merge: true },
  );
}

/* ── Vouchers ──────────────────────────────────────────────────────────────── */

export type CreditOrderLine = {
  frameId: string;
  frameCode: string;
  name: string;
  unitPriceKyat: number;
  colours: { cNumber: string; qty: number }[];
  totalPieces: number;
};

export type CreditOrderDoc = {
  id: string;
  createdAtMs: number;
  shopId: string;
  shopName: string;
  lines: CreditOrderLine[];
  currentItemsKyat: number;
  previousBalanceKyat: number;
  totalDueKyat: number;
  paymentKyat: number;
  paymentMethod: string;
  remainingKyat: number;
  dueDateIso: string;
};

/**
 * Records one voucher: writes the permanent order snapshot and rolls the
 * shop's balance forward, atomically.
 *
 * The transaction is not decoration. Two separate writes — save the order,
 * then update the balance — leave a real window where a dropped connection
 * after the first write banks a sale that never touched the ledger, silently
 * under-billing the shop on every voucher after it. A transaction makes that
 * window impossible: either both documents change, or neither does, and the
 * caller sees a clean failure to retry instead of a ledger quietly drifting
 * out of truth with what was actually sold.
 */
export async function recordCreditVoucher(input: {
  shop: CreditShop;
  lines: CreditOrderLine[];
  currentItemsKyat: number;
  paymentKyat: number;
  paymentMethod: string;
  remainingKyat: number;
}): Promise<{ orderId: string; dueDateIso: string }> {
  const orderRef = doc(collection(db, CREDIT_ORDERS_COLLECTION));
  const shopRef = doc(db, CREDIT_SHOPS_COLLECTION, input.shop.id);
  const todayIso = toIsoDay(new Date());
  const dueDateIso = nextDueDate(todayIso);

  await runTransaction(db, async (transaction) => {
    transaction.set(orderRef, {
      createdAtMs: Date.now(),
      submittedAt: serverTimestamp(),
      shopId: input.shop.id,
      shopName: input.shop.name,
      lines: input.lines,
      currentItemsKyat: input.currentItemsKyat,
      previousBalanceKyat: input.shop.previousBalanceKyat,
      totalDueKyat: input.currentItemsKyat + input.shop.previousBalanceKyat,
      paymentKyat: input.paymentKyat,
      paymentMethod: input.paymentMethod,
      remainingKyat: input.remainingKyat,
      dueDateIso,
    });

    transaction.set(
      shopRef,
      { previousBalanceKyat: input.remainingKyat, dueDateIso },
      { merge: true },
    );
  });

  return { orderId: orderRef.id, dueDateIso };
}

function normalizeOrder(id: string, data: Record<string, unknown>): CreditOrderDoc {
  const lines = Array.isArray(data.lines)
    ? (data.lines as Record<string, unknown>[]).map((line) => ({
        frameId: asString(line.frameId),
        frameCode: asString(line.frameCode),
        name: asString(line.name),
        unitPriceKyat: asNumber(line.unitPriceKyat),
        colours: Array.isArray(line.colours)
          ? (line.colours as Record<string, unknown>[]).map((c) => ({
              cNumber: asString(c.cNumber),
              qty: asNumber(c.qty),
            }))
          : [],
        totalPieces: asNumber(line.totalPieces),
      }))
    : [];

  return {
    id,
    createdAtMs: asNumber(data.createdAtMs),
    shopId: asString(data.shopId),
    shopName: asString(data.shopName),
    lines,
    currentItemsKyat: asNumber(data.currentItemsKyat),
    previousBalanceKyat: asNumber(data.previousBalanceKyat),
    totalDueKyat: asNumber(data.totalDueKyat),
    paymentKyat: asNumber(data.paymentKyat),
    paymentMethod: asString(data.paymentMethod),
    remainingKyat: asNumber(data.remainingKyat),
    dueDateIso: asString(data.dueDateIso),
  };
}

/** Live order history, newest first, for the admin list. */
export function subscribeToCreditOrders(
  onChange: (orders: CreditOrderDoc[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, CREDIT_ORDERS_COLLECTION),
      orderBy('createdAtMs', 'desc'),
      fbLimit(MAX_LIST),
    ),
    (snap) => onChange(snap.docs.map((d) => normalizeOrder(d.id, d.data()))),
    (error) => onError?.(error),
  );
}

/**
 * Deletes a voucher record.
 *
 * Deliberately does **not** touch the shop's balance. Deleting a mistaken or
 * duplicate entry from the history list is a bookkeeping tidy-up, not an undo
 * button — reversing its effect on the ledger is a separate, considered action
 * staff take through a new voucher or a direct balance edit, not an automatic
 * side effect of removing the record that happened to cause it.
 */
export async function deleteCreditOrder(id: string): Promise<void> {
  await deleteDoc(doc(db, CREDIT_ORDERS_COLLECTION, id));
}

/** One-off read, for exporting or checking totals without a live listener. */
export async function listCreditOrdersOnce(): Promise<CreditOrderDoc[]> {
  const snap = await getDocs(
    query(
      collection(db, CREDIT_ORDERS_COLLECTION),
      orderBy('createdAtMs', 'desc'),
      fbLimit(MAX_LIST),
    ),
  );
  return snap.docs.map((d) => normalizeOrder(d.id, d.data()));
}
