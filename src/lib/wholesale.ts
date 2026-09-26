/**
 * The wholesale pricing engine.
 *
 * Pure functions over plain data — no React, no Firestore — so every number on
 * the voucher can be re-derived from the draft order alone. That matters more
 * here than in most places: the buyer and the shop are looking at the same
 * figures from two different phones, and a total that depends on hidden state is
 * a total nobody can check.
 *
 * ── Why there are no automatic discounts ───────────────────────────────────
 * There used to be two: a percentage off a model's full colour assortment, and
 * a volume tier on the order. Both are gone, and deliberately so — the shop
 * negotiates price per customer and per season, and an app that quoted a rule
 * the owner had not agreed to was writing cheques the shop then had to honour
 * or embarrassingly walk back on Telegram.
 *
 * So this module now does one thing: multiply quantity by price and add it up.
 * The voucher shows a subtotal, and that subtotal *is* the total. Whatever the
 * shop chooses to knock off is settled between the two people in the chat,
 * where it was always actually being decided.
 *
 * Concretely, that means: do not reintroduce a `discountKyat` field here. If a
 * negotiated figure ever needs to reach the voucher, it belongs in the order as
 * something a person typed, not as something this file inferred.
 */
import type { FrameDoc, FrameVariant } from '@/lib/product';
import { orderableVariants } from '@/lib/product';

/** The trade quotes frames by the dozen even when it prices them by the piece. */
export const PIECES_PER_DOZEN = 12;

/** Whole kyat. Myanmar retail has no minor unit, and half a kyat is not a price. */
const round = (value: number) => Math.round(value);

/* ── Draft order shape ─────────────────────────────────────────────────────── */

/**
 * Quantities for one model, keyed by C-number.
 *
 * Keyed rather than an array because the store writes it from a stepper that
 * knows only the C-number it belongs to, and because a missing key and a zero
 * mean the same thing — which removes the "did they order zero, or not order?"
 * ambiguity an array of `{cNumber, qty}` would carry.
 */
export type QuantityMap = Record<string, number>;

/** One frame's contribution to the order, priced. */
export type OrderLine = {
  frame: FrameDoc;
  /** Only colours with a quantity, in catalogue order. */
  entries: { variant: FrameVariant; qty: number }[];
  totalPieces: number;
  /** Pieces × unit price. Nothing is taken off it. */
  subtotalKyat: number;
};

export type OrderTotals = {
  lines: OrderLine[];
  totalPieces: number;
  /** The sum of the lines — and the figure the buyer owes. */
  subtotalKyat: number;
};

/* ── Line pricing ──────────────────────────────────────────────────────────── */

/**
 * Prices one model against the quantities entered for it.
 *
 * Quantities for colours that are out of stock, or that no longer exist on the
 * frame, are ignored rather than priced. That happens for real: a draft order
 * persists in the browser across a catalogue edit, and charging for a colour the
 * shop has since withdrawn is worse than quietly dropping it — the buyer sees the
 * line total change and can re-check, which a phantom charge would never prompt.
 */
export function priceLine(frame: FrameDoc, quantities: QuantityMap): OrderLine {
  const orderable = orderableVariants(frame);

  const entries = orderable
    .map((variant) => ({ variant, qty: Math.max(0, Math.trunc(quantities[variant.cNumber] ?? 0)) }))
    .filter((entry) => entry.qty > 0);

  const totalPieces = entries.reduce((sum, entry) => sum + entry.qty, 0);

  return {
    frame,
    entries,
    totalPieces,
    subtotalKyat: round(totalPieces * frame.wholesalePrice),
  };
}

/* ── Order pricing ─────────────────────────────────────────────────────────── */

/**
 * Prices a whole draft order.
 *
 * @param frames     The catalogue, or however much of it has loaded.
 * @param quantities Draft quantities, keyed by frame id then by C-number.
 *
 * Frames present in the draft but absent from the catalogue are skipped — an
 * unpublished or deleted model must not sit on a voucher the shop is expected to
 * honour.
 */
export function priceOrder(
  frames: readonly FrameDoc[],
  quantities: Record<string, QuantityMap>,
): OrderTotals {
  const lines = frames
    .map((frame) => priceLine(frame, quantities[frame.id] ?? {}))
    .filter((line) => line.totalPieces > 0);

  return {
    lines,
    totalPieces: lines.reduce((sum, line) => sum + line.totalPieces, 0),
    subtotalKyat: lines.reduce((sum, line) => sum + line.subtotalKyat, 0),
  };
}

/* ── Display helpers ───────────────────────────────────────────────────────── */

/**
 * Whether every orderable colour of a model is in the draft.
 *
 * No longer worth a discount, but still worth *saying*: a buyer taking the whole
 * assortment is making a deliberate choice, and the catalogue's "take one of
 * each" shortcut needs to know when it has already been used so it can say so
 * rather than offering to do again what is done.
 */
export function isFullSet(frame: FrameDoc, quantities: QuantityMap): boolean {
  const orderable = orderableVariants(frame);
  if (orderable.length === 0) return false;
  return orderable.every((variant) => (quantities[variant.cNumber] ?? 0) > 0);
}
