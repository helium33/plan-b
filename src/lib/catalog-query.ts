/**
 * Searching and filtering the catalogue, in one place.
 *
 * Pure functions over `FrameDoc[]` — no React, no Firestore — because the same
 * query has to run against the grid, the result count and the "nothing matched"
 * copy, and three components each doing their own filtering is how those three
 * end up disagreeing.
 *
 * ── Why this is all client-side ────────────────────────────────────────────
 * The whole catalogue is already in memory (see `firestore/frames.ts`). A
 * wholesale buyer types a model code and expects the grid to narrow as they
 * type; a query per keystroke would be slower, cost reads, and fail entirely on
 * the patchy mobile connections this app is used on.
 */
import type { FrameCategory, FrameMaterial, FrameShape } from '@/lib/attributes';
import { frameDisplayName, type FrameDoc } from '@/lib/product';

/** `null` on any axis means "All" — a real value in the filter, not its absence. */
export type CatalogFilters = {
  category: FrameCategory | null;
  material: FrameMaterial | null;
  shape: FrameShape | null;
  /** A name group from `listSeries` — the exact trimmed brand/name text. */
  series: string | null;
  /** Restrict to bookmarked frames — the "Saved" tab. */
  savedOnly: boolean;
  /** Raw text from the search box. Empty string means no search. */
  query: string;
};

export const NO_FILTERS: CatalogFilters = {
  category: null,
  material: null,
  shape: null,
  series: null,
  savedOnly: false,
  query: '',
};

/** How many *chip* filters are active. The search box is shown separately. */
export function activeFilterCount(filters: CatalogFilters): number {
  return [filters.category, filters.material, filters.shape, filters.series].filter(Boolean).length;
}

export function hasAnyFilter(filters: CatalogFilters): boolean {
  return (
    activeFilterCount(filters) > 0 || filters.savedOnly || filters.query.trim().length > 0
  );
}

/* ── Name groups ───────────────────────────────────────────────────────────── */

/**
 * The group a frame is filed under: its name exactly as the POS spells it.
 *
 * Deliberately *not* folded or fuzzy-matched. The shop names its lines so that
 * "Soulmate" and "Soulmate 2" are different ranges, and one character's
 * difference at the end is how it says so — merging them would file two
 * ranges together. Only surrounding spaces are ignored, since nobody means
 * anything by those.
 */
export function seriesOf(frame: FrameDoc): string {
  return frame.brand.trim() || frame.frameCode.trim();
}

/** Every name group in the catalogue with how many frames it holds, A→Z. */
export function listSeries(frames: readonly FrameDoc[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const frame of frames) {
    const name = seriesOf(frame);
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

/* ── Search ────────────────────────────────────────────────────────────────── */

/**
 * Folds a string into something comparable.
 *
 * Punctuation is stripped rather than normalised because model codes are written
 * every possible way — `PBW-2041`, `pbw 2041`, `PBW2041` — and a buyer who
 * remembers the digits should find the frame regardless of how they type the
 * separator.
 */
function fold(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9က-႟]+/g, '');
}

/**
 * Everything about a frame that a search should match, as one folded string.
 *
 * Colour names and C-numbers are included because "tortoise" and "C3" are both
 * things a buyer searches for — they are reading from a previous order sheet,
 * not from this screen.
 */
function haystack(frame: FrameDoc): string {
  return fold(
    [
      frame.frameCode,
      frame.brand,
      frameDisplayName(frame),
      frame.material,
      frame.shape,
      frame.category,
      ...frame.variants.flatMap((variant) => [variant.cNumber, variant.colorName]),
    ].join(' '),
  );
}

/**
 * Splits the query into folded terms, all of which must match.
 *
 * AND rather than OR: "titanium square" should narrow to titanium squares, not
 * widen to everything that is either. Widening on a second word is the single
 * most confusing thing a search box can do.
 */
function terms(query: string): string[] {
  return query
    .split(/\s+/)
    .map(fold)
    .filter((term) => term.length > 0);
}

/**
 * Frames matching a free-text query.
 *
 * Exported for the rare caller that wants search without the chips; the grid
 * goes through `queryCatalog`.
 */
export function searchFrames(frames: readonly FrameDoc[], query: string): FrameDoc[] {
  const needles = terms(query);
  if (needles.length === 0) return [...frames];

  return frames.filter((frame) => {
    const hay = haystack(frame);
    return needles.every((needle) => hay.includes(needle));
  });
}

/* ── Combined ──────────────────────────────────────────────────────────────── */

/**
 * Applies the saved tab, the name group, all three chip filters and the search box.
 *
 * @param favouriteIds Bookmarked frame ids, needed only when `savedOnly` is set.
 */
export function queryCatalog(
  frames: readonly FrameDoc[],
  filters: CatalogFilters,
  favouriteIds: readonly string[] = [],
): FrameDoc[] {
  const saved = new Set(favouriteIds);

  const narrowed = frames.filter(
    (frame) =>
      (!filters.savedOnly || saved.has(frame.id)) &&
      (filters.category === null || frame.category === filters.category) &&
      (filters.material === null || frame.material === filters.material) &&
      (filters.shape === null || frame.shape === filters.shape) &&
      (filters.series === null || seriesOf(frame) === filters.series),
  );

  return searchFrames(narrowed, filters.query);
}
