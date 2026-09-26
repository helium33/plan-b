/**
 * Reading a shop's account from the POS: the shop, and its vouchers.
 *
 * ── Why every query is shaped by who is asking ─────────────────────────────
 * Firestore rules are not filters. A query is refused outright unless the rules
 * can prove, from the query alone, that every document it could return is one
 * the caller may read. So:
 *
 *   - a shop account queries `shopId == its own` — the rule it must satisfy;
 *   - a sales rep additionally queries `salesRepId == their uid`, because the
 *     POS lets a rep read only vouchers carrying their id;
 *   - an admin needs neither.
 *
 * Equality filters only, sorted on the device: two equalities are served by
 * Firestore's built-in index merging, so none of this needs a composite index
 * deployed before it works. A shop's voucher history is hundreds of documents,
 * not millions — sorting it here costs nothing.
 */
import {
  type QueryConstraint,
  type Unsubscribe,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import {
  POS,
  normalizeShop,
  normalizeVoucher,
  toDate,
  type PosShop,
  type PosVoucher,
} from '@/lib/pos/schema';
import type { AppRole } from '@/lib/rbac';

export type Viewer = { uid: string; role: AppRole };

function voucherConstraints(shopId: string, viewer: Viewer): QueryConstraint[] {
  const clauses = [where('shopId', '==', shopId)];
  if (viewer.role === 'sales') clauses.push(where('salesRepId', '==', viewer.uid));
  return clauses;
}

/** Newest first. Vouchers without a readable date sink to the end. */
function newestFirst(vouchers: PosVoucher[]): PosVoucher[] {
  return vouchers.sort(
    (a, b) => (toDate(b.issueDate)?.getTime() ?? 0) - (toDate(a.issueDate)?.getTime() ?? 0),
  );
}

export async function getShop(shopId: string): Promise<PosShop | null> {
  const snap = await getDoc(doc(db, POS.shops, shopId));
  return snap.exists() ? normalizeShop(snap.id, snap.data()) : null;
}

export async function listShopVouchers(shopId: string, viewer: Viewer): Promise<PosVoucher[]> {
  const snap = await getDocs(
    query(collection(db, POS.vouchers), ...voucherConstraints(shopId, viewer)),
  );
  return newestFirst(snap.docs.map((d) => normalizeVoucher(d.id, d.data())));
}

export function subscribeShop(
  shopId: string,
  onChange: (shop: PosShop | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, POS.shops, shopId),
    (snap) => onChange(snap.exists() ? normalizeShop(snap.id, snap.data()) : null),
    onError,
  );
}

export function subscribeShopVouchers(
  shopId: string,
  viewer: Viewer,
  onChange: (vouchers: PosVoucher[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, POS.vouchers), ...voucherConstraints(shopId, viewer)),
    (snap) => onChange(newestFirst(snap.docs.map((d) => normalizeVoucher(d.id, d.data())))),
    onError,
  );
}

/**
 * The shops a member of staff may act for: every active shop for an admin,
 * the rep's own patch for a sales rep. Alphabetical, as a picker wants it.
 */
export async function listChoosableShops(viewer: Viewer): Promise<PosShop[]> {
  const clauses = [where('active', '==', true)];
  if (viewer.role === 'sales') clauses.push(where('salesRepId', '==', viewer.uid));

  const snap = await getDocs(query(collection(db, POS.shops), ...clauses));
  return snap.docs
    .map((d) => normalizeShop(d.id, d.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
}
