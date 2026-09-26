/**
 * Checkout rules: delivery, payment, coupons and the order total.
 *
 * Pure, and deliberately so — the total a customer is shown must be derivable
 * from the cart and their choices alone. A figure that also depends on which
 * component last rendered is a figure that can differ between the summary and
 * the button that charges for it.
 */

/* ── Delivery ──────────────────────────────────────────────────────────────── */

export const DELIVERY_METHODS = ['home', 'pickup', 'cargate'] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

/**
 * Surcharges in kyat.
 *
 * Car-gate delivery hands the parcel to a highway bus counter, which charges the
 * shop a handling fee that is passed straight through. Pickup is free because
 * the customer is doing the work.
 */
export const DELIVERY_FEE_KYAT: Record<DeliveryMethod, number> = {
  home: 0,
  pickup: 0,
  cargate: 2_000,
};

/* ── Payment ───────────────────────────────────────────────────────────────── */

export const PAYMENT_OPTIONS = ['kpay', 'wavepay', 'cod'] as const;
export type PaymentOption = (typeof PAYMENT_OPTIONS)[number];

/**
 * Whether this method needs a transfer screenshot before the order can be placed.
 *
 * Cash on delivery is the only one that does not: there is nothing to prove
 * until the courier is standing there. For the two wallets the slip *is* the
 * payment record, so an order without one cannot be reconciled and should not be
 * accepted — which is why this drives a hard block rather than a nudge.
 */
export function requiresSlip(option: PaymentOption): boolean {
  return option !== 'cod';
}

/* ── Coupons ───────────────────────────────────────────────────────────────── */

export type Coupon = {
  code: string;
  /** Percentage off the subtotal, or a flat kyat amount — never both. */
  kind: 'percent' | 'flat';
  value: number;
  /** Minimum subtotal before the code applies, in kyat. */
  minSubtotalKyat: number;
  /** Caps a percentage discount, so a big cart cannot run away with the margin. */
  maxDiscountKyat: number | null;
};

export const COUPONS: readonly Coupon[] = [
  { code: 'SUMMER25', kind: 'percent', value: 25, minSubtotalKyat: 10_000, maxDiscountKyat: 5_000 },
  { code: 'PINKY10', kind: 'percent', value: 10, minSubtotalKyat: 0, maxDiscountKyat: 3_000 },
  { code: 'FREESHIP', kind: 'flat', value: 2_000, minSubtotalKyat: 20_000, maxDiscountKyat: null },
];

export type CouponResult =
  | { ok: true; coupon: Coupon; discountKyat: number }
  | { ok: false; reason: 'unknown' | 'below-minimum'; minSubtotalKyat?: number };

/**
 * Validates a code against the current subtotal.
 *
 * Returns *why* it failed, not just that it did. "Invalid code" on a code that
 * is real but two thousand kyat short of its minimum is the kind of message that
 * makes a customer abandon a cart they were one item away from qualifying for.
 */
export function applyCoupon(code: string, subtotalKyat: number): CouponResult {
  const normalised = code.trim().toUpperCase();
  const coupon = COUPONS.find((entry) => entry.code === normalised);

  if (!coupon) return { ok: false, reason: 'unknown' };

  if (subtotalKyat < coupon.minSubtotalKyat) {
    return { ok: false, reason: 'below-minimum', minSubtotalKyat: coupon.minSubtotalKyat };
  }

  const raw =
    coupon.kind === 'percent' ? Math.round((subtotalKyat * coupon.value) / 100) : coupon.value;

  const capped = coupon.maxDiscountKyat === null ? raw : Math.min(raw, coupon.maxDiscountKyat);

  // Never more than the goods are worth: a discount larger than the subtotal
  // would produce a negative total, which is a refund nobody authorised.
  return { ok: true, coupon, discountKyat: Math.min(capped, subtotalKyat) };
}

/* ── Totals ────────────────────────────────────────────────────────────────── */

export type CartLine = {
  id: string;
  name: string;
  priceKyat: number;
  qty: number;
  image: string;
};

export type CheckoutTotals = {
  subtotalKyat: number;
  deliveryKyat: number;
  discountKyat: number;
  totalKyat: number;
  itemCount: number;
};

/**
 * The order total.
 *
 * The discount applies to the goods only, never to the delivery fee — the bus
 * counter charges its handling fee regardless of what the customer paid for the
 * lenses, and discounting it would come straight out of the shop's pocket.
 */
export function computeTotals(
  lines: readonly CartLine[],
  delivery: DeliveryMethod,
  discountKyat: number,
): CheckoutTotals {
  const subtotalKyat = lines.reduce((sum, line) => sum + line.priceKyat * line.qty, 0);
  const deliveryKyat = DELIVERY_FEE_KYAT[delivery];
  const capped = Math.min(discountKyat, subtotalKyat);

  return {
    subtotalKyat,
    deliveryKyat,
    discountKyat: capped,
    totalKyat: subtotalKyat + deliveryKyat - capped,
    itemCount: lines.reduce((sum, line) => sum + line.qty, 0),
  };
}

/* ── Contact validation ────────────────────────────────────────────────────── */

export type ContactDetails = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  region: string;
  township: string;
};

export type ContactErrors = Partial<Record<keyof ContactDetails, string>>;

/**
 * Deliberately loose.
 *
 * Anything stricter than "something, an @, something with a dot" rejects real
 * addresses — the full RFC grammar allows more than most regexes admit — and a
 * customer whose valid address is refused has no way to proceed at all. The
 * confirmation email is the real test.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Myanmar mobile numbers, in the forms people actually type.
 *
 * Accepts `09xxxxxxxx`, `+959xxxxxxxx` and spaced or dashed variants, because
 * rejecting a number over a space is the single most common way a checkout form
 * loses an order.
 */
const PHONE_PATTERN = /^(\+?95|0)9\d{7,10}$/;

export function validateContact(details: ContactDetails): ContactErrors {
  const errors: ContactErrors = {};
  const digits = details.phone.replace(/[\s()-]/g, '');

  if (!details.fullName.trim()) errors.fullName = 'Enter your name';
  if (!details.email.trim()) errors.email = 'Enter your email';
  else if (!EMAIL_PATTERN.test(details.email.trim())) errors.email = 'Check this email address';

  if (!digits) errors.phone = 'Enter your phone number';
  else if (!PHONE_PATTERN.test(digits)) errors.phone = 'Check this phone number';

  if (!details.address.trim()) errors.address = 'Enter a delivery address';
  if (!details.region) errors.region = 'Choose a region';
  if (!details.township) errors.township = 'Choose a township';

  return errors;
}

export const isValidContact = (errors: ContactErrors): boolean =>
  Object.keys(errors).length === 0;
