/**
 * The bag: frames with their chosen colour and lens configuration.
 *
 * ── Why the lens selection lives on the line item ──────────────────────────
 * The same frame in the same colour is a *different* order line depending on the
 * lenses in it: single vision with a blue filter is not progressive with
 * photochromic, and a customer buying a pair for the office and a pair for
 * driving wants both. So the identity of a line is frame + C-number + lens
 * configuration, not frame + C-number.
 *
 * ── Local, not Firestore ───────────────────────────────────────────────────
 * A bag is not an order. Nothing is committed until the customer sends the
 * Telegram message and a human confirms it, so there is no server-side state to
 * keep and nothing to reconcile. It persists to localStorage so a closed tab does
 * not lose a half-built order — which for a progressive prescription represents
 * real effort.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { LensSelection } from '@/lib/prescription';

export const CART_STORAGE_KEY = 'pbv-cart';

/** A dozen frames is far past any real order; the cap stops runaway growth. */
export const MAX_CART_ITEMS = 12;

export type CartItem = {
  /** Stable id for this line, so React keys and removals are unambiguous. */
  lineId: string;
  frameId: string;
  /** Snapshotted so the bag still reads correctly if the shop renames a frame. */
  frameName: string;
  brand: string;
  frameCode: string;
  cNumber: string;
  colorName: string;
  /** Frame price at the time it was added. */
  framePriceKyat: number;
  /** Thumbnail, for the bag and checkout summary. */
  image: string | null;

  lens: LensSelection;
  /** Frame + lenses + coatings, as quoted by the wizard. */
  lineTotalKyat: number;

  addedAtMs: number;
};

type CartState = {
  items: CartItem[];

  add: (item: Omit<CartItem, 'lineId' | 'addedAtMs'>) => 'added' | 'full';
  remove: (lineId: string) => void;
  clear: () => void;
  /** Sum of every line, before promo, points or delivery. */
  subtotalKyat: () => number;
  count: () => number;
};

/**
 * A line id that does not depend on `crypto.randomUUID`.
 *
 * That API needs a secure context, which `http://` on a local network is not — and
 * the shop will very plausibly demo this from a phone on the office wifi.
 */
function lineId(): string {
  return `line-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item) => {
        const { items } = get();
        if (items.length >= MAX_CART_ITEMS) return 'full';

        set({
          // Appended: the bag reads in the order things were chosen, which is how
          // the customer remembers building it.
          items: [...items, { ...item, lineId: lineId(), addedAtMs: Date.now() }],
        });
        return 'added';
      },

      remove: (id) => set({ items: get().items.filter((entry) => entry.lineId !== id) }),

      clear: () => set({ items: [] }),

      subtotalKyat: () => get().items.reduce((sum, entry) => sum + entry.lineTotalKyat, 0),

      count: () => get().items.length,
    }),
    { name: CART_STORAGE_KEY },
  ),
);
