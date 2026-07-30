/**
 * Shop filtering, sorting and URL serialisation.
 *
 * Pure, so the combining rules can be tested without a browser — and they need
 * testing, because "advanced filtering" is mostly a question of how filters
 * combine, and getting that wrong produces results that look plausible and are
 * wrong.
 *
 * ── How filters combine ────────────────────────────────────────────────────
 * **OR within a facet, AND across facets.** Ticking Metal and Titanium means
 * "metal or titanium" — nobody wants frames that are somehow both. Ticking Metal
 * and then Oval face shape means "metal AND suits oval faces". This is what every
 * shop does, and it is what customers expect even though nobody could state it.
 *
 * Comfort features are the one exception: those are AND *within* the facet.
 * Ticking "Lightweight" and "Spring hinges" means a frame with both, because the
 * customer is listing requirements, not alternatives.
 */
import {
  CATEGORIES,
  COMFORT_FEATURES,
  FACE_SHAPES,
  FRAME_SIZES,
  MATERIALS,
  type Category,
  type ComfortFeature,
  type FaceShape,
  type FrameSize,
  type Material,
} from '@/lib/attributes';
import { type FrameDoc, isInStock } from '@/lib/product';

export const SORT_OPTIONS = [
  'recommended',
  'price-asc',
  'price-desc',
  'newest',
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export type ShopFilters = {
  faceShapes: FaceShape[];
  frameSizes: FrameSize[];
  materials: Material[];
  comfortFeatures: ComfortFeature[];
  categories: Category[];
  /** Inclusive MMK bounds. `null` means unbounded on that side. */
  minPrice: number | null;
  maxPrice: number | null;
  /** Hides colourways nobody can buy. */
  inStockOnly: boolean;
  /** Free-text over brand, frame code and name. */
  query: string;
};

export const EMPTY_FILTERS: ShopFilters = {
  faceShapes: [],
  frameSizes: [],
  materials: [],
  comfortFeatures: [],
  categories: [],
  minPrice: null,
  maxPrice: null,
  inStockOnly: false,
  query: '',
};

/** How many facets are narrowing the results, for the "clear all" badge. */
export function activeFilterCount(filters: ShopFilters): number {
  let count = 0;
  count += filters.faceShapes.length;
  count += filters.frameSizes.length;
  count += filters.materials.length;
  count += filters.comfortFeatures.length;
  count += filters.categories.length;
  if (filters.minPrice !== null || filters.maxPrice !== null) count += 1;
  if (filters.inStockOnly) count += 1;
  if (filters.query.trim()) count += 1;
  return count;
}

/* ── Matching ──────────────────────────────────────────────────────────────── */

/** True when `selected` is empty (no constraint) or shares any value with `values`. */
function matchesAny<T>(selected: T[], values: T[]): boolean {
  if (selected.length === 0) return true;
  return selected.some((option) => values.includes(option));
}

/** True when `selected` is empty, or `values` contains every selected item. */
function matchesAll<T>(selected: T[], values: T[]): boolean {
  if (selected.length === 0) return true;
  return selected.every((option) => values.includes(option));
}

export function matchesFilters(frame: FrameDoc, filters: ShopFilters): boolean {
  if (!frame.published) return false;

  if (!matchesAny(filters.faceShapes, frame.faceShapes)) return false;
  if (!matchesAny(filters.frameSizes, [frame.frameSize])) return false;
  if (!matchesAny(filters.materials, [frame.material])) return false;
  if (!matchesAny(filters.categories, frame.categories)) return false;

  // Requirements, not alternatives — see the note at the top of the file.
  if (!matchesAll(filters.comfortFeatures, frame.comfortFeatures)) return false;

  if (filters.minPrice !== null && frame.price < filters.minPrice) return false;
  if (filters.maxPrice !== null && frame.price > filters.maxPrice) return false;

  if (filters.inStockOnly && !isInStock(frame)) return false;

  const needle = filters.query.trim().toLowerCase();
  if (needle) {
    // C-numbers are searched too, because that is what a customer quotes from a
    // photo or a receipt — "do you still have C2 of the 2041?"
    const haystack = [
      frame.brand,
      frame.frameCode,
      frame.name,
      ...frame.variants.map((variant) => `${variant.cNumber} ${variant.colorName}`),
    ]
      .join(' ')
      .toLowerCase();

    if (!haystack.includes(needle)) return false;
  }

  return true;
}

/* ── Sorting ───────────────────────────────────────────────────────────────── */

/**
 * Sorts in place on a copy.
 *
 * Every comparator ends with an id tiebreak so the order is total. Without it,
 * two frames at the same price would sort differently between renders — which
 * looks like the grid shuffling itself for no reason.
 */
export function sortFrames(frames: FrameDoc[], sort: SortOption): FrameDoc[] {
  const sorted = [...frames];

  switch (sort) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
      break;

    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price || a.id.localeCompare(b.id));
      break;

    case 'newest':
      sorted.sort((a, b) => b.createdAtMs - a.createdAtMs || a.id.localeCompare(b.id));
      break;

    case 'recommended':
      /*
       * "Recommended" with no customer profile means: things people can buy, then
       * best sellers, then new, then newest. It is a merchandising default, not a
       * personalised one — the personalised ranking lives in `recommendFrames`
       * and has the customer's answers to work with.
       */
      sorted.sort((a, b) => {
        const stock = Number(isInStock(b)) - Number(isInStock(a));
        if (stock !== 0) return stock;

        const seller =
          Number(b.categories.includes('Best Seller')) -
          Number(a.categories.includes('Best Seller'));
        if (seller !== 0) return seller;

        const arrival =
          Number(b.categories.includes('New Arrival')) -
          Number(a.categories.includes('New Arrival'));
        if (arrival !== 0) return arrival;

        return b.createdAtMs - a.createdAtMs || a.id.localeCompare(b.id);
      });
      break;
  }

  return sorted;
}

export function applyShop(
  frames: FrameDoc[],
  filters: ShopFilters,
  sort: SortOption,
): FrameDoc[] {
  return sortFrames(
    frames.filter((frame) => matchesFilters(frame, filters)),
    sort,
  );
}

/* ── Facet counts ──────────────────────────────────────────────────────────── */

/**
 * How many frames each option would match, given the *other* filters.
 *
 * Excluding the facet's own selection is the important part: a Material count
 * computed with the material filter applied would show 0 next to every
 * unselected material, which tells the customer nothing and looks broken.
 */
export function facetCounts(
  frames: FrameDoc[],
  filters: ShopFilters,
): {
  faceShapes: Record<string, number>;
  frameSizes: Record<string, number>;
  materials: Record<string, number>;
  comfortFeatures: Record<string, number>;
  categories: Record<string, number>;
} {
  const count = <T extends string>(
    options: readonly T[],
    override: Partial<ShopFilters>,
    pick: (frame: FrameDoc) => T[],
  ): Record<string, number> => {
    const base = { ...filters, ...override };
    const pool = frames.filter((frame) => matchesFilters(frame, base));

    const result: Record<string, number> = {};
    for (const option of options) {
      result[option] = pool.filter((frame) => pick(frame).includes(option)).length;
    }
    return result;
  };

  return {
    faceShapes: count(FACE_SHAPES, { faceShapes: [] }, (f) => f.faceShapes),
    frameSizes: count(FRAME_SIZES, { frameSizes: [] }, (f) => [f.frameSize]),
    materials: count(MATERIALS, { materials: [] }, (f) => [f.material]),
    comfortFeatures: count(COMFORT_FEATURES, { comfortFeatures: [] }, (f) => f.comfortFeatures),
    categories: count(CATEGORIES, { categories: [] }, (f) => f.categories),
  };
}

/* ── URL serialisation ─────────────────────────────────────────────────────── */

/**
 * Filters live in the URL so a filtered view can be shared, bookmarked, and
 * survive the back button — and so the lookbook's `?frameCode=` deep link lands
 * on a pre-filtered shop rather than the whole catalogue.
 *
 * Only non-default values are written, keeping a plain `/shop` URL clean.
 */
export function filtersToParams(filters: ShopFilters, sort: SortOption): URLSearchParams {
  const params = new URLSearchParams();

  const list = (key: string, values: string[]) => {
    if (values.length > 0) params.set(key, values.join(','));
  };

  list('face', filters.faceShapes);
  list('size', filters.frameSizes);
  list('material', filters.materials);
  list('comfort', filters.comfortFeatures);
  list('category', filters.categories);

  if (filters.minPrice !== null) params.set('min', String(filters.minPrice));
  if (filters.maxPrice !== null) params.set('max', String(filters.maxPrice));
  if (filters.inStockOnly) params.set('stock', '1');
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (sort !== 'recommended') params.set('sort', sort);

  return params;
}

/**
 * Reads filters back out of a URL.
 *
 * Every value is validated against the allowed vocabulary, so a hand-edited or
 * stale link cannot inject a value that silently matches nothing. `frameCode` is
 * accepted as an alias for the search box, which is what makes the lookbook's
 * deep link work without a second concept.
 */
export function paramsToFilters(params: URLSearchParams): { filters: ShopFilters; sort: SortOption } {
  const list = <T extends string>(key: string, allowed: readonly T[]): T[] => {
    const raw = params.get(key);
    if (!raw) return [];
    const set = new Set<string>(allowed);
    return raw
      .split(',')
      .map((value) => value.trim())
      .filter((value): value is T => set.has(value));
  };

  const number = (key: string): number | null => {
    const raw = params.get(key);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : null;
  };

  const sortRaw = params.get('sort');
  const sort = (SORT_OPTIONS as readonly string[]).includes(sortRaw ?? '')
    ? (sortRaw as SortOption)
    : 'recommended';

  return {
    filters: {
      faceShapes: list('face', FACE_SHAPES),
      frameSizes: list('size', FRAME_SIZES),
      materials: list('material', MATERIALS),
      comfortFeatures: list('comfort', COMFORT_FEATURES),
      categories: list('category', CATEGORIES),
      minPrice: number('min'),
      maxPrice: number('max'),
      inStockOnly: params.get('stock') === '1',
      query: params.get('q') ?? params.get('frameCode') ?? '',
    },
    sort,
  };
}

/** Price bounds across a catalogue, for the range inputs' placeholders. */
export function priceBounds(frames: FrameDoc[]): { min: number; max: number } {
  const published = frames.filter((frame) => frame.published);
  if (published.length === 0) return { min: 0, max: 0 };

  const prices = published.map((frame) => frame.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
