/**
 * The `users/{uid}` record, written on every sign-in.
 *
 * ── What this is for, and what it is not ───────────────────────────────────
 * It gives the shop a list of who has signed in, so a Telegram order from
 * "U Aung" can be matched to an account. It grants nothing: catalogue access is
 * decided entirely by `admins/{uid}` and the bootstrap email list, and a user
 * document with `role: 'admin'` written by a determined client would still be
 * refused every write by the rules.
 *
 * That separation is deliberate. A single collection holding both profile data
 * (which its owner must be able to write) and permissions (which they must not)
 * is a rule nobody can write correctly — so permissions live in a collection the
 * client cannot write at all.
 */
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { AuthUser } from '@/app/stores/auth-store';

export const USERS_COLLECTION = 'users';

/**
 * Creates or refreshes the signed-in user's own record.
 *
 * `merge: true` so a returning user updates their last-seen stamp without
 * clobbering anything the shop added to the document by hand.
 *
 * Failures are swallowed on purpose. This is bookkeeping: if the write is
 * refused or the network drops, the person is still signed in and the app must
 * carry on. Throwing here would turn a successful sign-in into an error screen
 * over a record nobody is waiting for.
 */
export async function recordSignIn(user: AuthUser): Promise<void> {
  try {
    await setDoc(
      doc(db, USERS_COLLECTION, user.uid),
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        lastSignInAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[users] could not record sign-in:', error);
  }
}
