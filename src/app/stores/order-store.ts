/**
 * The draft wholesale order, the buyer's shop profile, and their branches.
 *
 * ── Why quantities and not priced line items ───────────────────────────────
 * The store holds only what the buyer typed: how many of each C-number, plus who
 * they are and where it ships. Every kyat figure is derived by `priceOrder` at
 * render time from the live catalogue.
 *
 * The alternative — caching prices into the draft as items are added — would
 * mean a draft left overnight quotes yesterday's price, and the buyer and the
 * shop would be looking at two different totals with no way to tell which was
 * stale. Deriving is a few multiplications per render and removes that whole
 * class of disagreement.
 *
 * Persisted to localStorage because a wholesale order is built over a session or
 * two on a phone, often with the app closed in between while the buyer counts
 * shelf space.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Bank, PaymentMethod } from '@/lib/payment';
import type { QuantityMap } from '@/lib/wholesale';

const STORAGE_KEY = 'pbw-draft-order';

/** Guards against a mistyped stepper turning into a 9,999-piece order. */
export const MAX_QTY_PER_COLOR = 999;

/**
 * One of the buyer's shops.
 *
 * A wholesale customer with branches in Yangon and Mandalay splits deliveries
 * between them constantly, and re-typing the address every order is exactly the
 * friction that sends people back to ordering by voice note. Branches are saved
 * once and picked per order.
 */
export type Branch = {
  /** Stable id so renaming a branch does not orphan the selection. */
  id: string;
  /** What the buyer calls it — "Branch 1", "Zay Cho shop". */
  label: string;
  city: string;
  /** Street, township, delivery landmark — whatever the driver needs. */
  address: string;
  phone: string;
};

export function newBranch(label = ''): Branch {
  return { id: crypto.randomUUID(), label, city: '', address: '', phone: '' };
}

/**
 * Who is ordering.
 *
 * There is no account behind this — it is stationery, not identity, and the shop
 * verifies who it is talking to on Telegram anyway. It persists so a repeat
 * buyer types their shop name once ever rather than once per order.
 */
export type ShopDetails = {
  shopName: string;
  contactName: string;
  phone: string;
  /** Township / city of the main shop. Branches carry their own. */
  location: string;
  /** Free text: delivery instructions, packing requests, a promised date. */
  note: string;
};

export const EMPTY_SHOP: ShopDetails = {
  shopName: '',
  contactName: '',
  phone: '',
  location: '',
  note: '',
};

interface OrderState {
  /** Frame id → C-number → pieces. Zero-quantity keys are pruned, never stored. */
  quantities: Record<string, QuantityMap>;
  shop: ShopDetails;

  branches: Branch[];
  /** Which branch this order ships to. `null` means the main shop address. */
  shipToBranchId: string | null;

  paymentMethod: PaymentMethod;
  /** Only meaningful when `paymentMethod` is `bank-transfer`. */
  bank: Bank | null;

  setQty: (frameId: string, cNumber: string, qty: number) => void;
  adjustQty: (frameId: string, cNumber: string, delta: number) => void;
  /** Puts `qty` on every listed colour at once — the "take the full set" action. */
  setWholeSet: (frameId: string, cNumbers: string[], qty: number) => void;
  clearFrame: (frameId: string) => void;
  clearAll: () => void;
  /** Replaces the whole draft — used by Re-Order from history. */
  replaceDraft: (quantities: Record<string, QuantityMap>) => void;

  setShop: (patch: Partial<ShopDetails>) => void;

  addBranch: () => void;
  updateBranch: (id: string, patch: Partial<Omit<Branch, 'id'>>) => void;
  removeBranch: (id: string) => void;
  setShipToBranch: (id: string | null) => void;

  setPaymentMethod: (method: PaymentMethod) => void;
  setBank: (bank: Bank | null) => void;
}

/**
 * Writes one quantity, pruning as it goes.
 *
 * Zeroes are deleted rather than stored, and a frame whose last colour drops to
 * zero is removed entirely. Without the pruning, `Object.keys(quantities)` would
 * grow forever with `{}` husks of frames the buyer changed their mind about, and
 * every "is the draft empty?" check would have to know to ignore them.
 */
function writeQty(
  quantities: Record<string, QuantityMap>,
  frameId: string,
  cNumber: string,
  qty: number,
): Record<string, QuantityMap> {
  const clamped = Math.min(MAX_QTY_PER_COLOR, Math.max(0, Math.trunc(qty)));
  const next = { ...quantities };
  const line = { ...(next[frameId] ?? {}) };

  if (clamped === 0) {
    delete line[cNumber];
  } else {
    line[cNumber] = clamped;
  }

  if (Object.keys(line).length === 0) {
    delete next[frameId];
  } else {
    next[frameId] = line;
  }

  return next;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      quantities: {},
      shop: EMPTY_SHOP,
      branches: [],
      shipToBranchId: null,
      paymentMethod: 'kpay',
      bank: null,

      setQty: (frameId, cNumber, qty) =>
        set({ quantities: writeQty(get().quantities, frameId, cNumber, qty) }),

      adjustQty: (frameId, cNumber, delta) => {
        const current = get().quantities[frameId]?.[cNumber] ?? 0;
        set({ quantities: writeQty(get().quantities, frameId, cNumber, current + delta) });
      },

      setWholeSet: (frameId, cNumbers, qty) => {
        let next = get().quantities;
        for (const cNumber of cNumbers) next = writeQty(next, frameId, cNumber, qty);
        set({ quantities: next });
      },

      clearFrame: (frameId) => {
        const next = { ...get().quantities };
        delete next[frameId];
        set({ quantities: next });
      },

      clearAll: () => set({ quantities: {} }),

      replaceDraft: (quantities) => set({ quantities }),

      // The shop's details, branches and payment choice survive `clearAll` on
      // purpose: clearing the order is "start a new order", not "forget me".
      setShop: (patch) => set({ shop: { ...get().shop, ...patch } }),

      addBranch: () => set({ branches: [...get().branches, newBranch()] }),

      updateBranch: (id, patch) =>
        set({
          branches: get().branches.map((branch) =>
            branch.id === id ? { ...branch, ...patch } : branch,
          ),
        }),

      removeBranch: (id) =>
        set({
          branches: get().branches.filter((branch) => branch.id !== id),
          // Deleting the branch an order was addressed to must not leave the
          // order pointing at nothing — fall back to the main shop address.
          shipToBranchId: get().shipToBranchId === id ? null : get().shipToBranchId,
        }),

      setShipToBranch: (id) => set({ shipToBranchId: id }),

      setPaymentMethod: (method) =>
        set({
          paymentMethod: method,
          // Switching away from a transfer clears the bank, so an order cannot
          // carry "COD (KBZ)" — a combination that means nothing.
          bank: method === 'bank-transfer' ? get().bank : null,
        }),

      setBank: (bank) => set({ bank }),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      /** v1 had no branches or payment fields; defaults fill them in. */
      migrate: (persisted) => ({
        branches: [],
        shipToBranchId: null,
        paymentMethod: 'kpay' as PaymentMethod,
        bank: null,
        ...(persisted as object),
      }),
    },
  ),
);

/* ── Selectors ─────────────────────────────────────────────────────────────── */

/**
 * Total pieces in the draft, for the nav badge.
 *
 * A selector rather than stored state: keeping a running count in the store means
 * two sources of truth that drift the first time a write path forgets to update
 * one of them.
 */
export function draftPieceCount(quantities: Record<string, QuantityMap>): number {
  let total = 0;
  for (const line of Object.values(quantities)) {
    for (const qty of Object.values(line)) total += qty;
  }
  return total;
}

/** The branch an order ships to, or `null` for the main shop address. */
export function selectedBranch(state: {
  branches: Branch[];
  shipToBranchId: string | null;
}): Branch | null {
  return state.branches.find((branch) => branch.id === state.shipToBranchId) ?? null;
}
