/**
 * The frame catalogue schema, and the recommendation engine's scoring.
 *
 * Pure — no Firestore, no React — so the ranking can be reasoned about and
 * tested without a database. I/O lives in `src/lib/firestore/products.ts`.
 *
 * ── Shape of a frame ───────────────────────────────────────────────────────
 * A frame is one model (`frameCode`) that exists in several colours, and each
 * colour is a "C-number" with its own photos and video. That nesting is the
 * whole reason variants are a subdocument array rather than separate documents:
 * the customer shops for *a frame* and then picks a colour, so the product page
 * needs every colour in one read. Splitting them would mean a query per colour
 * to render a single page.
 *
 * Field names are chosen to match the Module 5 upload form exactly, so the admin
 * panel writes this shape directly with no mapping layer.
 */
import {
  type Category,
  type ComfortFeature,
  type FaceShape,
  type FrameSize,
  type Gender,
  type Material,
} from '@/lib/attributes';

/** Frames live here. Document id is a slug of brand + frame code. */
export const FRAMES_COLLECTION = 'frames';

/**
 * One colourway of a frame.
 *
 * `cNumber` is the shop's own colour code (C1, C2, …) and is what the customer
 * quotes when ordering over Telegram, so it is stored verbatim rather than
 * normalised into a colour name.
 */
export type FrameVariant = {
  cNumber: string;
  /** Human-readable colour, for accessible labels and the Telegram message. */
  colorName: string;
  /** CSS colour for the swatch dot. Hex or oklch — rendered, never parsed. */
  swatch: string;
  /**
   * At least two per the brief. Order matters: the first is the card thumbnail.
   */
  images: string[];
  /** Short clips showing reflections and frame thickness. May be empty. */
  videos: string[];
  /** False hides the colour from the shop without deleting its history. */
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
  /** MMK. Whole kyat — no minor unit in Myanmar retail. */
  price: number;
  /** Was-price for a markdown. Null when not discounted. */
  compareAtPrice: number | null;

  /**
   * Which face shapes this frame flatters. Plural because a frame genuinely
   * suits several — forcing one would make the recommender useless.
   */
  faceShapes: FaceShape[];
  categories: Category[];
  frameSize: FrameSize;
  material: Material;
  comfortFeatures: ComfortFeature[];

  /**
   * Who the frame is cut for. Derived from `categories` on upload rather than
   * entered separately, so the two can never contradict each other.
   */
  suitedFor: Gender[];

  variants: FrameVariant[];

  /** Free-text detail for the product page. */
  description: string;

  /** Sort key for "newest". Milliseconds since epoch, set by the uploader. */
  createdAtMs: number;
  /** Hides the frame from every customer-facing query. */
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

export function isInStock(frame: FrameDoc): boolean {
  return frame.variants.some((variant) => variant.inStock);
}

/**
 * A URL-safe document id from the brand and frame code.
 *
 * Deterministic on purpose: re-uploading the same frame code updates the
 * existing document instead of creating a near-duplicate that then shows up
 * twice in the shop.
 */
export function frameSlug(brand: string, frameCode: string): string {
  return `${brand}-${frameCode}`
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ── Recommendation scoring ────────────────────────────────────────────────── */

/** The answers the recommender reads. A subset of `MemberProfile`. */
export type RecommendationInput = {
  faceShape: FaceShape | null;
  frameSize: FrameSize | null;
  gender: Gender | null;
  age: number | null;
};

/** Why a frame was recommended, as translation-ready reason codes. */
export const MATCH_REASONS = [
  'faceShape',
  'frameSize',
  'gender',
  'ageRange',
  'bestSeller',
] as const;
export type MatchReason = (typeof MATCH_REASONS)[number];

export type ScoredFrame = {
  frame: FrameDoc;
  score: number;
  /** Which criteria this frame satisfied, for the "why we picked this" line. */
  reasons: MatchReason[];
  /**
   * True only when every answer the customer actually gave is satisfied.
   *
   * This is what separates "your matches" from "you might also like". Note it is
   * measured against *answered* questions — a customer who skipped frame size
   * can still get exact matches, rather than being told nothing fits.
   */
  isExactMatch: boolean;
};

/**
 * Points per criterion.
 *
 * Face shape outweighs everything else combined, which is deliberate: it is the
 * hardest thing for a customer to judge alone and the main reason they filled in
 * the form. Size matters next because a frame that does not fit is returned.
 * Gender and age are soft signals — useful tie-breakers, wrong often enough that
 * they must never override the geometry.
 */
const WEIGHTS: Record<MatchReason, number> = {
  faceShape: 50,
  frameSize: 25,
  gender: 10,
  ageRange: 5,
  bestSeller: 3,
};

/** Frame sizes in order, so "one step away" can be measured. */
const SIZE_ORDER: readonly FrameSize[] = [
  'Extra Small',
  'Small',
  'Medium',
  'Large',
  'Extra Large',
];

/**
 * How far apart two sizes are, in steps. `null` when either is `Custom`, which
 * sits outside the ordering rather than at one end of it.
 */
export function sizeDistance(a: FrameSize, b: FrameSize): number | null {
  const ia = SIZE_ORDER.indexOf(a);
  const ib = SIZE_ORDER.indexOf(b);
  if (ia === -1 || ib === -1) return null;
  return Math.abs(ia - ib);
}

/** Under-16s are shown Kid frames; the brief's category list has no finer split. */
const KID_MAX_AGE = 15;

/**
 * Scores one frame against a customer's answers.
 *
 * Adjacent sizes score partial credit rather than zero — telling someone with a
 * medium face that nothing exists because we only stocked small and large would
 * be technically accurate and commercially absurd.
 */
export function scoreFrame(frame: FrameDoc, input: RecommendationInput): ScoredFrame {
  const reasons: MatchReason[] = [];
  let score = 0;

  // Track which answered criteria were fully satisfied, for `isExactMatch`.
  let answered = 0;
  let satisfied = 0;

  if (input.faceShape) {
    answered += 1;
    if (frame.faceShapes.includes(input.faceShape)) {
      score += WEIGHTS.faceShape;
      reasons.push('faceShape');
      satisfied += 1;
    }
  }

  if (input.frameSize) {
    answered += 1;
    const distance = sizeDistance(frame.frameSize, input.frameSize);

    if (frame.frameSize === input.frameSize) {
      score += WEIGHTS.frameSize;
      reasons.push('frameSize');
      satisfied += 1;
    } else if (distance === 1) {
      // Half credit, and no reason recorded — we will not claim the size
      // matched when it did not.
      score += WEIGHTS.frameSize / 2;
    }
  }

  if (input.gender) {
    answered += 1;
    if (frame.suitedFor.includes(input.gender)) {
      score += WEIGHTS.gender;
      reasons.push('gender');
      satisfied += 1;
    } else if (input.gender === 'Other') {
      // No frame is "wrong" for someone who declined to say, so this criterion
      // simply does not apply — count it satisfied rather than penalising every
      // frame equally, which would only distort the ranking.
      satisfied += 1;
    }
  }

  if (input.age !== null) {
    answered += 1;
    const isKidFrame = frame.categories.includes('Kid');
    const isKid = input.age <= KID_MAX_AGE;

    if (isKid === isKidFrame) {
      score += WEIGHTS.ageRange;
      reasons.push('ageRange');
      satisfied += 1;
    }
    // An adult shown a kids' frame (or vice versa) scores nothing here and is
    // pushed down, but is not excluded outright — stock is finite.
  }

  // A gentle nudge, applied last so it only ever breaks ties.
  if (frame.categories.includes('Best Seller')) {
    score += WEIGHTS.bestSeller;
    reasons.push('bestSeller');
  }

  return {
    frame,
    score,
    reasons,
    // Face shape is the one criterion an exact match cannot do without: it is
    // the question the whole form exists to answer.
    isExactMatch:
      answered > 0 &&
      satisfied === answered &&
      (input.faceShape === null || reasons.includes('faceShape')),
  };
}

export type Recommendations = {
  /** Frames satisfying every answered criterion, best first. */
  exact: ScoredFrame[];
  /** Everything else worth showing, best first. */
  alternatives: ScoredFrame[];
};

/**
 * Ranks a catalogue against a customer's answers.
 *
 * @param frames Published frames to consider.
 * @param input  The customer's saved profile answers.
 * @param limit  Maximum frames per group.
 */
export function recommendFrames(
  frames: FrameDoc[],
  input: RecommendationInput,
  limit = 12,
): Recommendations {
  const scored = frames
    .filter((frame) => frame.published)
    .map((frame) => scoreFrame(frame, input))
    // Stable, fully-determined ordering: score, then stock (an in-stock frame
    // should never sit below one nobody can buy), then newest, then id — so the
    // same inputs always produce the same page.
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const stock = Number(isInStock(b.frame)) - Number(isInStock(a.frame));
      if (stock !== 0) return stock;
      if (b.frame.createdAtMs !== a.frame.createdAtMs) {
        return b.frame.createdAtMs - a.frame.createdAtMs;
      }
      return a.frame.id.localeCompare(b.frame.id);
    });

  return {
    exact: scored.filter((entry) => entry.isExactMatch).slice(0, limit),
    alternatives: scored.filter((entry) => !entry.isExactMatch).slice(0, limit),
  };
}
