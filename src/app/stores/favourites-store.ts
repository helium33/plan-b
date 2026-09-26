/**
 * Frames the buyer has bookmarked.
 *
 * ── Why this is local and not tied to an account ───────────────────────────
 * Signing in is optional in this app, and a buyer who hearts twenty frames
 * before ever signing in must not lose them. Storing ids in localStorage means
 * favourites work for everybody from the first tap. The cost is that they do not
 * follow the buyer to a second device, which for a shop owner working from one
 * phone is a trade worth making.
 *
 * Only ids are stored, never frame documents. A cached document would go stale
 * against a price change and the saved list would quietly quote last month's
 * figures; ids resolve against the live catalogue on every render.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'pbw-favourites';

interface FavouritesState {
  /** Frame ids, newest first — the order they are displayed in. */
  ids: string[];
  toggle: (frameId: string) => void;
  clear: () => void;
}

export const useFavouritesStore = create<FavouritesState>()(
  persist(
    (set, get) => ({
      ids: [],

      toggle: (frameId) => {
        const current = get().ids;
        set({
          ids: current.includes(frameId)
            ? current.filter((id) => id !== frameId)
            : // Prepended, so the saved tab reads newest-first and a frame just
              // hearted is at the top rather than buried under older ones.
              [frameId, ...current],
        });
      },

      clear: () => set({ ids: [] }),
    }),
    { name: STORAGE_KEY, version: 1 },
  ),
);

/** Subscribe to just one frame's state, so hearting A does not re-render B. */
export function useIsFavourite(frameId: string): boolean {
  return useFavouritesStore((state) => state.ids.includes(frameId));
}
