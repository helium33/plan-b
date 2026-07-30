/**
 * The saved-frames list on a member document.
 *
 * Stored as a `wishlist: string[]` field of frame ids rather than a subcollection.
 * A subcollection would be the reflex choice, but this list is small (tens of
 * items at most), always read in full, and never queried on its own — so a field
 * is one read instead of a collection query, and it arrives with the member
 * document the app already subscribes to. `arrayUnion` and `arrayRemove` keep
 * writes atomic without a transaction.
 */
import { arrayRemove, arrayUnion, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { MEMBERS_COLLECTION } from '@/lib/membership';

/**
 * Ceiling on saved frames.
 *
 * A Firestore document is capped at 1 MiB, which this could not approach — the
 * limit exists to stop the array growing unbounded if something ever loops, and
 * because a wishlist of hundreds is a search problem, not a wishlist.
 */
export const MAX_WISHLIST = 100;

const memberRef = (phoneKey: string) => doc(db, MEMBERS_COLLECTION, phoneKey);

export async function addToWishlist(phoneKey: string, frameId: string): Promise<void> {
  await updateDoc(memberRef(phoneKey), {
    wishlist: arrayUnion(frameId),
    updatedAt: serverTimestamp(),
  });
}

export async function removeFromWishlist(phoneKey: string, frameId: string): Promise<void> {
  await updateDoc(memberRef(phoneKey), {
    wishlist: arrayRemove(frameId),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Merges a guest's local list into the member's stored one.
 *
 * A union, not a replace, and that direction matters. Someone who saved three
 * frames on their phone as a guest and already has five on their account should
 * end up with eight — replacing either way silently throws work away, and the
 * customer has no way to know it happened.
 *
 * `arrayUnion` deduplicates server-side, so this is safe to call on every sign-in
 * without checking what is already there.
 *
 * @returns the ids that were sent, so the caller can report what merged.
 */
export async function mergeWishlist(phoneKey: string, localIds: string[]): Promise<string[]> {
  const unique = Array.from(new Set(localIds)).slice(0, MAX_WISHLIST);
  if (unique.length === 0) return [];

  await updateDoc(memberRef(phoneKey), {
    // Spread: `arrayUnion` takes varargs, not an array.
    wishlist: arrayUnion(...unique),
    updatedAt: serverTimestamp(),
  });

  return unique;
}

/** Replaces the whole list. Used by "clear all" on the wishlist page. */
export async function setWishlist(phoneKey: string, frameIds: string[]): Promise<void> {
  await updateDoc(memberRef(phoneKey), {
    wishlist: Array.from(new Set(frameIds)).slice(0, MAX_WISHLIST),
    updatedAt: serverTimestamp(),
  });
}
