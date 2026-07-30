/**
 * All Firestore reads and writes for member records and the points ledger.
 *
 * Layout:
 *
 *   members/{phoneKey}                 the member record  (phoneKey = E.164 sans `+`)
 *   members/{phoneKey}/points/{id}     append-only points history
 *   memberIndex/{uid}                  { phoneKey } pointer, so a uid can find its member
 *
 * Balance updates always run inside `runTransaction`. Two devices signed into
 * the same account — a phone at the till and a laptop at home — can otherwise
 * interleave a read and a write and lose points, and points are money.
 */
import {
  type DocumentData,
  type Unsubscribe,
  type UpdateData,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import {
  type AuthProviderId,
  type MemberDoc,
  type MemberProfile,
  MEMBERS_COLLECTION,
  MEMBER_INDEX_COLLECTION,
  type PointsEntry,
  type PointsReason,
  POINTS_SUBCOLLECTION,
  LOYALTY,
  newMemberDoc,
  quoteRedemption,
  tierForLifetimePoints,
} from '@/lib/membership';
import { parsePhone } from '@/lib/phone';

/* ── Errors ────────────────────────────────────────────────────────────────── */

export type MemberErrorCode =
  /** The phone number did not parse — should have been caught by the form. */
  | 'invalid-phone'
  /** A different Auth account already owns this phone number. */
  | 'phone-claimed'
  | 'not-found'
  /** Redemption asked for more points than the rules allow. */
  | 'insufficient-points';

export class MemberError extends Error {
  constructor(readonly code: MemberErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'MemberError';
  }
}

/* ── References ────────────────────────────────────────────────────────────── */

const memberRef = (phoneKey: string) => doc(db, MEMBERS_COLLECTION, phoneKey);
const memberIndexRef = (uid: string) => doc(db, MEMBER_INDEX_COLLECTION, uid);
const pointsRef = (phoneKey: string) =>
  collection(db, MEMBERS_COLLECTION, phoneKey, POINTS_SUBCOLLECTION);

/* ── Normalisation ─────────────────────────────────────────────────────────── */

/**
 * Fills in anything a stored document is missing.
 *
 * Records can arrive from a POS import or from an older shape of this schema,
 * and a missing `loyalty` object would otherwise crash the account page on
 * `member.loyalty.points`. Reading defensively here means every consumer can
 * treat `MemberDoc` as complete.
 */
function normalizeMember(phoneKey: string, data: Record<string, unknown>): MemberDoc {
  const base = newMemberDoc({
    phone: typeof data.phone === 'string' ? data.phone : `+${phoneKey}`,
    phoneVerified: data.phoneVerified === true,
    uid: typeof data.uid === 'string' ? data.uid : null,
  });

  const stored = data as Partial<MemberDoc>;

  const lifetimePoints = stored.loyalty?.lifetimePoints ?? 0;

  return {
    ...base,
    ...stored,
    phone: base.phone,
    phoneVerified: base.phoneVerified,
    uid: base.uid,
    authProviders: Array.isArray(stored.authProviders)
      ? (stored.authProviders as AuthProviderId[])
      : [],
    profile: { ...base.profile, ...(stored.profile ?? {}) },
    loyalty: {
      points: stored.loyalty?.points ?? 0,
      lifetimePoints,
      // Recomputed rather than trusted: if a tier threshold changes, every
      // member's tier should follow on the next read without a migration.
      tier: tierForLifetimePoints(lifetimePoints),
    },
    pos: { ...base.pos, ...(stored.pos ?? {}) },
    // Records written before the wishlist existed have no field at all, and every
    // consumer indexes into it — so default it rather than letting `.length`
    // throw on an older member.
    wishlist: Array.isArray(stored.wishlist)
      ? stored.wishlist.filter((id): id is string => typeof id === 'string')
      : [],
    source: stored.source === 'pos' ? 'pos' : 'web',
  };
}

/* ── Reads ─────────────────────────────────────────────────────────────────── */

export async function getMember(phoneKey: string): Promise<MemberDoc | null> {
  const snap = await getDoc(memberRef(phoneKey));
  return snap.exists() ? normalizeMember(phoneKey, snap.data()) : null;
}

/** Resolves a signed-in uid to its member document id. */
export async function getPhoneKeyForUid(uid: string): Promise<string | null> {
  const snap = await getDoc(memberIndexRef(uid));
  if (!snap.exists()) return null;
  const phoneKey = snap.data().phoneKey;
  return typeof phoneKey === 'string' ? phoneKey : null;
}

/** The member record for a uid, or `null` if the uid has no phone linked yet. */
export async function getMemberForUid(uid: string): Promise<MemberDoc | null> {
  const phoneKey = await getPhoneKeyForUid(uid);
  return phoneKey ? getMember(phoneKey) : null;
}

/**
 * Live subscription to a member record.
 *
 * The account page reads points from this, so an in-store purchase synced by
 * staff appears without a refresh.
 */
export function subscribeToMember(
  phoneKey: string,
  onChange: (member: MemberDoc | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    memberRef(phoneKey),
    (snap) => onChange(snap.exists() ? normalizeMember(phoneKey, snap.data()) : null),
    (error) => onError?.(error),
  );
}

export async function getPointsHistory(phoneKey: string, max = 25): Promise<PointsEntry[]> {
  const snap = await getDocs(query(pointsRef(phoneKey), orderBy('createdAt', 'desc'), fbLimit(max)));
  return snap.docs.map((d) => d.data() as PointsEntry);
}

/* ── Claiming a phone number ───────────────────────────────────────────────── */

export type ClaimResult = {
  member: MemberDoc;
  phoneKey: string;
  /** True when this call created the record — the caller may want to celebrate. */
  created: boolean;
  /** True when an existing POS record was adopted, points and all. */
  adoptedFromPos: boolean;
};

/**
 * Attaches a verified phone number to an Auth user, creating the member record
 * if this is a new number.
 *
 * Called after any successful phone OTP — both "sign in with phone" and "add a
 * phone to my email account". By this point Firebase has already proven the
 * caller controls the number, so claiming it is safe.
 *
 * Three cases, all handled in one transaction so a half-linked account cannot
 * exist:
 *
 *  1. No record  → create it and award the sign-up bonus.
 *  2. Record with no `uid` → a POS-imported customer walking in from the shop.
 *     Adopt it and keep whatever points they already earned in store. No bonus:
 *     they are not a new customer, they are the same customer arriving online.
 *  3. Record owned by a *different* uid → refuse. Firebase normally prevents
 *     this (`auth/credential-already-in-use`), but a data import could create
 *     it, and silently merging two people's loyalty balances is unacceptable.
 */
export async function claimPhoneForUser(input: {
  uid: string;
  phone: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  authProviders?: AuthProviderId[];
}): Promise<ClaimResult> {
  const parsed = parsePhone(input.phone);
  if (!parsed.ok) throw new MemberError('invalid-phone');

  const { key: phoneKey, e164 } = parsed.phone;

  const outcome = await runTransaction(db, async (tx) => {
    const ref = memberRef(phoneKey);
    const snap = await tx.get(ref);

    if (!snap.exists()) {
      const member = newMemberDoc({
        phone: e164,
        phoneVerified: true,
        uid: input.uid,
        email: input.email ?? null,
        displayName: input.displayName ?? null,
        photoURL: input.photoURL ?? null,
        authProviders: input.authProviders ?? ['phone'],
      });

      member.loyalty = {
        points: LOYALTY.signUpBonus,
        lifetimePoints: LOYALTY.signUpBonus,
        tier: tierForLifetimePoints(LOYALTY.signUpBonus),
      };

      tx.set(ref, {
        ...member,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSignInAt: serverTimestamp(),
      });

      // The opening ledger line, written in the same transaction as the
      // balance it explains, so the history can never disagree with the total.
      tx.set(doc(pointsRef(phoneKey)), {
        points: LOYALTY.signUpBonus,
        reason: 'signup-bonus' satisfies PointsReason,
        balanceAfter: LOYALTY.signUpBonus,
        orderId: null,
        note: null,
        createdAt: serverTimestamp(),
      });

      return { created: true, adoptedFromPos: false };
    }

    const existing = normalizeMember(phoneKey, snap.data());

    if (existing.uid && existing.uid !== input.uid) {
      throw new MemberError('phone-claimed');
    }

    const adoptedFromPos = existing.uid === null;

    tx.update(ref, {
      uid: input.uid,
      phoneVerified: true,
      // Only fill contact details that are still blank. A customer who edited
      // their name on the account page should not have it reset by the display
      // name on their Google profile.
      email: existing.email ?? input.email ?? null,
      displayName: existing.displayName ?? input.displayName ?? null,
      photoURL: existing.photoURL ?? input.photoURL ?? null,
      authProviders: Array.from(
        new Set([...existing.authProviders, ...(input.authProviders ?? [])]),
      ),
      updatedAt: serverTimestamp(),
      lastSignInAt: serverTimestamp(),
    });

    return { created: false, adoptedFromPos };
  });

  // The uid → phone pointer sits outside the transaction because it is in a
  // different collection and is pure derived data: if this write fails, the
  // next sign-in simply rewrites it.
  await setDoc(memberIndexRef(input.uid), {
    phoneKey,
    phone: e164,
    updatedAt: serverTimestamp(),
  });

  const member = await getMember(phoneKey);
  if (!member) throw new MemberError('not-found');

  return { member, phoneKey, ...outcome };
}

/** Records a sign-in without touching anything else. Best-effort. */
export async function touchLastSignIn(phoneKey: string): Promise<void> {
  await updateDoc(memberRef(phoneKey), {
    lastSignInAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Merges provider ids onto the record after a successful account link. */
export async function recordAuthProviders(
  phoneKey: string,
  providers: AuthProviderId[],
): Promise<void> {
  const member = await getMember(phoneKey);
  if (!member) throw new MemberError('not-found');

  await updateDoc(memberRef(phoneKey), {
    authProviders: Array.from(new Set([...member.authProviders, ...providers])),
    updatedAt: serverTimestamp(),
  });
}

/* ── Profile ───────────────────────────────────────────────────────────────── */

/**
 * Saves personalisation answers. Module 3's form calls this.
 *
 * `awardOnboardingBonus` is checked against `profile.completedAt` inside the
 * transaction, so re-submitting the form to change an answer does not pay out
 * a second time.
 */
export async function saveMemberProfile(
  phoneKey: string,
  profile: Partial<Omit<MemberProfile, 'completedAt'>>,
  options: { markComplete?: boolean } = {},
): Promise<{ bonusAwarded: number }> {
  return runTransaction(db, async (tx) => {
    const ref = memberRef(phoneKey);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new MemberError('not-found');

    const existing = normalizeMember(phoneKey, snap.data());
    const alreadyComplete = Boolean(existing.profile.completedAt);
    const shouldAward = Boolean(options.markComplete) && !alreadyComplete;

    const nextProfile: Record<string, unknown> = { ...existing.profile, ...profile };
    if (options.markComplete && !alreadyComplete) {
      nextProfile.completedAt = serverTimestamp();
    }

    const update: UpdateData<DocumentData> = {
      profile: nextProfile,
      updatedAt: serverTimestamp(),
    };

    if (shouldAward) {
      const points = existing.loyalty.points + LOYALTY.onboardingBonus;
      const lifetimePoints = existing.loyalty.lifetimePoints + LOYALTY.onboardingBonus;

      update.loyalty = { points, lifetimePoints, tier: tierForLifetimePoints(lifetimePoints) };

      tx.set(doc(pointsRef(phoneKey)), {
        points: LOYALTY.onboardingBonus,
        reason: 'onboarding-bonus' satisfies PointsReason,
        balanceAfter: points,
        orderId: null,
        note: null,
        createdAt: serverTimestamp(),
      });
    }

    tx.update(ref, update);

    return { bonusAwarded: shouldAward ? LOYALTY.onboardingBonus : 0 };
  });
}

/** Updates the editable contact fields on the account page. */
export async function updateMemberContact(
  phoneKey: string,
  fields: { displayName?: string | null; email?: string | null },
): Promise<void> {
  const update: UpdateData<DocumentData> = { updatedAt: serverTimestamp() };
  if (fields.displayName !== undefined) {
    update.displayName = fields.displayName;
    // Dotted path so the rest of `profile` is left alone — assigning the whole
    // object here would wipe the onboarding answers.
    update['profile.name'] = fields.displayName;
  }
  if (fields.email !== undefined) update.email = fields.email;

  await updateDoc(memberRef(phoneKey), update);
}

/* ── Points ────────────────────────────────────────────────────────────────── */

/**
 * Adds points and writes the matching ledger line.
 *
 * ⚠️ Client-side by necessity: this project has no Cloud Functions yet, so the
 * browser both decides the amount and writes it. `firestore.rules` makes the
 * ledger append-only and scopes it to the owning uid, which stops one customer
 * editing another's history — but it cannot stop a determined customer awarding
 * *themselves* points. Before points offset real money, `purchase` awards must
 * move into a Cloud Function triggered by an order write, with the rules then
 * denying client writes to `loyalty` and `points` outright.
 */
export async function awardPoints(input: {
  phoneKey: string;
  points: number;
  reason: PointsReason;
  orderId?: string | null;
  note?: string | null;
}): Promise<{ balance: number }> {
  const amount = Math.floor(input.points);
  if (amount <= 0) {
    const member = await getMember(input.phoneKey);
    return { balance: member?.loyalty.points ?? 0 };
  }

  return runTransaction(db, async (tx) => {
    const ref = memberRef(input.phoneKey);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new MemberError('not-found');

    const existing = normalizeMember(input.phoneKey, snap.data());
    const points = existing.loyalty.points + amount;
    const lifetimePoints = existing.loyalty.lifetimePoints + amount;

    tx.update(ref, {
      loyalty: { points, lifetimePoints, tier: tierForLifetimePoints(lifetimePoints) },
      updatedAt: serverTimestamp(),
    });

    tx.set(doc(pointsRef(input.phoneKey)), {
      points: amount,
      reason: input.reason,
      balanceAfter: points,
      orderId: input.orderId ?? null,
      note: input.note ?? null,
      createdAt: serverTimestamp(),
    });

    return { balance: points };
  });
}

/**
 * Spends points against an order.
 *
 * The redemption is re-quoted from the *stored* balance inside the transaction
 * rather than trusting the amount the checkout page calculated: the page may
 * have been open for an hour, and the balance may have moved.
 *
 * `lifetimePoints` is deliberately untouched, so redeeming never costs a tier.
 */
export async function redeemPoints(input: {
  phoneKey: string;
  points: number;
  orderKyat: number;
  orderId?: string | null;
}): Promise<{ balance: number; discountKyat: number; pointsSpent: number }> {
  return runTransaction(db, async (tx) => {
    const ref = memberRef(input.phoneKey);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new MemberError('not-found');

    const existing = normalizeMember(input.phoneKey, snap.data());
    const quote = quoteRedemption(existing.loyalty.points, input.orderKyat, input.points);

    if (!quote.eligible || quote.points <= 0) throw new MemberError('insufficient-points');

    const points = existing.loyalty.points - quote.points;

    tx.update(ref, {
      loyalty: {
        points,
        lifetimePoints: existing.loyalty.lifetimePoints,
        tier: existing.loyalty.tier,
      },
      updatedAt: serverTimestamp(),
    });

    tx.set(doc(pointsRef(input.phoneKey)), {
      // Negative, so summing the ledger reproduces the balance exactly.
      points: -quote.points,
      reason: 'redemption' satisfies PointsReason,
      balanceAfter: points,
      orderId: input.orderId ?? null,
      note: null,
      createdAt: serverTimestamp(),
    });

    return { balance: points, discountKyat: quote.discountKyat, pointsSpent: quote.points };
  });
}

/**
 * Standalone ledger append, for backfilling history without moving a balance.
 * Kept separate from `awardPoints` so it cannot be mistaken for one.
 */
export async function appendPointsNote(
  phoneKey: string,
  entry: Pick<PointsEntry, 'points' | 'reason' | 'balanceAfter' | 'note'>,
): Promise<void> {
  await addDoc(pointsRef(phoneKey), {
    ...entry,
    orderId: null,
    createdAt: serverTimestamp(),
  });
}
