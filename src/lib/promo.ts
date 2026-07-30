/**
 * Promo codes, and how they combine with loyalty points.
 *
 * Pure — no React, no Firestore — because this decides what a customer pays and
 * that arithmetic needs testing, not trusting.
 *
 * ── Codes live in the client, and that is a real limitation ─────────────────
 * Anyone can read this file's compiled output and see every code, including ones
 * not yet advertised. For a small shop running "MONSOON10" on Facebook that is
 * acceptable — the codes are public anyway. What is *not* acceptable is inventing
 * a code: `resolvePromo` only ever matches this table, so a made-up string is
 * rejected.
 *
 * Two things to move server-side before they matter: **single-use codes** (this
 * cannot enforce "one per customer" — nothing stops clearing localStorage) and
 * **codes worth withholding until launch**. Both need a Firestore collection with
 * rules, which is the natural next step once the shop actually runs a campaign.
 *
 * ── Discounts never stack past the total ───────────────────────────────────
 * A promo and a points redemption are applied in sequence, and the combined
 * discount is capped so an order can never reach zero or go negative. Getting
 * that wrong is how a shop accidentally gives away a pair of glasses.
 */
import { LOYALTY, quoteRedemption } from '@/lib/membership';

export const PROMO_KINDS = ['percentage', 'fixed', 'free-delivery'] as const;
export type PromoKind = (typeof PROMO_KINDS)[number];

export type PromoCode = {
  /** Compared case-insensitively; stored uppercase by convention. */
  code: string;
  kind: PromoKind;
  /** Percent for `percentage`, MMK for `fixed`, ignored for `free-delivery`. */
  value: number;
  /** Order subtotal required before the code applies, in MMK. */
  minSpendKyat: number;
  /** Ceiling on a percentage discount, so 20% off cannot become 200,000 MMK. */
  maxDiscountKyat: number | null;
  /** ISO date. The code stops working at the start of this day, shop-local. */
  expiresOn: string | null;
  /** Translation key under `promo.descriptions`. */
  descriptionKey: string;
};

/** Standard nationwide delivery, so `free-delivery` has something to remove. */
export const DELIVERY_KYAT = 5_000;

/**
 * The shop's live codes.
 *
 * Edit this list to run a campaign. Percentage codes should always carry a
 * `maxDiscountKyat` — without one, a 15% code applied to a 400,000 MMK
 * progressive order quietly gives away 60,000.
 */
export const PROMO_CODES: readonly PromoCode[] = [
  {
    code: 'WELCOME10',
    kind: 'percentage',
    value: 10,
    minSpendKyat: 50_000,
    maxDiscountKyat: 20_000,
    expiresOn: null,
    descriptionKey: 'promo.descriptions.welcome10',
  },
  {
    code: 'MONSOON15',
    kind: 'percentage',
    value: 15,
    minSpendKyat: 100_000,
    maxDiscountKyat: 30_000,
    expiresOn: '2026-10-01',
    descriptionKey: 'promo.descriptions.monsoon15',
  },
  {
    code: 'FREEDELIVERY',
    kind: 'free-delivery',
    value: 0,
    minSpendKyat: 80_000,
    maxDiscountKyat: null,
    expiresOn: null,
    descriptionKey: 'promo.descriptions.freeDelivery',
  },
  {
    code: 'STUDENT5000',
    kind: 'fixed',
    value: 5_000,
    minSpendKyat: 40_000,
    maxDiscountKyat: null,
    expiresOn: null,
    descriptionKey: 'promo.descriptions.student5000',
  },
];

/* ── Resolution ────────────────────────────────────────────────────────────── */

export type PromoRejection =
  | 'unknown'
  | 'expired'
  | 'below-minimum';

export type PromoResult =
  | {
      ok: true;
      promo: PromoCode;
      /** MMK off the goods. Zero for a free-delivery code. */
      discountKyat: number;
      /** True when delivery is waived. */
      freeDelivery: boolean;
      /** Set when `maxDiscountKyat` reduced what the percentage would have given. */
      cappedByMax: boolean;
    }
  | {
      ok: false;
      reason: PromoRejection;
      /** Present for `below-minimum`, so the UI can say how much more is needed. */
      minSpendKyat?: number;
    };

/**
 * Validates a code against an order.
 *
 * @param input        Whatever the customer typed. Trimmed and case-folded.
 * @param subtotalKyat Goods total, before delivery and before any discount.
 * @param now          Injectable for testing expiry boundaries.
 */
export function resolvePromo(
  input: string,
  subtotalKyat: number,
  now: Date = new Date(),
): PromoResult {
  const needle = input.trim().toUpperCase();
  if (!needle) return { ok: false, reason: 'unknown' };

  const promo = PROMO_CODES.find((entry) => entry.code.toUpperCase() === needle);
  if (!promo) return { ok: false, reason: 'unknown' };

  if (promo.expiresOn) {
    // Compared at UTC midnight of the expiry date: the code works throughout the
    // day before and stops at the start of `expiresOn`. Using the local clock
    // would make a code die at different moments for different customers.
    const expiry = new Date(`${promo.expiresOn}T00:00:00Z`).getTime();
    if (Number.isFinite(expiry) && now.getTime() >= expiry) {
      return { ok: false, reason: 'expired' };
    }
  }

  if (subtotalKyat < promo.minSpendKyat) {
    return { ok: false, reason: 'below-minimum', minSpendKyat: promo.minSpendKyat };
  }

  if (promo.kind === 'free-delivery') {
    return { ok: true, promo, discountKyat: 0, freeDelivery: true, cappedByMax: false };
  }

  if (promo.kind === 'fixed') {
    // Never more than the order itself — a 5,000 code on a 4,000 order gives
    // 4,000 off, not a 1,000 credit.
    const discountKyat = Math.min(promo.value, subtotalKyat);
    return { ok: true, promo, discountKyat, freeDelivery: false, cappedByMax: false };
  }

  const raw = Math.floor((subtotalKyat * promo.value) / 100);
  const capped = promo.maxDiscountKyat === null ? raw : Math.min(raw, promo.maxDiscountKyat);

  return {
    ok: true,
    promo,
    discountKyat: capped,
    freeDelivery: false,
    cappedByMax: capped < raw,
  };
}

/* ── Order totals ──────────────────────────────────────────────────────────── */

export type OrderTotals = {
  subtotalKyat: number;
  deliveryKyat: number;
  promoDiscountKyat: number;
  pointsDiscountKyat: number;
  pointsSpent: number;
  totalKyat: number;
  /** True when the combined discount hit the floor and was trimmed. */
  discountCapped: boolean;
};

/**
 * The final bill.
 *
 * Order of operations matters and is deliberate:
 *
 *  1. Promo comes off the subtotal first.
 *  2. Points are then quoted against **what remains**, not the original subtotal.
 *
 * Doing it the other way round would let a promo and a full points redemption
 * together exceed the order. Quoting points on the post-promo figure means the
 * 50% cap in `quoteRedemption` is measured against what is actually still owed,
 * so the customer can never end up paying less than the delivery charge.
 *
 * @param wantsPoints Points the customer asked to spend, or 0 for none.
 */
export function computeTotals(input: {
  subtotalKyat: number;
  promo: PromoResult | null;
  pointsBalance: number;
  wantsPoints: number;
  includeDelivery: boolean;
}): OrderTotals {
  const subtotalKyat = Math.max(0, Math.round(input.subtotalKyat));

  const promoOk = input.promo?.ok === true ? input.promo : null;
  const promoDiscountKyat = Math.min(promoOk?.discountKyat ?? 0, subtotalKyat);

  const deliveryKyat = input.includeDelivery && !promoOk?.freeDelivery ? DELIVERY_KYAT : 0;

  const afterPromo = subtotalKyat - promoDiscountKyat;

  // Points are quoted against the post-promo goods total.
  const quote =
    input.wantsPoints > 0
      ? quoteRedemption(input.pointsBalance, afterPromo, input.wantsPoints)
      : null;

  const pointsDiscountKyat = quote?.eligible ? quote.discountKyat : 0;
  const pointsSpent = quote?.eligible ? quote.points : 0;

  const goodsAfterAll = Math.max(0, afterPromo - pointsDiscountKyat);

  return {
    subtotalKyat,
    deliveryKyat,
    promoDiscountKyat,
    pointsDiscountKyat,
    pointsSpent,
    totalKyat: goodsAfterAll + deliveryKyat,
    discountCapped: promoDiscountKyat + pointsDiscountKyat > subtotalKyat,
  };
}

/** The most points worth offering for an order, for the "use max" button. */
export function maxUsablePoints(balance: number, afterPromoKyat: number): number {
  const quote = quoteRedemption(balance, afterPromoKyat);
  return quote.eligible ? quote.points : 0;
}

/** True when the balance is worth showing a redemption control for at all. */
export function canRedeemPoints(balance: number): boolean {
  return balance >= LOYALTY.minRedeemablePoints;
}
