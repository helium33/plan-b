/**
 * The two controlled vocabularies the wholesale catalogue filters on.
 *
 * These live in one file because the admin upload form writes them and the
 * catalogue filters read them. A material offered in the uploader but spelled
 * differently in the filter produces a chip that silently matches nothing — and
 * that bug is invisible until a shop owner notices an empty catalogue. Defining
 * each list once, `as const`, makes a mismatch a TypeScript error instead.
 *
 * The values are the exact strings stored in Firestore. Labels are *not* here:
 * they are translated through `t('attributes.…')` so the same stored value can
 * render in English or Burmese.
 */

/**
 * Who the frame is cut for.
 *
 * Single-valued, unlike the retail schema's tag list. A wholesale buyer filling
 * a shelf asks "show me the men's frames", not "show me frames tagged men among
 * other things" — so one frame belongs to exactly one shelf, and `Unisex` is a
 * real answer rather than the absence of one.
 */
export const FRAME_CATEGORIES = ['Male', 'Female', 'Kids', 'Unisex'] as const;
export type FrameCategory = (typeof FRAME_CATEGORIES)[number];

/**
 * Frame material, in the trade's own terms.
 *
 * `Combo` is acetate-front-with-titanium-temples (ကော် + Tit); `Metal` covers
 * plain alloy stock (သံ), which used to be a separate `Iron` value until the
 * shop clarified the two were never actually distinguished at the counter —
 * "Iron" and "Metal" were the same shelf. `Acetate` is the opposite of Combo:
 * a fully plastic frame, front *and* temples, with no metal or titanium in it
 * at all (ကော် သီးသန့်). These are how the frames are actually ordered over
 * the counter, which is why they appear here instead of a materials-science
 * list.
 */
export const FRAME_MATERIALS = ['Titanium', 'Metal', 'TR90', 'Combo', 'Acetate'] as const;
export type FrameMaterial = (typeof FRAME_MATERIALS)[number];

/**
 * The frame's silhouette.
 *
 * Kept separate from material because a buyer shops across both axes — "the
 * titanium rectangles" is a normal request and neither filter alone answers it.
 * `Geometric` is the catch-all for hexagons, octagons and the angular shapes
 * that arrive under a dozen different factory names; without it every one of
 * those would need its own value and the filter row would stop fitting.
 */
export const FRAME_SHAPES = [
  'Round',
  'Square',
  'Rectangle',
  'Aviator',
  'Cat-Eye',
  'Geometric',
] as const;
export type FrameShape = (typeof FRAME_SHAPES)[number];

/**
 * How available the model is, as the shop would say it over the counter.
 *
 * This is a *stated* fact, not a derived one. It cannot be computed from the
 * variant `inStock` flags: those say which colours exist to be ordered, whereas
 * "low stock" is the shop's judgement that the remaining boxes will not cover a
 * big order, and "pre-order" means the container has not landed yet. Both are
 * things only the person who counted the shelf knows.
 */
export const STOCK_STATUSES = ['in-stock', 'low-stock', 'pre-order'] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

/**
 * Badge colours, as Tailwind classes.
 *
 * Green / orange / blue, per the brief. Kept beside the vocabulary so a new
 * status cannot be added without someone deciding what colour it is — the
 * alternative is a `switch` in a component that silently renders nothing.
 */
export const STOCK_STATUS_CLASSES: Record<StockStatus, string> = {
  'in-stock':
    'border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400',
  'low-stock': 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400',
  'pre-order': 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

export function stockStatusFromStored(value: unknown): StockStatus {
  // Frames uploaded before this field existed are assumed available — the
  // catalogue only ever held sellable stock, and defaulting to "pre-order"
  // would tell buyers a whole existing range had not arrived.
  return typeof value === 'string' && (STOCK_STATUSES as readonly string[]).includes(value)
    ? (value as StockStatus)
    : 'in-stock';
}

/**
 * Translation-key helpers.
 *
 * `t(categoryKey('Kids'))` resolves to `attributes.category.Kids`. The template
 * literal is returned `as const` so its type is the *literal* key path, which
 * means the typed `t()` still rejects it if the locale file is missing that
 * entry — the type safety survives the indirection.
 */
export const categoryKey = (v: FrameCategory) => `attributes.category.${v}` as const;
export const materialKey = (v: FrameMaterial) => `attributes.material.${v}` as const;
export const shapeKey = (v: FrameShape) => `attributes.shape.${v}` as const;
export const stockStatusKey = (v: StockStatus) => `attributes.stock.${v}` as const;

/* ── Legacy migration ──────────────────────────────────────────────────────── */

/**
 * Retail category tags → one wholesale shelf.
 *
 * Frames uploaded under the retail schema stored `categories: ['Men', 'Best
 * Seller']`. Rather than orphan that data — a shop that seeded a catalogue last
 * month would open the app to an empty grid — every read maps it forward.
 * Merchandising tags (`New Arrival`, `Best Seller`) carry no gender and are
 * simply ignored here.
 */
export function categoryFromLegacyTags(tags: readonly string[]): FrameCategory {
  const has = (tag: string) => tags.includes(tag);

  if (has('Kid') || has('Kids')) return 'Kids';
  // Tagged for both, or for neither: one shelf, stocked for anyone.
  if (has('Men') && has('Women')) return 'Unisex';
  if (has('Men')) return 'Male';
  if (has('Women')) return 'Female';
  return 'Unisex';
}

/**
 * Retail material names → the wholesale five.
 *
 * `Plastic` and `Eco-friendly` both become TR90, which is the injection-moulded
 * plastic the trade actually stocks. `Acetate` needs no entry here at all —
 * it is now a real value in `FRAME_MATERIALS`, so `materialFromLegacy` matches
 * it directly before this map is ever consulted. `Iron` and `Alloy` are the
 * genuine legacy cases: both name a value this vocabulary no longer has, and
 * both mean `Metal`. Anything else unrecognised falls to `Metal` too — the
 * commonest stock — rather than being dropped, because a frame that matches no
 * material filter is a frame nobody can find.
 */
const LEGACY_MATERIALS: Record<string, FrameMaterial> = {
  Plastic: 'TR90',
  'Eco-friendly': 'TR90',
  // Alloy used to map to the now-removed `Iron` value; `Metal` is its
  // successor, not a fallback — the two were never a real distinction.
  Alloy: 'Metal',
  Iron: 'Metal',
};

export function materialFromLegacy(value: unknown): FrameMaterial {
  if (typeof value !== 'string') return 'Metal';
  if ((FRAME_MATERIALS as readonly string[]).includes(value)) return value as FrameMaterial;
  return LEGACY_MATERIALS[value] ?? 'Metal';
}

/**
 * Reads a stored shape, falling back to `Rectangle`.
 *
 * Shape arrived after the first uploads, so most existing documents have no
 * value at all. `Rectangle` is the default because it is the commonest stock
 * silhouette by a wide margin — a wrong-but-plausible shape keeps the frame
 * findable, where dropping it from the filter entirely would hide it.
 */
export function shapeFromStored(value: unknown): FrameShape {
  return typeof value === 'string' && (FRAME_SHAPES as readonly string[]).includes(value)
    ? (value as FrameShape)
    : 'Rectangle';
}
