/**
 * Which POS product a catalogue frame is.
 *
 * ── Two catalogues, one warehouse ──────────────────────────────────────────
 * This app's `frames` are what a buyer looks at: photos, colours, a price. The
 * POS's `products/{id}/variants/{colorCode}` are what the warehouse counts. A
 * web order has to decrement the second while showing the first, so each frame
 * needs to know its POS product. The model number on the temple arm is the
 * shared key — `frames.frameCode` here, `products.modelNo` there — and a
 * frame's C-numbers are the POS's colour codes.
 *
 * ── Why the link is stored, not looked up each time ────────────────────────
 * Looking a frame up by model number means querying `products`, and a product
 * document carries the landed cost. Shops must never be able to read that, so
 * the rules keep `products` staff-only — and a shop's order therefore cannot
 * run that query. Instead an admin links the catalogue once
 * (`linkCatalogueToPos`, from the admin frames page) and `posLinks/{frameId}`
 * holds nothing but the product id. Variants — stock only, no cost — stay
 * readable, which is all an order needs.
 *
 * The link lives in its own collection rather than as a field on the frame
 * because `saveFrame` overwrites the whole frame document: a field the upload
 * form does not know about would be wiped by the next edit.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { MAIN_LOCATION, POS } from '@/lib/pos/schema';
import type { FrameDoc } from '@/lib/product';

export const POS_LINKS_COLLECTION = 'posLinks';

/** `AU-505`, `au 505` and `AU505` are the same model to a person. */
export function normalizeModelNo(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/* ── Linking (admin) ───────────────────────────────────────────────────────── */

export type LinkReport = {
  linked: string[];
  /** Frame codes with no POS product of that model number. */
  missing: string[];
  /** Frame codes matching more than one POS product — linked by hand, not guessed. */
  ambiguous: string[];
};

/**
 * Matches every frame to its POS product by model number and records the link.
 *
 * Needs an account the rules let read `products` — a POS `ADMIN`. An ambiguous
 * match is reported rather than resolved: decrementing the wrong product's
 * stock would be worse than a frame that cannot be ordered on credit yet.
 */
export async function linkCatalogueToPos(frames: readonly FrameDoc[]): Promise<LinkReport> {
  const snap = await getDocs(query(collection(db, POS.products), where('active', '==', true)));

  const byModel = new Map<string, string[]>();
  for (const product of snap.docs) {
    const modelNo = product.get('modelNo');
    if (typeof modelNo !== 'string' || !modelNo) continue;
    const key = normalizeModelNo(modelNo);
    byModel.set(key, [...(byModel.get(key) ?? []), product.id]);
  }

  const report: LinkReport = { linked: [], missing: [], ambiguous: [] };
  const batch = writeBatch(db);

  for (const frame of frames) {
    const matches = byModel.get(normalizeModelNo(frame.frameCode)) ?? [];
    if (matches.length === 0) {
      report.missing.push(frame.frameCode);
    } else if (matches.length > 1) {
      report.ambiguous.push(frame.frameCode);
    } else {
      batch.set(doc(db, POS_LINKS_COLLECTION, frame.id), {
        productId: matches[0],
        frameCode: frame.frameCode,
        linkedAt: serverTimestamp(),
      });
      report.linked.push(frame.frameCode);
    }
  }

  // One batch holds 500 writes; a wholesale range is a few dozen models.
  if (report.linked.length > 0) await batch.commit();
  return report;
}

/* ── Resolving an order (any buyer) ────────────────────────────────────────── */

export type ResolvedLine = {
  frameId: string;
  productId: string;
  modelNo: string;
  /** The POS's colour code — the variant document id. */
  colorCode: string;
  colorName: string;
  qty: number;
  /** Per piece, whole kyat — the catalogue price the buyer was shown. */
  unitPrice: number;
  /** Sellable pieces at `LOC-MAIN` when this was read. */
  available: number;
};

export type ResolveFailure =
  | { code: 'NOT_LINKED'; frameCode: string }
  | { code: 'COLOUR_NOT_IN_POS'; frameCode: string; cNumber: string };

export type OrderLineInput = {
  frame: FrameDoc;
  entries: { cNumber: string; qty: number }[];
};

async function productIdFor(frame: FrameDoc, canReadProducts: boolean): Promise<string | null> {
  const link = await getDoc(doc(db, POS_LINKS_COLLECTION, frame.id));
  const linked = link.get('productId');
  if (typeof linked === 'string' && linked) return linked;

  // Staff may fall back to a live lookup — the rules let them read products.
  // A shop may not, and must wait for the admin to link the catalogue.
  if (!canReadProducts) return null;

  const snap = await getDocs(
    query(collection(db, POS.products), where('modelNo', '==', frame.frameCode)),
  );
  return snap.size === 1 ? snap.docs[0].id : null;
}

/**
 * Turns draft lines (frame + C-number quantities) into POS lines with live stock.
 *
 * Reads each model's variants once. Colour codes are matched case-insensitively
 * because the POS's CSV import keeps colour labels as they were typed.
 */
export async function resolveOrderLines(
  lines: readonly OrderLineInput[],
  { canReadProducts }: { canReadProducts: boolean },
): Promise<{ ok: true; lines: ResolvedLine[] } | ({ ok: false } & ResolveFailure)> {
  const resolved: ResolvedLine[] = [];

  for (const { frame, entries } of lines) {
    const wanted = entries.filter((entry) => entry.qty > 0);
    if (wanted.length === 0) continue;

    const productId = await productIdFor(frame, canReadProducts);
    if (!productId) return { ok: false, code: 'NOT_LINKED', frameCode: frame.frameCode };

    const variants = await getDocs(collection(db, POS.products, productId, POS.variants));
    const byCode = new Map(variants.docs.map((v) => [v.id.toUpperCase(), v]));

    for (const entry of wanted) {
      const variant = byCode.get(entry.cNumber.toUpperCase());
      if (!variant) {
        return {
          ok: false,
          code: 'COLOUR_NOT_IN_POS',
          frameCode: frame.frameCode,
          cNumber: entry.cNumber,
        };
      }

      const stock = (variant.get('stock') ?? {}) as Record<string, unknown>;
      const onHand = stock[MAIN_LOCATION];
      const colorName = variant.get('colorName');

      resolved.push({
        frameId: frame.id,
        productId,
        modelNo: frame.frameCode,
        colorCode: variant.id,
        colorName: typeof colorName === 'string' && colorName ? colorName : entry.cNumber,
        qty: Math.trunc(entry.qty),
        unitPrice: Math.round(frame.wholesalePrice),
        available: typeof onHand === 'number' ? onHand : 0,
      });
    }
  }

  return { ok: true, lines: resolved };
}
