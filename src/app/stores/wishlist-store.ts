/**
 * Saved frames, for guests and members alike.
 *
 * ── The two-tier design ────────────────────────────────────────────────────
 * A guest's list lives in localStorage, so someone can save frames the moment
 * they find one — no account, no interruption. A member's list lives on their
 * member document, so it follows them to another device.
 *
 * On sign-in the local list is **merged into** the stored one, never swapped for
 * it. Union in that direction is the only version that cannot lose work: three
 * frames saved as a guest plus five already on the account gives eight.
 *
 * The local copy is kept even while signed in, deliberately. It is what makes the
 * heart respond instantly rather than after a Firestore round trip, and it means
 * signing out leaves the customer with their list rather than an empty page.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { MAX_WISHLIST } from '@/lib/firestore/wishlist';

export const WISHLIST_STORAGE_KEY = 'pbv-wishlist';

type WishlistState = {
  /** Frame ids. Order is newest-first, which is how the page lists them. */
  ids: string[];
  /** True once a member's stored list has been folded in this session. */
  merged: boolean;

  has: (frameId: string) => boolean;
  toggle: (frameId: string) => void;
  add: (frameId: string) => void;
  remove: (frameId: string) => void;
  clear: () => void;
  /** Replaces local state with the union of local and remote. */
  mergeRemote: (remoteIds: string[]) => string[];
  /** Called on sign-out so the next person does not inherit the list. */
  reset: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      merged: false,

      has: (frameId) => get().ids.includes(frameId),

      toggle: (frameId) => {
        const { ids } = get();
        set({
          ids: ids.includes(frameId)
            ? ids.filter((id) => id !== frameId)
            : [frameId, ...ids].slice(0, MAX_WISHLIST),
        });
      },

      add: (frameId) => {
        const { ids } = get();
        if (ids.includes(frameId)) return;
        set({ ids: [frameId, ...ids].slice(0, MAX_WISHLIST) });
      },

      remove: (frameId) => set({ ids: get().ids.filter((id) => id !== frameId) }),

      clear: () => set({ ids: [] }),

      /**
       * Folds a member's stored list together with the local one.
       *
       * Local ids come first so anything just saved as a guest stays at the top,
       * where the customer expects to find it.
       *
       * @returns the local-only ids, which the caller pushes to Firestore.
       */
      mergeRemote: (remoteIds) => {
        const local = get().ids;
        const remoteSet = new Set(remoteIds);
        const localOnly = local.filter((id) => !remoteSet.has(id));

        set({
          ids: Array.from(new Set([...local, ...remoteIds])).slice(0, MAX_WISHLIST),
          merged: true,
        });

        return localOnly;
      },

      reset: () => set({ ids: [], merged: false }),
    }),
    {
      name: WISHLIST_STORAGE_KEY,
      // `merged` is per-session: a fresh page load must merge again, because the
      // member document may have changed on another device in the meantime.
      partialize: (state) => ({ ids: state.ids }) as WishlistState,
    },
  ),
);
