/**
 * The POS's frames, on the website — one catalogue for both.
 *
 * ── Why a copy, not a live read ────────────────────────────────────────────
 * POS `products` carry landed cost, so the shared rules keep them away from
 * shops and from the public (see `firestore.rules`). The website's catalogue
 * is public. So the owner's session copies what a buyer may see — model,
 * colours, sizes, the standard price, whether it is in stock — into `frames`,
 * and never the cost. It runs automatically whenever the owner opens the
 * catalogue, and from the button on Admin → Frames.
 *
 * ── What it touches, and what it leaves alone ──────────────────────────────
 *   - A POS frame with no catalogue entry gets one, marked `source: 'POS'`,
 *     and a `posLinks` entry so it can be ordered on credit.
 *   - An entry it created before is refreshed from the POS (price, colours,
 *     stock) — keeping any photos already added to its colours.
 *   - An entry uploaded through the website with the same model number is
 *     only linked. Its photos and wording are the shop's and are never
 *     overwritten. Editing a POS-made entry in the upload form turns it into
 *     one of these, which is the way to take it out of the sync.
 *   - Accessories (cases, cloths) are not frames and are skipped.
 */
import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { POS_LINKS_COLLECTION, normalizeModelNo } from '@/lib/pos/catalog-link';
import { MAIN_LOCATION, POS } from '@/lib/pos/schema';
import { FRAMES_COLLECTION, frameSlug } from '@/lib/product';
import type { FrameCategory, FrameMaterial, FrameShape, StockStatus } from '@/lib/attributes';

/** Marks a catalogue entry this sync owns. */
export const POS_SOURCE = 'POS';

/** Firestore's cap is 500 writes per batch; stay well under it. */
const WRITES_PER_BATCH = 400;

/** At or below this many pieces a frame is shown as "low stock". */
const LOW_STOCK_AT = 10;

export type SyncReport = {
  /** New catalogue entries made from POS frames. */
  added: string[];
  /** POS-made entries refreshed because the POS changed. */
  updated: string[];
  /** Website-uploaded entries matched to their POS product. */
  linked: string[];
  /** Model numbers matching more than one entry — left for a person. */
  ambiguous: string[];
};

/* ── POS → catalogue vocabulary ────────────────────────────────────────────── */

function category(gender: unknown): FrameCategory {
  switch (String(gender ?? '').toUpperCase()) {
    case 'MEN':
    case 'MALE':
      return 'Male';
    case 'WOMEN':
    case 'FEMALE':
      return 'Female';
    case 'KIDS':
      return 'Kids';
    default:
      return 'Unisex';
  }
}

function material(value: unknown, line: unknown): FrameMaterial {
  const text = `${value ?? ''} ${line ?? ''}`.toUpperCase();
  if (text.includes('COMBO')) return 'Combo';
  if (text.includes('TITAN') || text.includes('TIT')) return 'Titanium';
  if (text.includes('TR90') || text.includes('TR-90')) return 'TR90';
  if (text.includes('ACETATE') || text.includes('ကော်')) return 'Acetate';
  return 'Metal';
}

function shape(value: unknown): FrameShape {
  switch (String(value ?? '').toUpperCase()) {
    case 'ROUND':
      return 'Round';
    case 'SQUARE':
      return 'Square';
    case 'AVIATOR':
      return 'Aviator';
    case 'CAT_EYE':
    case 'CAT-EYE':
      return 'Cat-Eye';
    case 'GEOMETRIC':
      return 'Geometric';
    default:
      return 'Rectangle';
  }
}

function stockStatus(pieces: number): StockStatus {
  if (pieces <= 0) return 'pre-order';
  return pieces <= LOW_STOCK_AT ? 'low-stock' : 'in-stock';
}

const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const str = (value: unknown) => (typeof value === 'string' ? value : '');

type ExistingFrame = { id: string; data: DocumentData };

/**
 * One catalogue entry from one POS product. Photos already attached to a
 * colour of an earlier copy are carried over, matched by C-number.
 */
function frameFromProduct(
  product: DocumentData,
  variants: DocumentData[],
  previous: DocumentData | null,
) {
  const previousImages = new Map<string, { images: string[]; videos: string[] }>();
  for (const v of (previous?.variants as DocumentData[] | undefined) ?? []) {
    previousImages.set(str(v.cNumber).toUpperCase(), {
      images: Array.isArray(v.images) ? v.images : [],
      videos: Array.isArray(v.videos) ? v.videos : [],
    });
  }

  const colours = variants
    .map((v) => {
      const code = str(v.colorCode) || str(v.id);
      const onHand = num((v.stock as Record<string, unknown> | undefined)?.[MAIN_LOCATION]);
      const media = previousImages.get(code.toUpperCase());
      return {
        cNumber: code,
        colorName: str(v.colorName) || code,
        swatch: str(v.hex) || '#9ca3af',
        images: media?.images ?? [],
        videos: media?.videos ?? [],
        inStock: onHand > 0,
        onHand,
      };
    })
    .sort((a, b) => a.cNumber.localeCompare(b.cNumber, undefined, { numeric: true }));

  const pieces = colours.reduce((sum, c) => sum + c.onHand, 0);
  const size = (product.size ?? {}) as Record<string, unknown>;
  const pricing = (product.pricing ?? {}) as Record<string, unknown>;

  return {
    brand: str(product.brand) || 'Plan B',
    frameCode: str(product.modelNo),
    name: str(previous?.name),
    wholesalePrice: num(pricing.STANDARD),
    category: category(product.gender),
    material: material(product.material, product.line),
    shape: shape(product.shape),
    stockStatus: stockStatus(pieces),
    dimensions: {
      lensWidth: num(size.lens),
      bridge: num(size.bridge),
      templeLength: num(size.temple),
    },
    weightGrams: null,
    variants: colours.map(({ onHand: _onHand, ...colour }) => colour),
    description: str(previous?.description),
    includesCase: Boolean((product.bundle as Record<string, unknown> | null)?.caseProductId),
    bestSeller: previous?.bestSeller === true,
    createdAtMs: num(previous?.createdAtMs) || Date.now(),
    published: previous ? previous.published !== false : true,
    source: POS_SOURCE,
  };
}

/** Enough of an entry to tell whether a refresh would change anything. */
function signature(frame: DocumentData): string {
  return JSON.stringify([
    frame.wholesalePrice,
    frame.stockStatus,
    frame.material,
    frame.shape,
    frame.category,
    frame.includesCase,
    frame.dimensions,
    ((frame.variants as DocumentData[] | undefined) ?? []).map((v) => [
      v.cNumber,
      v.colorName,
      v.swatch,
      v.inStock,
      (v.images as unknown[] | undefined)?.length ?? 0,
    ]),
  ]);
}

/**
 * Brings the website catalogue up to date with the POS.
 *
 * Needs an account the rules let read POS products: a POS `ADMIN`, or the
 * owner's bootstrap email. Anyone else is refused at the first read, which
 * rejects the promise — callers treat that as "nothing to sync from here".
 */
export async function syncCatalogueFromPos(): Promise<SyncReport> {
  const [productSnap, variantSnap, frameSnap, linkSnap] = await Promise.all([
    getDocs(collection(db, POS.products)),
    getDocs(collectionGroup(db, POS.variants)),
    getDocs(collection(db, FRAMES_COLLECTION)),
    getDocs(collection(db, POS_LINKS_COLLECTION)),
  ]);

  const linkedProduct = new Map(linkSnap.docs.map((l) => [l.id, str(l.get('productId'))]));

  const variantsByProduct = new Map<string, DocumentData[]>();
  for (const v of variantSnap.docs) {
    const productId = v.ref.parent.parent?.id;
    if (!productId) continue;
    variantsByProduct.set(productId, [
      ...(variantsByProduct.get(productId) ?? []),
      { id: v.id, ...v.data() },
    ]);
  }

  const framesByModel = new Map<string, ExistingFrame[]>();
  for (const f of frameSnap.docs) {
    const key = normalizeModelNo(str(f.get('frameCode')));
    if (!key) continue;
    framesByModel.set(key, [...(framesByModel.get(key) ?? []), { id: f.id, data: f.data() }]);
  }

  const report: SyncReport = { added: [], updated: [], linked: [], ambiguous: [] };
  const writes: ((batch: ReturnType<typeof writeBatch>) => void)[] = [];

  for (const product of productSnap.docs) {
    const data = product.data();
    if (data.active === false) continue;
    const kind = str(data.category).toUpperCase();
    if (kind && kind !== 'FRAME') continue;

    const modelNo = str(data.modelNo);
    const key = normalizeModelNo(modelNo);
    if (!key) continue;

    const matches = framesByModel.get(key) ?? [];
    if (matches.length > 1) {
      report.ambiguous.push(modelNo);
      continue;
    }

    const existing = matches[0] ?? null;
    const link = (frameId: string) => (batch: ReturnType<typeof writeBatch>) =>
      batch.set(doc(db, POS_LINKS_COLLECTION, frameId), {
        productId: product.id,
        frameCode: modelNo,
        linkedAt: serverTimestamp(),
      });

    // Uploaded through the website: the shop's own entry. Link, never touch.
    if (existing && existing.data.source !== POS_SOURCE) {
      if (linkedProduct.get(existing.id) !== product.id) {
        writes.push(link(existing.id));
        report.linked.push(modelNo);
      }
      continue;
    }

    const next = frameFromProduct(data, variantsByProduct.get(product.id) ?? [], existing?.data ?? null);
    if (existing && signature(existing.data) === signature(next)) continue;

    const frameId = existing?.id ?? frameSlug(next.brand, next.frameCode);
    writes.push((batch) =>
      batch.set(doc(db, FRAMES_COLLECTION, frameId), { ...next, updatedAt: serverTimestamp() }),
    );
    writes.push(link(frameId));
    (existing ? report.updated : report.added).push(modelNo);
  }

  for (let i = 0; i < writes.length; i += WRITES_PER_BATCH) {
    const batch = writeBatch(db);
    for (const write of writes.slice(i, i + WRITES_PER_BATCH)) write(batch);
    await batch.commit();
  }

  return report;
}
