/**
 * Frames selected for side-by-side comparison.
 *
 * Local-only, and not synced to the member document — unlike the wishlist. A
 * comparison is a decision being made *right now*, in one sitting; a wishlist is a
 * list kept over weeks. Syncing this would mean a stale comparison of frames the
 * customer already rejected greeting them on their next visit.
 *
 * Capped at four. Beyond that the comparison table stops fitting on any screen and
 * columns have to scroll horizontally, at which point nothing is side by side and
 * the feature has defeated itself.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const COMPARE_STORAGE_KEY = 'pbv-compare';

/** Four columns is what fits a laptop; two is the minimum for a comparison. */
export const MAX_COMPARE = 4;
export const MIN_COMPARE = 2;

type CompareState = {
  ids: string[];

  has: (frameId: string) => boolean;
  /** True when the cap is reached, so cards can disable the control. */
  isFull: () => boolean;
  /** Adds, removes, or refuses when full. Returns what happened. */
  toggle: (frameId: string) => 'added' | 'removed' | 'full';
  /**
   * Replaces the selection outright, capped.
   *
   * Separate from `toggle` because seeding has to be **idempotent**. Seeding by
   * calling `toggle` in a loop looked fine and was not: React StrictMode invokes
   * an effect twice against the same captured closure, so the second pass saw a
   * stale empty selection and flipped all three frames straight back off. Any
   * remount would have done the same in production. Assignment cannot misbehave
   * that way however many times it runs.
   */
  setMany: (frameIds: string[]) => void;
  remove: (frameId: string) => void;
  clear: () => void;
};

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],

      has: (frameId) => get().ids.includes(frameId),

      isFull: () => get().ids.length >= MAX_COMPARE,

      toggle: (frameId) => {
        const { ids } = get();

        if (ids.includes(frameId)) {
          set({ ids: ids.filter((id) => id !== frameId) });
          return 'removed';
        }

        // Refuses rather than silently dropping the oldest. Quietly evicting a
        // frame the customer chose is worse than telling them the tray is full.
        if (ids.length >= MAX_COMPARE) return 'full';

        // Appended, not prepended: comparison columns should stay in the order
        // they were picked, so the table does not reshuffle as one is added.
        set({ ids: [...ids, frameId] });
        return 'added';
      },

      setMany: (frameIds) =>
        set({ ids: Array.from(new Set(frameIds)).slice(0, MAX_COMPARE) }),

      remove: (frameId) => set({ ids: get().ids.filter((id) => id !== frameId) }),

      clear: () => set({ ids: [] }),
    }),
    { name: COMPARE_STORAGE_KEY },
  ),
);
