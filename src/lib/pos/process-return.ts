/**
 * processReturn — defective goods back from a shop, credited in one batch.
 *
 * ── What one return touches ────────────────────────────────────────────────
 *   creditNotes/{id}                       the credit note, in the POS's shape
 *   vouchers/{id}              × touched   balance reduced; the source voucher
 *                                          also records what came back
 *   products/{p}/variants/{c}  × lines     stock.LOC-DAMAGED increased
 *   inventoryMoves/{id}        × lines     the journal line (type RETURN)
 *   damaged_stock/{id}         × lines     one inspection record per line
 *   shops/{shopId}                         credit.outstanding reduced
 *   shops/{shopId}/ledger/{id}             the CREDIT_NOTE line
 *   auditLogs/{id}
 *
 * One `writeBatch`, for the same reason as a purchase: a credit note that
 * reduced the debt but never moved the goods — or the reverse — is a ledger
 * that cannot be reconciled with the shelf.
 *
 * ── Where the goods go ─────────────────────────────────────────────────────
 * Straight into the POS's `LOC-DAMAGED` bucket, never back to `LOC-MAIN`:
 * a defective frame is not sellable stock, and returning it to the main count
 * is how a broken frame gets sold twice. `damaged_stock` adds what a bucket
 * count cannot say — which shop, which voucher, what was wrong — and carries a
 * status the warehouse moves on (inspected, written off, claimed from the
 * supplier) without touching the credit already given.
 *
 * ── How the credit is applied ──────────────────────────────────────────────
 * The POS's `allocateCreditNote`: to the voucher the goods came from while it
 * is still open, then oldest-due-first across the shop's other open vouchers,
 * and anything left over is held as on-account credit against the next order.
 * The value of a returned piece is its price on that voucher *net* of any
 * voucher-level discount — a shop that got 2% off must not be credited the
 * full price for bringing the same frame back.
 */
import {
  FieldPath,
  collection,
  doc,
  increment,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { ageVoucher, isOpenReceivable } from '@/lib/pos/credit';
import type { PurchaseActor } from '@/lib/pos/handle-purchase';
import {
  DAMAGED_LOCATION,
  POS,
  WEB_CHANNEL,
  buildDocNo,
  lineKey,
  type PosVoucher,
} from '@/lib/pos/schema';
import { getShop, listShopVouchers } from '@/lib/pos/shop-data';
import { can } from '@/lib/rbac';

const MAX_BATCH_WRITES = 500;

/** creditNote, shop, ledger, audit. */
const FIXED_WRITES = 4;

/** Stored on the credit note — the POS's own reason code for this case. */
export const RETURN_REASON = 'RETURN_DEFECTIVE';

export type ReturnItemInput = {
  productId: string;
  colorCode: string;
  qty: number;
};

export type ReturnInput = {
  actor: PurchaseActor;
  shopId: string;
  /** The voucher the goods were sold on. */
  sourceVoucherId: string;
  items: readonly ReturnItemInput[];
  /** What is wrong with them — shown to the warehouse on `damaged_stock`. */
  defectNote?: string;
  now?: Date;
};

export type ReturnFailure =
  | {
      ok: false;
      code: 'NOT_ALLOWED' | 'EMPTY' | 'SHOP_NOT_FOUND' | 'SOURCE_NOT_FOUND' | 'SOURCE_NOT_RETURNABLE' | 'TOO_LARGE';
    }
  | { ok: false; code: 'NOT_ON_VOUCHER'; productId: string; colorCode: string }
  | {
      ok: false;
      code: 'EXCEEDS_SOLD';
      productId: string;
      colorCode: string;
      requested: number;
      returnable: number;
    }
  | { ok: false; code: 'READ_FAILED' | 'WRITE_FAILED'; cause: unknown };

export type ReturnSuccess = {
  ok: true;
  creditNoteId: string;
  creditNoteNo: string;
  amount: number;
  /** Taken off open vouchers. */
  applied: number;
  /** Held as on-account credit for the next order. */
  unapplied: number;
  pieces: number;
};

export type ReturnResult = ReturnSuccess | ReturnFailure;

type Allocation = {
  voucherId: string;
  voucherNo: string;
  amount: number;
  balanceAfter: number;
  daysOverdue: number;
  settles: boolean;
};

/** Oldest due first, voucher number as the tie-break — the POS's FIFO order. */
function fifo(vouchers: readonly PosVoucher[], amount: number, today: Date) {
  let remaining = Math.max(0, amount);
  const allocations: Allocation[] = [];

  const queue = vouchers
    .filter(isOpenReceivable)
    .map((voucher) => ({ voucher, aging: ageVoucher(voucher, today) }))
    .sort((a, b) => {
      const byDue = (a.aging.dueDate?.getTime() ?? 0) - (b.aging.dueDate?.getTime() ?? 0);
      return byDue || a.voucher.voucherNo.localeCompare(b.voucher.voucherNo);
    });

  for (const { voucher, aging } of queue) {
    if (remaining <= 0) break;
    const applied = Math.min(remaining, aging.balanceDue);
    if (applied <= 0) continue;
    remaining -= applied;
    const balanceAfter = Math.round(aging.balanceDue - applied);
    allocations.push({
      voucherId: voucher.id,
      voucherNo: voucher.voucherNo,
      amount: Math.round(applied),
      balanceAfter,
      daysOverdue: aging.daysOverdue,
      settles: balanceAfter === 0,
    });
  }

  return { allocations, unapplied: Math.round(remaining) };
}

/** Mirrors the POS's `allocateCreditNote`: the source voucher first, then FIFO. */
export function allocateCreditNote(
  vouchers: readonly PosVoucher[],
  amount: number,
  sourceVoucherId: string,
  today: Date,
): { allocations: Allocation[]; applied: number; unapplied: number } {
  const source = vouchers.find((v) => v.id === sourceVoucherId && isOpenReceivable(v));

  let allocations: Allocation[];
  let unapplied: number;

  if (!source) {
    ({ allocations, unapplied } = fifo(vouchers, amount, today));
  } else {
    const aging = ageVoucher(source, today);
    const onSource = Math.min(amount, aging.balanceDue);
    const balanceAfter = Math.round(aging.balanceDue - onSource);
    const rest = fifo(
      vouchers.filter((v) => v.id !== source.id),
      amount - onSource,
      today,
    );

    allocations = [
      {
        voucherId: source.id,
        voucherNo: source.voucherNo,
        amount: Math.round(onSource),
        balanceAfter,
        daysOverdue: aging.daysOverdue,
        settles: balanceAfter === 0,
      },
      ...rest.allocations,
    ].filter((a) => a.amount > 0);
    unapplied = rest.unapplied;
  }

  return {
    allocations,
    applied: allocations.reduce((sum, a) => sum + a.amount, 0),
    unapplied,
  };
}

export async function processReturn(input: ReturnInput): Promise<ReturnResult> {
  try {
    return await returnGoods(input);
  } catch (cause) {
    // Refused reads land here — a rep asking about a shop that is not theirs
    // cannot even see its vouchers. Nothing has been written yet.
    return { ok: false, code: 'READ_FAILED', cause };
  }
}

async function returnGoods(input: ReturnInput): Promise<ReturnResult> {
  const { actor, shopId } = input;
  const now = input.now ?? new Date();

  if (!can(actor.role, 'return:process')) return { ok: false, code: 'NOT_ALLOWED' };

  const requested = input.items.filter((item) => item.qty > 0);
  if (requested.length === 0) return { ok: false, code: 'EMPTY' };

  /* ── 1. The shop, the source voucher, and what may come back ────────── */

  const shop = await getShop(shopId);
  if (!shop) return { ok: false, code: 'SHOP_NOT_FOUND' };

  const vouchers = await listShopVouchers(shopId, { uid: actor.uid, role: actor.role });
  const source = vouchers.find((v) => v.id === input.sourceVoucherId);
  if (!source) return { ok: false, code: 'SOURCE_NOT_FOUND' };
  if (source.type !== 'SALE' || source.status === 'VOID' || source.status === 'DRAFT') {
    return { ok: false, code: 'SOURCE_NOT_RETURNABLE' };
  }

  // Whatever the voucher-level discount took off, it takes off the credit too.
  const netRatio = source.subtotal > 0 ? source.grandTotal / source.subtotal : 1;

  // The same colour listed twice becomes one line, so the returnable check
  // sees the whole request rather than each half passing on its own.
  const merged = new Map<string, ReturnItemInput>();
  for (const item of requested) {
    const key = lineKey(item.productId, item.colorCode);
    const existing = merged.get(key);
    merged.set(key, { ...item, qty: Math.trunc(item.qty) + (existing?.qty ?? 0) });
  }

  const lines = [];
  for (const item of merged.values()) {
    const sold = source.items.find(
      (line) => line.productId === item.productId && line.colorCode === item.colorCode,
    );
    if (!sold) {
      return { ok: false, code: 'NOT_ON_VOUCHER', productId: item.productId, colorCode: item.colorCode };
    }

    const key = lineKey(item.productId, item.colorCode);
    const returnable = sold.qty - (source.returnedQty[key] ?? 0);
    if (item.qty > returnable) {
      return {
        ok: false,
        code: 'EXCEEDS_SOLD',
        productId: item.productId,
        colorCode: item.colorCode,
        requested: item.qty,
        returnable: Math.max(0, returnable),
      };
    }

    const netUnitPrice = sold.unitPrice * netRatio;
    lines.push({ ...sold, key, qty: item.qty, credit: Math.round(item.qty * netUnitPrice) });
  }

  const amount = lines.reduce((sum, line) => sum + line.credit, 0);
  const pieces = lines.reduce((sum, line) => sum + line.qty, 0);
  const { allocations, applied, unapplied } = allocateCreditNote(
    vouchers,
    amount,
    source.id,
    now,
  );

  const touched = new Set([source.id, ...allocations.map((a) => a.voucherId)]);
  if (FIXED_WRITES + lines.length * 3 + touched.size > MAX_BATCH_WRITES) {
    return { ok: false, code: 'TOO_LARGE' };
  }

  /* ── 2. The credit note ─────────────────────────────────────────────── */

  const clientAt = now.toISOString();
  const noteRef = doc(collection(db, POS.creditNotes));
  const creditNoteNo = buildDocNo('CN', now);
  const outstandingBefore = vouchers
    .filter(isOpenReceivable)
    .reduce((sum, v) => sum + v.balanceDue, 0);

  const batch = writeBatch(db);

  batch.set(noteRef, {
    creditNoteNo,
    shopId: shop.id,
    shopName: shop.name,
    amount,
    appliedAmount: applied,
    unappliedAmount: unapplied,
    reason: RETURN_REASON,
    defectNote: input.defectNote?.trim() || null,
    sourceVoucherId: source.id,
    sourceVoucherNo: source.voucherNo,
    items: lines.map((line) => ({
      productId: line.productId,
      modelNo: line.modelNo,
      colorCode: line.colorCode,
      qty: line.qty,
      credit: line.credit,
    })),
    allocations: allocations.map(({ settles: _settles, ...rest }) => rest),
    channel: WEB_CHANNEL,
    issuedAt: serverTimestamp(),
    clientAt,
    issuedBy: actor.uid,
    issuedByName: actor.name,
  });

  /* ── 3. Vouchers: less owed, and a record of what came back ─────────── */

  for (const voucherId of touched) {
    const allocation = allocations.find((a) => a.voucherId === voucherId);
    const ref = doc(db, POS.vouchers, voucherId);

    // Built as field/value pairs rather than an object: the `returnedQty` key
    // contains the colour code, which the POS's CSV import allows to carry a
    // dot — and a dot in a string field path would silently nest the write.
    const updates: unknown[] = [
      'updatedAt',
      serverTimestamp(),
      'lastCreditNoteId',
      noteRef.id,
    ];

    if (allocation) {
      updates.push(
        'balanceDue',
        allocation.balanceAfter,
        'creditedAmount',
        increment(allocation.amount),
        'status',
        allocation.settles ? 'PAID' : 'PARTIAL',
      );
      if (allocation.settles) updates.push('settledAt', serverTimestamp());
    }

    if (voucherId === source.id) {
      for (const line of lines) {
        updates.push(new FieldPath('returnedQty', line.key), increment(line.qty));
      }
    }

    const [field, value, ...more] = updates;
    batch.update(ref, field as string, value, ...more);
  }

  /* ── 4. The goods: into the damaged bucket, journaled, recorded ─────── */

  for (const line of lines) {
    batch.update(doc(db, POS.products, line.productId, POS.variants, line.colorCode), {
      [`stock.${DAMAGED_LOCATION}`]: increment(line.qty),
    });

    batch.set(doc(collection(db, POS.inventoryMoves)), {
      at: serverTimestamp(),
      clientAt,
      type: 'RETURN',
      reason: 'DEFECTIVE',
      channel: WEB_CHANNEL,
      productId: line.productId,
      modelNo: line.modelNo,
      colorCode: line.colorCode,
      qty: line.qty,
      fromLocationId: null,
      toLocationId: DAMAGED_LOCATION,
      refType: 'CREDIT_NOTE',
      refId: noteRef.id,
      refNo: creditNoteNo,
      byUserId: actor.uid,
    });

    batch.set(doc(collection(db, POS.damagedStock)), {
      productId: line.productId,
      modelNo: line.modelNo,
      colorCode: line.colorCode,
      colorName: line.colorName,
      qty: line.qty,
      locationId: DAMAGED_LOCATION,
      reason: RETURN_REASON,
      defectNote: input.defectNote?.trim() || null,
      creditValue: line.credit,
      shopId: shop.id,
      shopName: shop.name,
      salesRepId: shop.salesRepId,
      sourceVoucherId: source.id,
      sourceVoucherNo: source.voucherNo,
      creditNoteId: noteRef.id,
      creditNoteNo,
      status: 'PENDING_INSPECTION',
      reportedBy: actor.uid,
      reportedByName: actor.name,
      reportedAt: serverTimestamp(),
      clientAt,
      channel: WEB_CHANNEL,
    });
  }

  /* ── 5. The shop's account ──────────────────────────────────────────── */

  batch.update(doc(db, POS.shops, shop.id), {
    'credit.outstanding': increment(-applied),
    'credit.onAccountCredit': increment(unapplied),
    'credit.recalcAt': serverTimestamp(),
  });

  batch.set(doc(collection(db, POS.shops, shop.id, POS.ledger)), {
    at: serverTimestamp(),
    clientAt,
    type: 'CREDIT_NOTE',
    channel: WEB_CHANNEL,
    refId: noteRef.id,
    refNo: creditNoteNo,
    debit: 0,
    credit: amount,
    balanceAfter: outstandingBefore - applied,
    note: `${pieces} pcs returned defective · ${source.voucherNo}`,
  });

  batch.set(doc(collection(db, POS.auditLogs)), {
    actorId: actor.uid,
    actorName: actor.name ?? 'unknown',
    actorRole: actor.role.toUpperCase(),
    action: 'CREDIT_NOTE',
    entity: POS.creditNotes,
    entityId: noteRef.id,
    before: null,
    after: { creditNoteNo, amount, applied, unapplied, shopId: shop.id, sourceVoucherId: source.id },
    reason: RETURN_REASON,
    at: serverTimestamp(),
    clientAt,
  });

  try {
    await batch.commit();
  } catch (cause) {
    return { ok: false, code: 'WRITE_FAILED', cause };
  }

  return {
    ok: true,
    creditNoteId: noteRef.id,
    creditNoteNo,
    amount,
    applied,
    unapplied,
    pieces,
  };
}
