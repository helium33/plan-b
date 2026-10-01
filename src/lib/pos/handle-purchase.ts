/**
 * handlePurchase — a credit order, written to the POS in one atomic batch.
 *
 * ── What one order touches ─────────────────────────────────────────────────
 *   vouchers/{id}                        the order, in the POS's voucher shape
 *   products/{p}/variants/{c}  × lines   stock.LOC-MAIN decremented
 *   inventoryMoves/{id}        × lines   the immutable stock journal
 *   shops/{shopId}                       credit.outstanding += total (the "used" credit)
 *   shops/{shopId}/ledger/{id}           the running account line
 *   users/{uid}/orders/{voucherNo}       the buyer's own history, for Re-Order
 *   auditLogs/{id}                       who did it
 *
 * All of it is one `writeBatch`. A batch commits atomically: the POS can never
 * see a voucher whose stock did not move, stock that moved with no voucher, or
 * a debt with no order behind it. That is the failure that makes a wholesale
 * ledger untrustworthy, and it is why this is a batch and not a sequence of
 * writes with a retry loop around it.
 *
 * ── The same document the POS writes ───────────────────────────────────────
 * The voucher follows `buildVoucherDoc` in the POS field for field, so the
 * voucher list, the credit engine, the ageing report and the printed invoice
 * all handle a web order with no special case. Two deliberate differences:
 *
 *   - `unitCost` is null. Costs are staff-only and a shop's device must never
 *     read them; the POS profit report already falls back to the product's
 *     current cost for a line without one, and marks it as an estimate.
 *   - `bundlesPending: true`. The case and cloth that ship with a frame are
 *     moved by the POS's auto-bundling, which needs the product document —
 *     staff-only for the same reason. The warehouse moves them when it packs.
 *
 * ── Why the rules, not this file, are the guarantee ────────────────────────
 * Everything checked here is re-checked by `firestore.rules` against the state
 * the batch would produce: stock may not go below zero, the balance may not
 * rise past the credit limit, the shop's new balance must equal the old one
 * plus this voucher, and every decrement must point at a voucher for the same
 * shop in the same batch. Two shops buying the last three pieces at the same
 * moment both pass the check below; the rules let exactly one batch through.
 * The checks here exist to give a clear message instead of a permission error.
 */
import {
  collection,
  doc,
  increment,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { USERS_COLLECTION } from '@/lib/firestore/users';
import { ORDERS_SUBCOLLECTION } from '@/lib/firestore/orders';
import {
  resolveOrderLines,
  type OrderLineInput,
  type ResolvedLine,
} from '@/lib/pos/catalog-link';
import { canPurchase, computeDueDate, evaluateShopCredit, type PurchaseDenial } from '@/lib/pos/credit';
import {
  MAIN_LOCATION,
  POS,
  WEB_CHANNEL,
  buildDocNo,
} from '@/lib/pos/schema';
import { getShop, listShopVouchers } from '@/lib/pos/shop-data';
import { frameDisplayName } from '@/lib/product';
import { can, type AppRole } from '@/lib/rbac';
import type { QuantityMap } from '@/lib/wholesale';

/** Firestore's hard cap on writes in one batch. */
const MAX_BATCH_WRITES = 500;

/** Writes that do not scale with lines: voucher, shop, ledger, history, audit. */
const FIXED_WRITES = 5;

export type PurchaseActor = {
  uid: string;
  name: string | null;
  role: AppRole;
};

export type PurchaseInput = {
  actor: PurchaseActor;
  /** The POS shop being billed. For a shop account, its own `shopId` claim. */
  shopId: string;
  /** The draft, as `priceOrder` lays it out: a frame and its C-number quantities. */
  lines: readonly OrderLineInput[];
  note?: string;
  /** Injected by tests. Everything date-dependent is computed from this. */
  now?: Date;
};

export type PurchaseFailure =
  | { ok: false; code: 'EMPTY' | 'NOT_ALLOWED' | 'SHOP_NOT_FOUND' | 'SHOP_INACTIVE' | 'TOO_LARGE' }
  | { ok: false; code: 'NOT_LINKED'; frameCode: string }
  | { ok: false; code: 'COLOUR_NOT_IN_POS'; frameCode: string; cNumber: string }
  | {
      ok: false;
      code: 'OUT_OF_STOCK';
      shortages: { modelNo: string; colorCode: string; requested: number; available: number }[];
    }
  | {
      ok: false;
      code: PurchaseDenial;
      projected?: number;
      limit?: number;
      days?: number;
      voucherNo?: string;
      amount?: number;
    }
  | { ok: false; code: 'READ_FAILED' | 'WRITE_FAILED'; cause: unknown };

export type PurchaseSuccess = {
  ok: true;
  voucherId: string;
  voucherNo: string;
  pieces: number;
  subtotal: number;
  grandTotal: number;
  dueDate: Date;
};

export type PurchaseResult = PurchaseSuccess | PurchaseFailure;

/**
 * The same model and colour entered twice (two frames linked to one product,
 * or a draft edited in two tabs) must be one decrement: the stock rule checks
 * the variant's final value, and two writes to it in one batch would be judged
 * against each other rather than against the order.
 */
function mergeLines(lines: ResolvedLine[]): ResolvedLine[] {
  const merged = new Map<string, ResolvedLine>();
  for (const line of lines) {
    const key = `${line.productId}|${line.colorCode}`;
    const existing = merged.get(key);
    merged.set(key, existing ? { ...existing, qty: existing.qty + line.qty } : { ...line });
  }
  return [...merged.values()];
}

export async function handlePurchase(input: PurchaseInput): Promise<PurchaseResult> {
  try {
    return await purchase(input);
  } catch (cause) {
    // A read the rules refused (a shop that is not this account's, a product
    // that is not linked) or the network. Nothing has been written yet.
    return { ok: false, code: 'READ_FAILED', cause };
  }
}

async function purchase(input: PurchaseInput): Promise<PurchaseResult> {
  const { actor, shopId } = input;
  const now = input.now ?? new Date();

  if (!can(actor.role, 'purchase:credit')) return { ok: false, code: 'NOT_ALLOWED' };

  /* ── 1. Resolve the draft to POS products, with live stock ──────────── */

  const resolved = await resolveOrderLines(input.lines, {
    // Staff may look a frame up by model number; a shop relies on the link.
    canReadProducts: actor.role !== 'shop',
  });
  if (!resolved.ok) return resolved;

  const lines = mergeLines(resolved.lines).filter((line) => line.qty > 0);
  if (lines.length === 0) return { ok: false, code: 'EMPTY' };
  if (FIXED_WRITES + lines.length * 2 > MAX_BATCH_WRITES) return { ok: false, code: 'TOO_LARGE' };

  const shortages = lines
    .filter((line) => line.qty > line.available)
    .map((line) => ({
      modelNo: line.modelNo,
      colorCode: line.colorCode,
      requested: line.qty,
      available: Math.max(0, line.available),
    }));
  if (shortages.length > 0) return { ok: false, code: 'OUT_OF_STOCK', shortages };

  /* ── 2. The shop and its account ─────────────────────────────────────── */

  const shop = await getShop(shopId);
  if (!shop) return { ok: false, code: 'SHOP_NOT_FOUND' };
  if (!shop.active) return { ok: false, code: 'SHOP_INACTIVE' };

  const vouchers = await listShopVouchers(shopId, { uid: actor.uid, role: actor.role });
  const credit = evaluateShopCredit(shop, vouchers, now);

  // No discount on a web order: the on-time 2% coupon was withdrawn, and the
  // rules now refuse any voucher from a shop that carries one.
  const subtotal = lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
  const grandTotal = subtotal;
  const pieces = lines.reduce((sum, line) => sum + line.qty, 0);

  const gate = canPurchase(credit, grandTotal);
  if (!gate.allowed) return { ok: false, ...gate };

  /* ── 3. The voucher, exactly as the POS would have written it ───────── */

  const voucherRef = doc(collection(db, POS.vouchers));
  const voucherNo = buildDocNo('VN', now);
  const dueDate = computeDueDate(now, shop.creditTermDays);
  const previousBalance = credit.outstanding;
  const clientAt = now.toISOString();

  const batch = writeBatch(db);

  batch.set(voucherRef, {
    voucherNo,
    shopId: shop.id,
    shopName: shop.name,
    township: shop.township,
    // The shop's own rep, never the buyer: this is what lets that rep see the
    // order in the POS, and what their commission is counted against.
    salesRepId: shop.salesRepId,
    type: 'SALE',
    status: 'ISSUED',
    channel: WEB_CHANNEL,

    issueDate: now,
    termDays: shop.creditTermDays,
    dueDate,

    items: lines.map((line) => ({
      productId: line.productId,
      modelNo: line.modelNo,
      colorCode: line.colorCode,
      colorName: line.colorName,
      qty: line.qty,
      unitPrice: line.unitPrice,
      listPrice: line.unitPrice,
      lineTotal: line.qty * line.unitPrice,
      tierApplied: 'STANDARD',
      discountPct: 0,
      unitCost: null,
      bundleUnitCost: null,
      bundled: null,
    })),

    subtotal,
    discount: 0,
    discountReason: null,
    grandTotal,

    paidAmount: 0,
    paymentAtIssue: 0,
    balanceDue: grandTotal,
    previousBalance,
    newBalance: previousBalance + grandTotal,

    locationId: MAIN_LOCATION,
    bundlesPending: true,
    note: input.note?.trim() || null,

    createdBy: actor.uid,
    createdByName: actor.name,
    createdByRole: actor.role,
    issuedOffline: false,
    overrideRef: null,
    clientAt,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  /* ── 4. Stock out, and the journal that explains it ─────────────────── */

  for (const line of lines) {
    batch.update(doc(db, POS.products, line.productId, POS.variants, line.colorCode), {
      [`stock.${MAIN_LOCATION}`]: increment(-line.qty),
      // Lets the rules confirm this decrement belongs to a real voucher for
      // the same shop in this same batch — see `webStockDecrement`.
      lastSaleRef: voucherRef.id,
    });

    batch.set(doc(collection(db, POS.inventoryMoves)), {
      at: serverTimestamp(),
      clientAt,
      type: 'SALE',
      reason: 'SALE',
      channel: WEB_CHANNEL,
      productId: line.productId,
      modelNo: line.modelNo,
      colorCode: line.colorCode,
      qty: -line.qty,
      fromLocationId: MAIN_LOCATION,
      toLocationId: null,
      refType: 'VOUCHER',
      refId: voucherRef.id,
      refNo: voucherNo,
      byUserId: actor.uid,
    });
  }

  /* ── 5. The credit: used goes up by exactly this order ──────────────── */

  batch.update(doc(db, POS.shops, shop.id), {
    'credit.outstanding': increment(grandTotal),
    'credit.recalcAt': serverTimestamp(),
    'credit.lastWebVoucherId': voucherRef.id,
    'stats.lastPurchaseAt': serverTimestamp(),
    'stats.lifetimeSales': increment(grandTotal),
    'stats.voucherCount': increment(1),
  });

  batch.set(doc(collection(db, POS.shops, shop.id, POS.ledger)), {
    at: serverTimestamp(),
    clientAt,
    type: 'VOUCHER',
    channel: WEB_CHANNEL,
    refId: voucherRef.id,
    refNo: voucherNo,
    debit: grandTotal,
    credit: 0,
    balanceAfter: previousBalance + grandTotal,
    note: `${pieces} pcs · ${lines.length} lines · web order`,
  });

  /* ── 6. The buyer's own copy, so Re-Order works on it ───────────────── */

  const quantities: Record<string, QuantityMap> = {};
  for (const { frame, entries } of input.lines) {
    for (const { cNumber, qty } of entries) {
      if (qty <= 0) continue;
      quantities[frame.id] = { ...(quantities[frame.id] ?? {}), [cNumber]: qty };
    }
  }

  batch.set(doc(db, USERS_COLLECTION, actor.uid, ORDERS_SUBCOLLECTION, voucherNo), {
    createdAtMs: now.getTime(),
    submittedAt: serverTimestamp(),
    lines: input.lines
      .filter(({ entries }) => entries.some((entry) => entry.qty > 0))
      .map(({ frame, entries }) => {
        const colours = entries.filter((entry) => entry.qty > 0);
        const totalPieces = colours.reduce((sum, entry) => sum + entry.qty, 0);
        return {
          frameId: frame.id,
          frameCode: frame.frameCode,
          name: frameDisplayName(frame),
          unitPriceKyat: frame.wholesalePrice,
          colours,
          totalPieces,
          subtotalKyat: totalPieces * frame.wholesalePrice,
        };
      }),
    totalPieces: pieces,
    subtotalKyat: grandTotal,
    shopName: shop.name,
    contactName: actor.name ?? '',
    phone: '',
    shipTo: shop.township,
    paymentMethod: 'credit',
    bank: null,
    note: input.note?.trim() ?? '',
    quantities,
    voucherId: voucherRef.id,
  });

  /* ── 7. Audit ───────────────────────────────────────────────────────── */

  batch.set(doc(collection(db, POS.auditLogs)), {
    actorId: actor.uid,
    actorName: actor.name ?? 'unknown',
    actorRole: actor.role.toUpperCase(),
    action: 'VOUCHER_CREATE',
    entity: POS.vouchers,
    entityId: voucherRef.id,
    before: null,
    after: { voucherNo, grandTotal, shopId: shop.id, channel: WEB_CHANNEL },
    reason: null,
    at: serverTimestamp(),
    clientAt,
  });

  try {
    await batch.commit();
  } catch (cause) {
    // Almost always the rules refusing a batch another buyer raced us to —
    // the last pieces, or the last of the credit limit. Nothing was written.
    return { ok: false, code: 'WRITE_FAILED', cause };
  }

  return {
    ok: true,
    voucherId: voucherRef.id,
    voucherNo,
    pieces,
    subtotal,
    grandTotal,
    dueDate,
  };
}
