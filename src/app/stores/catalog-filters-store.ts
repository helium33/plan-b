/**
 * The catalogue's search and filter state.
 *
 * ── Why this is a store and not `useState` on the catalogue page ───────────
 * The filters are no longer rendered in one place. The attribute groups live in
 * the left sidebar, which belongs to `AppShell` and outlives any single route;
 * the search box and the All/Saved tabs live in the catalogue page's own sticky
 * row; and on a phone the groups are rendered a third time inside a sheet. All
 * three have to agree, and lifting state to their nearest common ancestor would
 * mean threading a filter object through the shell and out to `Outlet` context
 * for the benefit of exactly one route.
 *
 * ── Deliberately not persisted ─────────────────────────────────────────────
 * A filter that survives a reload is a filter nobody remembers switching on. The
 * buyer comes back to a catalogue showing four frames out of two hundred and
 * concludes the shop has run out of stock. The draft order persists because it
 * is the buyer's work; a filter is just where they were looking.
 */
import { create } from 'zustand';

import { NO_FILTERS, type CatalogFilters } from '@/lib/catalog-query';

interface CatalogFilterState {
  filters: CatalogFilters;
  /** Merges a partial change — every caller only ever sets one axis. */
  patch: (patch: Partial<CatalogFilters>) => void;
  /**
   * Back to showing everything.
   *
   * `savedOnly` is preserved because it is a tab, not a filter: clearing the
   * chips while standing on the Saved tab should leave the buyer on that tab
   * looking at all of their saved frames, not silently move them elsewhere.
   */
  clear: () => void;
}

export const useCatalogFilters = create<CatalogFilterState>()((set, get) => ({
  filters: NO_FILTERS,

  patch: (patch) => set({ filters: { ...get().filters, ...patch } }),

  clear: () => set({ filters: { ...NO_FILTERS, savedOnly: get().filters.savedOnly } }),
}));
