/**
 * Bridges Firebase Auth and Firestore into the auth store.
 *
 * Mounted once, above the router. Two subscriptions run here:
 *
 *  1. `onAuthStateChanged` — the session itself, restored from IndexedDB on
 *     load, which is why the store starts in `loading`.
 *  2. `subscribeToMember` — a live listener on the member record, so points
 *     credited by shop staff at the till appear on the account page without a
 *     refresh.
 *
 * The member listener is torn down and re-established whenever the uid changes.
 * Leaking it across a sign-out would keep streaming one customer's balance into
 * the next customer's session.
 */
import { type ReactNode, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';

import { auth } from '@/lib/firebase';
import { getPhoneKeyForUid, subscribeToMember } from '@/lib/firestore/members';
import { providerIdsFor } from '@/lib/auth';
import { useAuthStore } from '@/app/stores/auth-store';
import { useWishlistSync } from '@/app/hooks/use-wishlist';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Mounted here rather than in a page: the merge must happen on sign-in wherever
  // the customer happens to be, and mounting it per-page would fire one merge per
  // rendered product card.
  useWishlistSync();

  useEffect(() => {
    // Read actions off the store directly rather than through a hook, so this
    // effect never re-runs and the auth listener is attached exactly once.
    const { setSession, setMemberLoading, setMember, setMissingPhone, setMemberError } =
      useAuthStore.getState();

    let unsubscribeMember: Unsubscribe | null = null;
    let activeUid: string | null = null;

    const stopMemberListener = () => {
      unsubscribeMember?.();
      unsubscribeMember = null;
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        stopMemberListener();
        activeUid = null;
        setSession(null);
        return;
      }

      setSession({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
        providerIds: providerIdsFor(user),
      });

      // The same user re-emitting (a token refresh, a profile update) must not
      // restart a working listener.
      if (activeUid === user.uid && unsubscribeMember) return;

      stopMemberListener();
      activeUid = user.uid;
      setMemberLoading();

      try {
        const phoneKey = await getPhoneKeyForUid(user.uid);

        // Guard against a sign-out that landed while the lookup was in flight;
        // without this the listener below would attach after the session ended.
        if (activeUid !== user.uid) return;

        if (!phoneKey) {
          // Signed in with email or Google and no phone linked yet. Expected,
          // not an error — the UI prompts for a number.
          setMissingPhone();
          return;
        }

        unsubscribeMember = subscribeToMember(
          phoneKey,
          (member) => setMember(phoneKey, member),
          () => setMemberError('auth.errors.memberLoad'),
        );
      } catch {
        if (activeUid === user.uid) setMemberError('auth.errors.memberLoad');
      }
    });

    return () => {
      stopMemberListener();
      unsubscribeAuth();
    };
  }, []);

  return <>{children}</>;
}
