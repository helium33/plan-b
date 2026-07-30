/**
 * The member record, loyalty tiers and points arithmetic.
 *
 * Deliberately pure: no Firestore imports, no React. Everything here is a type
 * or a total function, so the money-adjacent maths can be reasoned about (and
 * later tested) without standing up an emulator. All I/O lives in
 * `src/lib/firestore/members.ts`.
 *
 * ── Why the phone number is the document id ────────────────────────────────
 * Firebase Auth hands out a `uid`, and the obvious schema is `members/{uid}`.
 * We use `members/{phoneKey}` instead, because the phone number is the only
 * identifier that exists on *both* sides of the counter: shop staff already
 * type it into the POS, and it is what a customer recites when they walk in.
 * Keying on it means an in-store purchase and a web order can be matched by
 * exact document lookup rather than a fuzzy join on names.
 *
 * The cost is one extra hop: a signed-in user knows their `uid`, not their
 * phone key, and Firestore security rules cannot run queries. So
 * `memberIndex/{uid}` holds a one-field pointer to the phone key. Two reads at
 * sign-in, and both are cheap and cacheable.
 *
 * ── Relationship to the in-store POS ───────────────────────────────────────
 * The POS stores its customers as:
 *
 *   { number, name, type: 'Original' | 'Membership', gender: 'Male' | 'Female',
 *     age, phone, address?, wechatName?, store, date }
 *
 * The `pos` block below mirrors those field names exactly, so exporting a web
 * member to the POS is a field-for-field copy rather than a translation layer
 * that has to be kept in sync by hand.
 */
import type { FaceShape, FrameSize, Gender } from '@/lib/attributes';
import { parsePhone } from '@/lib/phone';

/* ── Firestore paths ───────────────────────────────────────────────────────── */

/** Member records, keyed by `ParsedPhone.key` (E.164 without the `+`). */
export const MEMBERS_COLLECTION = 'members';

/** `{uid}` → `{ phoneKey }`, so a signed-in user can find their member record. */
export const MEMBER_INDEX_COLLECTION = 'memberIndex';

/** Append-only points history, under `members/{phoneKey}/points`. */
export const POINTS_SUBCOLLECTION = 'points';

/* ── POS-compatible vocabularies ───────────────────────────────────────────── */

/** Mirrors the POS `CustomerType` union exactly. */
export const POS_CUSTOMER_TYPES = ['Original', 'Membership'] as const;
export type PosCustomerType = (typeof POS_CUSTOMER_TYPES)[number];

/** Mirrors the POS `Store` union exactly. */
export const POS_STORES = ['main', 'win', 'pwint', 'yangon', 'yangon-office'] as const;
export type PosStore = (typeof POS_STORES)[number];

/**
 * The flat discount the POS grants a `Membership` customer, as a fraction.
 *
 * Hard-coded to 5% to match `calculateMembershipDiscount` in the POS. If the
 * shop changes this rate, both places must move together — a web total that
 * disagrees with the till is worse than no discount at all.
 */
export const POS_MEMBERSHIP_DISCOUNT = 0.05;

/* ── Auth providers ────────────────────────────────────────────────────────── */

export const AUTH_PROVIDERS = ['password', 'google.com', 'phone'] as const;
export type AuthProviderId = (typeof AUTH_PROVIDERS)[number];

/* ── Loyalty tiers ─────────────────────────────────────────────────────────── */

export const MEMBER_TIERS = ['Bronze', 'Silver', 'Gold'] as const;
export type MemberTier = (typeof MEMBER_TIERS)[number];

/**
 * Tier thresholds, measured in *lifetime* points so a tier is never lost by
 * spending the points that earned it.
 *
 * Note what a tier does and does not do. Tiers change the rate at which points
 * accrue; they do **not** grant a percentage off. That is deliberate: the till
 * applies a single 5% membership discount and nothing else, so a web-only tier
 * discount would quote a customer a price the shop would not honour. Earn rates
 * are safe to vary because they only ever affect the web-side balance.
 */
export const TIER_THRESHOLDS: ReadonlyArray<{
  tier: MemberTier;
  minLifetimePoints: number;
  earnMultiplier: number;
}> = [
  { tier: 'Bronze', minLifetimePoints: 0, earnMultiplier: 1 },
  { tier: 'Silver', minLifetimePoints: 500, earnMultiplier: 1.25 },
  { tier: 'Gold', minLifetimePoints: 2000, earnMultiplier: 1.5 },
];

/* ── Points economics ──────────────────────────────────────────────────────── */

/**
 * Every number that decides what a point is worth, in one block.
 *
 * These are the shop's numbers to set, not the developer's — they are gathered
 * here so they can be changed in one edit and reviewed at a glance, instead of
 * being scattered as literals across the checkout and account pages.
 */
export const LOYALTY = {
  /** Spend this many MMK to earn one point, before the tier multiplier. */
  kyatPerPointEarned: 1_000,
  /** One point is worth this many MMK at redemption. */
  kyatPerPointRedeemed: 50,
  /** Redemptions below this are not worth the transaction. */
  minRedeemablePoints: 100,
  /** Points can never cover more than this fraction of an order. */
  maxRedeemFractionOfOrder: 0.5,

  /** Awarded once, for creating an account with a verified phone number. */
  signUpBonus: 50,
  /** Awarded once, for completing the Module 3 personalisation form. */
  onboardingBonus: 100,
  /** Awarded per published review with a photo (Module 7). */
  reviewBonus: 20,
} as const;

/** Why a points entry exists. Stored, so the account page can explain itself. */
export const POINTS_REASONS = [
  'signup-bonus',
  'onboarding-bonus',
  'purchase',
  'review-bonus',
  'redemption',
  'in-store-sync',
  'manual-adjustment',
] as const;
export type PointsReason = (typeof POINTS_REASONS)[number];

/* ── Documents ─────────────────────────────────────────────────────────────── */

/**
 * A Firestore timestamp, kept loose on purpose.
 *
 * Reads return a `Timestamp`, writes send `serverTimestamp()` (a sentinel), and
 * a document read back from the local cache before the server acknowledges it
 * has `null` here. Modelling all three keeps callers honest about the pending
 * case instead of trusting a `Date` that is sometimes absent.
 */
export type FirestoreDate = { toDate(): Date } | null;

/** The personalisation answers. Module 3 fills these in; Module 2 creates them empty. */
export type MemberProfile = {
  name: string | null;
  age: number | null;
  gender: Gender | null;
  faceShape: FaceShape | null;
  frameSize: FrameSize | null;
  /** Set when the form is completed, which is also what gates the bonus. */
  completedAt: FirestoreDate;
};

export type MemberLoyalty = {
  /** Spendable balance. Decreases on redemption. */
  points: number;
  /** Monotonic total ever earned. Drives the tier; never decreases. */
  lifetimePoints: number;
  tier: MemberTier;
};

/** Fields mirroring the in-store POS customer record, for two-way sync. */
export type MemberPosLink = {
  /** The POS "Customer Number". Null until staff link the account. */
  customerNumber: string | null;
  /** Drives the 5% till discount. Only the POS should promote this. */
  customerType: PosCustomerType;
  /** Which branch registered them. */
  store: PosStore | null;
  linkedAt: FirestoreDate;
};

export type MemberDoc = {
  /** Canonical E.164, e.g. `+959771234567`. The document id is this without `+`. */
  phone: string;
  /** True once an OTP has been completed for this number. */
  phoneVerified: boolean;

  /** Owning Firebase Auth uid. Null for records imported from the POS. */
  uid: string | null;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  /** Every provider linked to the account, so the UI can offer what is missing. */
  authProviders: AuthProviderId[];

  profile: MemberProfile;
  loyalty: MemberLoyalty;
  pos: MemberPosLink;

  /**
   * Saved frame ids.
   *
   * A field rather than a subcollection: the list is small, always read whole,
   * never queried on its own, and this way it arrives with the member document the
   * app already subscribes to instead of costing a second read. `arrayUnion` keeps
   * writes atomic — see `lib/firestore/wishlist.ts`.
   */
  wishlist: string[];

  /** Where the record was first created. */
  source: 'web' | 'pos';

  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
  lastSignInAt: FirestoreDate;
};

/** One immutable line in the points history. */
export type PointsEntry = {
  /** Signed: positive earns, negative redemptions. */
  points: number;
  reason: PointsReason;
  /** Balance after this entry, so the ledger renders without re-summing. */
  balanceAfter: number;
  /** Order this relates to, when there is one. */
  orderId: string | null;
  /** Free-text detail for `manual-adjustment` / `in-store-sync`. */
  note: string | null;
  createdAt: FirestoreDate;
};

/** `memberIndex/{uid}` — the uid → phone pointer. */
export type MemberIndexDoc = {
  phoneKey: string;
  phone: string;
  updatedAt: FirestoreDate;
};

/* ── Pure logic ────────────────────────────────────────────────────────────── */

/** The tier earned by a lifetime total. Walks down, so the highest match wins. */
export function tierForLifetimePoints(lifetimePoints: number): MemberTier {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (lifetimePoints >= TIER_THRESHOLDS[i].minLifetimePoints) {
      return TIER_THRESHOLDS[i].tier;
    }
  }
  return 'Bronze';
}

export function earnMultiplierForTier(tier: MemberTier): number {
  return TIER_THRESHOLDS.find((t) => t.tier === tier)?.earnMultiplier ?? 1;
}

/** The next tier up and how far away it is, or `null` at the top. */
export function nextTierProgress(lifetimePoints: number): {
  next: MemberTier;
  pointsNeeded: number;
  fractionComplete: number;
} | null {
  const current = tierForLifetimePoints(lifetimePoints);
  const currentIndex = TIER_THRESHOLDS.findIndex((t) => t.tier === current);
  const next = TIER_THRESHOLDS[currentIndex + 1];
  if (!next) return null;

  const floor = TIER_THRESHOLDS[currentIndex].minLifetimePoints;
  const span = next.minLifetimePoints - floor;

  return {
    next: next.tier,
    pointsNeeded: next.minLifetimePoints - lifetimePoints,
    // `span` is always positive for a correctly ordered table, but guard anyway
    // rather than risk a division by zero rendering `NaN%` in the UI.
    fractionComplete: span > 0 ? (lifetimePoints - floor) / span : 1,
  };
}

/**
 * Points earned by spending `amountKyat`.
 *
 * Floored, not rounded: a customer seeing fewer points than they expected asks
 * a question, while one seeing more that later vanish has been lied to.
 */
export function pointsForPurchase(amountKyat: number, tier: MemberTier): number {
  if (!Number.isFinite(amountKyat) || amountKyat <= 0) return 0;
  const base = amountKyat / LOYALTY.kyatPerPointEarned;
  return Math.floor(base * earnMultiplierForTier(tier));
}

/** The MMK value of `points`, ignoring any per-order cap. */
export function pointsToKyat(points: number): number {
  return Math.max(0, Math.floor(points)) * LOYALTY.kyatPerPointRedeemed;
}

export type RedemptionQuote = {
  /** Points actually consumed after every cap is applied. */
  points: number;
  /** MMK taken off the order. */
  discountKyat: number;
  /** Order total after the discount. */
  finalKyat: number;
  /** False when the balance is below the minimum, or the order is zero. */
  eligible: boolean;
  /** Present when a cap bit, so the UI can explain the shortfall. */
  cappedBy: 'balance' | 'order-fraction' | null;
};

/**
 * Works out how many points can be spent on an order.
 *
 * Three limits apply at once — the balance, the minimum worth redeeming, and
 * the share of an order points may cover — and they interact, so this is the
 * single place that resolves them. Checkout (Module 8) and the account page
 * both call it rather than re-deriving the rules.
 *
 * @param balance      Member's spendable points.
 * @param orderKyat    Order total before discount.
 * @param requested    Points the customer wants to spend. Defaults to the most
 *                     the rules allow.
 */
export function quoteRedemption(
  balance: number,
  orderKyat: number,
  requested?: number,
): RedemptionQuote {
  const safeBalance = Math.max(0, Math.floor(balance));
  const safeOrder = Math.max(0, Math.round(orderKyat));

  const ineligible: RedemptionQuote = {
    points: 0,
    discountKyat: 0,
    finalKyat: safeOrder,
    eligible: false,
    cappedBy: null,
  };

  if (safeOrder <= 0 || safeBalance < LOYALTY.minRedeemablePoints) return ineligible;

  // How many points the order itself can absorb.
  const maxDiscountKyat = Math.floor(safeOrder * LOYALTY.maxRedeemFractionOfOrder);
  const pointsOrderAllows = Math.floor(maxDiscountKyat / LOYALTY.kyatPerPointRedeemed);

  const wanted = requested === undefined ? safeBalance : Math.max(0, Math.floor(requested));
  const points = Math.min(wanted, safeBalance, pointsOrderAllows);

  if (points < LOYALTY.minRedeemablePoints) return ineligible;

  const discountKyat = pointsToKyat(points);

  let cappedBy: RedemptionQuote['cappedBy'] = null;
  if (points < wanted) cappedBy = points === pointsOrderAllows ? 'order-fraction' : 'balance';

  return {
    points,
    discountKyat,
    finalKyat: safeOrder - discountKyat,
    eligible: true,
    cappedBy,
  };
}

/** The in-store 5% membership discount, mirroring the POS calculation. */
export function membershipDiscount(
  customerType: PosCustomerType,
  amountKyat: number,
): { eligible: boolean; percentage: number; discountKyat: number; finalKyat: number } {
  const eligible = customerType === 'Membership';
  const discountKyat = eligible ? Math.round(amountKyat * POS_MEMBERSHIP_DISCOUNT) : 0;
  return {
    eligible,
    percentage: eligible ? POS_MEMBERSHIP_DISCOUNT * 100 : 0,
    discountKyat,
    finalKyat: amountKyat - discountKyat,
  };
}

/* ── Construction and POS export ───────────────────────────────────────────── */

/**
 * A brand-new member record.
 *
 * `createdAt` / `updatedAt` are left `null` for the caller to replace with
 * `serverTimestamp()`; this file stays free of Firestore imports so it can be
 * unit-tested, and the server clock is the only trustworthy one anyway.
 */
export function newMemberDoc(input: {
  phone: string;
  phoneVerified: boolean;
  uid: string | null;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  authProviders?: AuthProviderId[];
}): MemberDoc {
  return {
    phone: input.phone,
    phoneVerified: input.phoneVerified,
    uid: input.uid,
    email: input.email ?? null,
    displayName: input.displayName ?? null,
    photoURL: input.photoURL ?? null,
    authProviders: input.authProviders ?? [],
    profile: {
      name: input.displayName ?? null,
      age: null,
      gender: null,
      faceShape: null,
      frameSize: null,
      completedAt: null,
    },
    loyalty: {
      points: 0,
      lifetimePoints: 0,
      tier: 'Bronze',
    },
    wishlist: [],
    pos: {
      customerNumber: null,
      // A web signup is an `Original` customer. Only the shop can promote
      // someone to `Membership`, since that is what the till honours.
      customerType: 'Original',
      store: null,
      linkedAt: null,
    },
    source: 'web',
    createdAt: null,
    updatedAt: null,
    lastSignInAt: null,
  };
}

/** True once the personalisation form has been completed (Module 3). */
export function hasCompletedOnboarding(member: MemberDoc | null): boolean {
  return Boolean(member?.profile.completedAt);
}

/**
 * Projects a member onto the POS `customers` shape for export.
 *
 * Field names and value vocabularies match the POS exactly, so importing this
 * is a copy rather than a mapping exercise. `Other` gender becomes `''`
 * because the POS has no third option and putting a guess in front of shop
 * staff is worse than leaving it for them to ask.
 */
export function toPosCustomer(
  member: MemberDoc,
  store: PosStore,
): {
  number: string;
  name: string;
  type: PosCustomerType;
  gender: '' | 'Male' | 'Female';
  age: number;
  phone: string;
  address: string;
  wechatName: string;
  store: PosStore;
  date: string;
} {
  const parsed = parsePhone(member.phone);

  return {
    number: member.pos.customerNumber ?? '',
    name: member.profile.name ?? member.displayName ?? '',
    type: member.pos.customerType,
    gender: member.profile.gender === 'Other' ? '' : (member.profile.gender ?? ''),
    age: member.profile.age ?? 0,
    // The POS stores national format, which is what staff read off a receipt.
    phone: parsed.ok ? parsed.phone.display : member.phone,
    address: '',
    wechatName: '',
    store,
    date: (member.createdAt?.toDate() ?? new Date()).toISOString().slice(0, 10),
  };
}
