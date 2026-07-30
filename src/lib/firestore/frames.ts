/**
 * Firestore reads for the frame catalogue.
 *
 * ── Why recommendations are ranked in the browser ──────────────────────────
 * `recommendFrames` sorts by a *computed* weighted score, and Firestore can
 * only order by stored fields. So the ranking cannot be a query, no matter how
 * the data is indexed — the choice is between fetching candidates and scoring
 * them here, or denormalising a score per customer into the database, which
 * would have to be recomputed for every customer whenever stock changes.
 *
 * Fetching and scoring in memory is therefore the design, not a shortcut. It
 * holds comfortably for a single optical shop's catalogue (hundreds of frames,
 * a few hundred kilobytes). Past a few thousand, the fix is to pre-filter on
 * face shape server-side and score the remainder — see `queryFramesByFaceShape`,
 * which is written and ready but needs a composite index before it is used.
 */
import {
  type Unsubscribe,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import {
  CATEGORIES,
  COMFORT_FEATURES,
  FACE_SHAPES,
  FRAME_SIZES,
  GENDERS,
  MATERIALS,
  type Category,
  type ComfortFeature,
  type FaceShape,
  type FrameSize,
  type Gender,
  type Material,
} from '@/lib/attributes';
import { FRAMES_COLLECTION, type FrameDoc, type FrameVariant } from '@/lib/product';

/**
 * Ceiling on a catalogue read.
 *
 * Not a page size — the recommender needs the whole catalogue to rank it. This
 * exists so a runaway import cannot turn one page load into a ten-thousand
 * document download.
 */
const MAX_CATALOGUE_READ = 500;

/* ── Normalisation ─────────────────────────────────────────────────────────── */

/**
 * Keeps only values in the allowed vocabulary.
 *
 * Admin uploads are the only writer, but a typo in a manual console edit or a
 * value removed from `attributes.ts` after data was written would otherwise
 * flow straight into filter logic and quietly match nothing. Dropping unknowns
 * at the boundary means the rest of the app can trust the union types.
 */
function keepKnown<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  const set = new Set<string>(allowed);
  return value.filter((entry): entry is T => typeof entry === 'string' && set.has(entry));
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeVariant(value: unknown): FrameVariant | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;

  const cNumber = asString(raw.cNumber).trim();
  // A variant without a C-number cannot be ordered over Telegram, which makes
  // it unsellable — so it is dropped rather than displayed.
  if (!cNumber) return null;

  const images = Array.isArray(raw.images)
    ? raw.images.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
    : [];
  const videos = Array.isArray(raw.videos)
    ? raw.videos.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
    : [];

  return {
    cNumber,
    colorName: asString(raw.colorName, cNumber),
    swatch: asString(raw.swatch, '#94a3b8'),
    images,
    videos,
    // Absent means available: stock flags arrived later than the first uploads,
    // and defaulting to hidden would silently empty the shop.
    inStock: raw.inStock !== false,
  };
}

function normalizeFrame(id: string, data: Record<string, unknown>): FrameDoc {
  const variants = Array.isArray(data.variants)
    ? data.variants.map(normalizeVariant).filter((v): v is FrameVariant => v !== null)
    : [];

  const frameSize = FRAME_SIZES.includes(data.frameSize as FrameSize)
    ? (data.frameSize as FrameSize)
    : 'Medium';

  const material = MATERIALS.includes(data.material as Material)
    ? (data.material as Material)
    : 'Plastic';

  const categories = keepKnown<Category>(data.categories, CATEGORIES);

  return {
    id,
    brand: asString(data.brand),
    frameCode: asString(data.frameCode),
    name: asString(data.name),
    price: asNumber(data.price),
    compareAtPrice:
      typeof data.compareAtPrice === 'number' && Number.isFinite(data.compareAtPrice)
        ? data.compareAtPrice
        : null,

    faceShapes: keepKnown<FaceShape>(data.faceShapes, FACE_SHAPES),
    categories,
    frameSize,
    material,
    comfortFeatures: keepKnown<ComfortFeature>(data.comfortFeatures, COMFORT_FEATURES),

    // Derived from categories when absent, so the two cannot disagree.
    suitedFor: (() => {
      const stored = keepKnown<Gender>(data.suitedFor, GENDERS);
      if (stored.length > 0) return stored;

      const derived: Gender[] = [];
      if (categories.includes('Men')) derived.push('Male');
      if (categories.includes('Women')) derived.push('Female');
      // A frame tagged for neither (unisex, or kids') suits anyone.
      return derived.length > 0 ? derived : [...GENDERS];
    })(),

    variants,
    description: asString(data.description),
    createdAtMs: asNumber(data.createdAtMs),
    published: data.published !== false,
  };
}

/* ── Reads ─────────────────────────────────────────────────────────────────── */

/**
 * The catalogue, newest first.
 *
 * `published` is filtered in memory rather than in the query on purpose:
 * combining an equality filter with `orderBy` on a different field requires a
 * composite index, and this read exists to feed a client-side recommender that
 * needs the documents anyway. Avoiding the index keeps setup to zero steps.
 */
export async function listFrames(max = MAX_CATALOGUE_READ): Promise<FrameDoc[]> {
  const snap = await getDocs(
    query(collection(db, FRAMES_COLLECTION), orderBy('createdAtMs', 'desc'), fbLimit(max)),
  );

  return snap.docs
    .map((d) => normalizeFrame(d.id, d.data()))
    .filter((frame) => frame.published);
}

export async function getFrame(id: string): Promise<FrameDoc | null> {
  const snap = await getDoc(doc(db, FRAMES_COLLECTION, id));
  return snap.exists() ? normalizeFrame(snap.id, snap.data()) : null;
}

/** Live catalogue subscription, for the admin grid in Module 5. */
export function subscribeToFrames(
  onChange: (frames: FrameDoc[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, FRAMES_COLLECTION), orderBy('createdAtMs', 'desc'), fbLimit(MAX_CATALOGUE_READ)),
    (snap) => onChange(snap.docs.map((d) => normalizeFrame(d.id, d.data()))),
    (error) => onError?.(error),
  );
}

/**
 * Server-side pre-filter by face shape.
 *
 * Unused today — `listFrames` plus in-memory scoring is cheaper at this
 * catalogue size, and this needs a composite index on
 * (`faceShapes` array-contains, `createdAtMs` desc) that Firestore will prompt
 * for on first run. Kept because it is the documented escape hatch when the
 * catalogue outgrows a full read, and writing it later under load is worse.
 */
export async function queryFramesByFaceShape(
  faceShape: FaceShape,
  max = 60,
): Promise<FrameDoc[]> {
  const snap = await getDocs(
    query(
      collection(db, FRAMES_COLLECTION),
      where('faceShapes', 'array-contains', faceShape),
      orderBy('createdAtMs', 'desc'),
      fbLimit(max),
    ),
  );

  return snap.docs
    .map((d) => normalizeFrame(d.id, d.data()))
    .filter((frame) => frame.published);
}
