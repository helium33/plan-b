/**
 * Firestore reads for the wholesale frame catalogue.
 *
 * The whole catalogue is fetched in one read and filtered in the browser. That
 * is the design, not a shortcut: a wholesale buyer flips between the category and
 * material chips constantly while deciding, and a round trip per chip would make
 * the app feel like a website instead of a catalogue. One read of a few hundred
 * documents holds comfortably for a single distributor's range.
 *
 * ── Normalisation is doing real work here ──────────────────────────────────
 * `normalizeFrame` is the only place that knows the retail schema this catalogue
 * grew out of. Documents written before the wholesale pivot carry `price`,
 * `categories: ['Men', …]` and materials like `Acetate`; they are mapped forward
 * on every read so an existing catalogue keeps working without a migration job
 * anyone has to remember to run.
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
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import {
  FRAME_CATEGORIES,
  categoryFromLegacyTags,
  materialFromLegacy,
  shapeFromStored,
  stockStatusFromStored,
  type FrameCategory,
} from '@/lib/attributes';
import {
  FRAMES_COLLECTION,
  type FrameDimensions,
  type FrameDoc,
  type FrameVariant,
} from '@/lib/product';

/**
 * Ceiling on a catalogue read.
 *
 * Not a page size — the filters need the whole range to filter it. This exists
 * so a runaway import cannot turn one page load into a ten-thousand document
 * download.
 */
const MAX_CATALOGUE_READ = 500;

/* ── Normalisation ─────────────────────────────────────────────────────────── */

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
  // A variant without a C-number cannot be ordered, which makes it unsellable —
  // so it is dropped rather than displayed.
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
    // and defaulting to hidden would silently empty the catalogue.
    inStock: raw.inStock !== false,
  };
}

/**
 * Reads the frame's shelf.
 *
 * Prefers the wholesale `category` field, falling back to the retail
 * `categories` tag array. Written this way round so that once a frame is
 * re-saved through the admin form its stored value wins outright and the legacy
 * path stops being consulted for it.
 */
function readCategory(data: Record<string, unknown>): FrameCategory {
  const stored = data.category;
  if (typeof stored === 'string' && (FRAME_CATEGORIES as readonly string[]).includes(stored)) {
    return stored as FrameCategory;
  }

  const legacy = Array.isArray(data.categories)
    ? data.categories.filter((tag): tag is string => typeof tag === 'string')
    : [];

  return categoryFromLegacyTags(legacy);
}

/**
 * Reads the millimetre measurements.
 *
 * Accepts the nested object the upload form writes, and also a flat
 * `"52-18-142"` string — some early frames carried the measurements in the
 * description and were migrated by hand into that shape, which is the form a
 * person naturally types.
 */
function readDimensions(value: unknown): FrameDimensions {
  if (typeof value === 'string') {
    const parts = value.split(/[^0-9]+/).filter(Boolean).map(Number);
    if (parts.length === 3) {
      return { lensWidth: parts[0], bridge: parts[1], templeLength: parts[2] };
    }
    return { lensWidth: 0, bridge: 0, templeLength: 0 };
  }

  if (typeof value !== 'object' || value === null) {
    return { lensWidth: 0, bridge: 0, templeLength: 0 };
  }

  const raw = value as Record<string, unknown>;
  return {
    lensWidth: asNumber(raw.lensWidth),
    bridge: asNumber(raw.bridge),
    templeLength: asNumber(raw.templeLength),
  };
}

function normalizeFrame(id: string, data: Record<string, unknown>): FrameDoc {
  const variants = Array.isArray(data.variants)
    ? data.variants.map(normalizeVariant).filter((v): v is FrameVariant => v !== null)
    : [];

  return {
    id,
    brand: asString(data.brand),
    frameCode: asString(data.frameCode),
    name: asString(data.name),

    // `price` is the retail field name. Reading it as a fallback means a
    // pre-pivot catalogue prices at its old figure rather than at zero — visibly
    // wrong beats invisibly free.
    wholesalePrice: asNumber(data.wholesalePrice) || asNumber(data.price),

    category: readCategory(data),
    material: materialFromLegacy(data.material),
    shape: shapeFromStored(data.shape),
    stockStatus: stockStatusFromStored(data.stockStatus),

    dimensions: readDimensions(data.dimensions),
    // Zero means unweighed, not weightless — a frame that genuinely weighs
    // nothing does not exist, so the falsy case is the missing case.
    weightGrams: asNumber(data.weightGrams) || null,

    variants,
    description: asString(data.description),

    // Both default to false for documents written before these fields existed.
    // Absent has to mean "no" for each: claiming a case the shop never packs, or
    // filling the Best Sellers shelf with the whole catalogue, are the two ways
    // defaulting to true would go wrong.
    includesCase: data.includesCase === true,
    bestSeller: data.bestSeller === true,

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
 * composite index, and this read fetches the documents anyway. Avoiding the
 * index keeps first-run setup to zero steps.
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

/** Live catalogue subscription, for the admin grid. Includes unpublished frames. */
export function subscribeToFrames(
  onChange: (frames: FrameDoc[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, FRAMES_COLLECTION),
      orderBy('createdAtMs', 'desc'),
      fbLimit(MAX_CATALOGUE_READ),
    ),
    (snap) => onChange(snap.docs.map((d) => normalizeFrame(d.id, d.data()))),
    (error) => onError?.(error),
  );
}
