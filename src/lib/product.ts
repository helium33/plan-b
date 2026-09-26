/**
 * The wholesale frame catalogue schema.
 *
 * Pure — no Firestore, no React — so the shape can be reasoned about without a
 * database. I/O lives in `src/lib/firestore/frames.ts`.
 *
 * ── Shape of a frame ───────────────────────────────────────────────────────
 * A frame is one model (`frameCode`) that exists in several colours, and each
 * colour is a "C-number" with its own photos. That nesting is the whole reason
 * variants are a subdocument array rather than separate documents: a wholesale
 * buyer orders *a model* and then splits the quantity across its colours, so the
 * order card needs every colour in one read. Splitting them would mean a query
 * per colour to render a single card — and a full C-set discount that could not
 * be computed without one.
 *
 * Field names match the admin upload form exactly, so the panel writes this
 * shape directly with no mapping layer.
 */
import type { FrameCategory, FrameMaterial, FrameShape, StockStatus } from '@/lib/attributes';

/** Frames live here. Document id is a slug of brand + frame code. */
export const FRAMES_COLLECTION = 'frames';

/**
 * The three numbers stamped inside every temple arm, in millimetres.
 *
 * Stored as separate fields rather than the printed `52-18-142` string because
 * they are numbers a buyer compares — "anything wider than 54" is a real
 * question — and re-parsing a display string every time it is needed is how
 * that comparison ends up subtly wrong for the one frame written `52 - 18`.
 */
export type FrameDimensions = {
  /** Lens width. The first number, and the one people quote alone. */
  lensWidth: number;
  /** Bridge width — the gap between lenses. */
  bridge: number;
  /** Temple arm length. */
  templeLength: number;
};

export const EMPTY_DIMENSIONS: FrameDimensions = { lensWidth: 0, bridge: 0, templeLength: 0 };

/**
 * `52-18-142`, or `null` when the frame was uploaded without measurements.
 *
 * Returns null rather than `0-0-0` so callers render nothing instead of a
 * specification that reads as real and is entirely false.
 */
export function formatDimensions(dimensions: FrameDimensions): string | null {
  const { lensWidth, bridge, templeLength } = dimensions;
  if (lensWidth <= 0 || bridge <= 0 || templeLength <= 0) return null;
  return `${lensWidth}-${bridge}-${templeLength}`;
}

/**
 * One colourway of a frame.
 *
 * `cNumber` is the factory's own colour code (C1, C2, …) and is what the buyer
 * quotes on the order, so it is stored verbatim rather than normalised into a
 * colour name.
 */
export type FrameVariant = {
  cNumber: string;
  /** Human-readable colour, for accessible labels and the order message. */
  colorName: string;
  /** CSS colour for the swatch dot. Hex or oklch — rendered, never parsed. */
  swatch: string;
  /** Order matters: the first is the card thumbnail. */
  images: string[];
  /** Short clips showing reflections and frame thickness. May be empty. */
  videos: string[];
  /** False hides the colour from the catalogue without deleting its history. */
  inStock: boolean;
};

export type FrameDoc = {
  /** Slug id, mirrored into the document so a query result is self-describing. */
  id: string;

  brand: string;
  /** The model code on the temple arm, e.g. `PBV-2041`. */
  frameCode: string;
  /** Display name. Falls back to `${brand} ${frameCode}` when blank. */
  name: string;

  /**
   * Trade price for **one piece**, in whole kyat.
   *
   * Per-piece rather than per-dozen even though the trade quotes dozens, because
   * every discount in `wholesale.ts` is a percentage of a line total and a
   * per-dozen base would need dividing back out at each step. The catalogue
   * displays a dozen price alongside it where that is the more familiar number.
   */
  wholesalePrice: number;

  category: FrameCategory;
  material: FrameMaterial;
  shape: FrameShape;
  /** What the shop tells buyers about availability. Set by hand on upload. */
  stockStatus: StockStatus;

  /** Millimetres. Zeroed when the frame was uploaded without measurements. */
  dimensions: FrameDimensions;
  /** Grams. `null` when unweighed — distinct from a genuine 0, which is absurd. */
  weightGrams: number | null;

  variants: FrameVariant[];

  /** Free-text detail — hinge type, lens width, packing notes. */
  description: string;

  /**
   * Whether a case and the usual accessories ship with the frame.
   *
   * Buyers ask this on nearly every order, because it changes what they can
   * charge in their own shop. Storing it as a flag rather than leaving it to the
   * description means the answer is on the card, not buried in a paragraph that
   * may not mention it at all.
   */
  includesCase: boolean;

  /**
   * Staff's pick for the "Best Sellers" shelf.
   *
   * There is no sales figure behind this and it does not pretend otherwise: the
   * app never sees what the shop actually shifts, since orders leave over
   * Telegram and are settled off-platform. It is an editorial choice the shop
   * makes in the admin panel, which is the only honest thing it can be here.
   */
  bestSeller: boolean;

  /** Sort key for "newest". Milliseconds since epoch, set by the uploader. */
  createdAtMs: number;
  /** Hides the frame from every buyer-facing query. */
  published: boolean;
};

/* ── Derived helpers ───────────────────────────────────────────────────────── */

export function frameDisplayName(frame: FrameDoc): string {
  return frame.name.trim() || `${frame.brand} ${frame.frameCode}`.trim();
}

/** The image a card should show, or `null` when the upload has no media yet. */
export function primaryImage(frame: FrameDoc): string | null {
  for (const variant of frame.variants) {
    if (variant.images.length > 0) return variant.images[0];
  }
  return null;
}

/**
 * The colours a buyer may actually order.
 *
 * Everything downstream — the quantity steppers, the full-set discount test, the
 * order message — works from this list rather than `frame.variants`, so an
 * out-of-stock colour cannot be ordered *and* cannot block a full-set discount by
 * being permanently unbuyable.
 */
export function orderableVariants(frame: FrameDoc): FrameVariant[] {
  return frame.variants.filter((variant) => variant.inStock);
}

export function isInStock(frame: FrameDoc): boolean {
  return frame.variants.some((variant) => variant.inStock);
}

/**
 * How long a frame counts as newly arrived.
 *
 * Derived from `createdAtMs` rather than stored as a flag, because "new" is the
 * one shelf that stops being true on its own. A flag would need un-setting by
 * hand on every frame, and the shelf a busy shop forgets to clear is a shelf
 * that quietly starts lying.
 */
export const NEW_ARRIVAL_WINDOW_DAYS = 45;

/**
 * The most of the catalogue that may be "new" before the label stops meaning
 * anything.
 *
 * A shop that uploads its whole range in one sitting — which is exactly what
 * happens on day one, and after every seasonal re-shoot — would otherwise have
 * every frame badged NEW and a New Arrivals shelf that is just the catalogue
 * again in a shorter row. Past this share, there is no news to report and the
 * shelf disappears entirely rather than shouting at every card.
 */
const NEW_ARRIVAL_MAX_SHARE = 0.5;

/** Never more than this many, even when the window and the share both allow it. */
const NEW_ARRIVAL_LIMIT = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The frames worth calling new, newest first — or nothing at all.
 *
 * Takes the whole catalogue rather than one frame because "new" is a claim
 * about a frame *relative to the others*, and a per-frame predicate cannot see
 * enough to know when it has stopped being informative. It is also the single
 * source for both the shelf and the card badge, so the two cannot disagree
 * about which frames qualify.
 *
 * @param frames Assumed newest-first, as `listFrames` returns them.
 */
export function selectNewArrivals(frames: readonly FrameDoc[], now = Date.now()): FrameDoc[] {
  if (frames.length === 0) return [];

  const fresh = frames.filter(
    // A zero timestamp is an upload that never recorded one, not a frame that
    // arrived at the epoch — treat it as undated rather than as ancient.
    (frame) => frame.createdAtMs > 0 && now - frame.createdAtMs <= NEW_ARRIVAL_WINDOW_DAYS * DAY_MS,
  );

  if (fresh.length > frames.length * NEW_ARRIVAL_MAX_SHARE) return [];

  return fresh.slice(0, NEW_ARRIVAL_LIMIT);
}

/**
 * A URL-safe document id from the brand and frame code.
 *
 * Deterministic on purpose: re-uploading the same frame code updates the
 * existing document instead of creating a near-duplicate that then shows up
 * twice in the catalogue.
 */
export function frameSlug(brand: string, frameCode: string): string {
  return `${brand}-${frameCode}`
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
