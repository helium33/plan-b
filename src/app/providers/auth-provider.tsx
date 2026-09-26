/**
 * Bridges Firebase Auth into the auth store, app-wide.
 *
 * ── Why the SDK is imported inside the effect ──────────────────────────────
 * Auth is now needed on buyer screens — order history is tied to an account —
 * so this provider has to be mounted above the whole app rather than only above
 * the staff routes. A static import would then put `firebase/auth` on the
 * critical path of a catalogue most visitors browse without ever signing in.
 *
 * Importing it inside the effect keeps it off the first paint entirely: the
 * catalogue renders, then the SDK arrives and the session resolves a moment
 * later. Nothing breaks in the gap because every consumer already has to handle
 * `isLoading` — Firebase restores sessions from IndexedDB asynchronously, so
 * that state existed regardless.
 *
 * It also writes `users/{uid}` on each new session, so any Google account that
 * signs in is recorded without needing to be pre-registered. That write is
 * fire-and-forget; see `firestore/users.ts` for why a failure there must not
 * interrupt a successful sign-in.
 */
import { type ReactNode, useEffect } from 'react';

import { recordSignIn } from '@/lib/firestore/users';
import { useAuthStore } from '@/app/stores/auth-store';

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Read the action off the store directly rather than through a hook, so this
    // effect never re-runs and the listener is attached exactly once.
    const { setSession } = useAuthStore.getState();

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    // Tracks which uid has already been recorded, so a token refresh — which
    // re-fires the listener with the same user — does not re-write the document
    // on every hour-long refresh cycle.
    let recordedUid: string | null = null;

    void (async () => {
      const [{ auth }, { onAuthStateChanged }] = await Promise.all([
        import('@/lib/firebase-staff'),
        import('firebase/auth'),
      ]);

      // The component may have unmounted while the chunk was downloading;
      // attaching now would leak a listener with nothing to update.
      if (cancelled) return;

      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
          recordedUid = null;
          setSession(null);
          return;
        }

        const session = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
        };

        setSession(session);

        if (recordedUid !== user.uid) {
          recordedUid = user.uid;
          void recordSignIn(session);
        }
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return <>{children}</>;
}
