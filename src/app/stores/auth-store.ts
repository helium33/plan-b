/**
 * Staff session state.
 *
 * Unlike the theme and draft-order stores this one is **not** persisted.
 * Firebase already persists the session in IndexedDB and is the only thing that
 * can validate a token; a mirrored copy in localStorage would let a stale
 * "signed in" survive a revoked account and flash the admin UI before Firebase
 * corrected it.
 *
 * `AuthProvider` is the only writer. Components read through `useAuth`.
 */
import { create } from 'zustand';

import type { PosRole } from '@/lib/pos/schema';

/**
 * A plain snapshot of the Firebase `User`.
 *
 * The SDK's `User` is a live mutable object with methods; putting it in a store
 * means components never re-render when its fields change, because the object
 * identity stays the same. Copying the fields we display makes updates
 * observable. Operations still go through `auth.currentUser`.
 */
export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
};

/**
 * The custom claims on the ID token — the same two values `firestore.rules`
 * reads. `null` until the token has been decoded, and for accounts the POS has
 * not given a role.
 */
export type AuthClaims = {
  role: PosRole | null;
  /** The POS shop a `SHOP` account belongs to. */
  shopId: string | null;
};

export const NO_CLAIMS: AuthClaims = { role: null, shopId: null };

/**
 * `loading` covers the gap between first paint and Firebase restoring the
 * session from IndexedDB. Route guards must wait it out — treating it as
 * signed-out bounces a signed-in admin to the sign-in page on every refresh.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  claims: AuthClaims;
  /** False until the claims for the current user have been read at least once. */
  claimsReady: boolean;
  setSession: (user: AuthUser | null) => void;
  setClaims: (claims: AuthClaims) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  claims: NO_CLAIMS,
  claimsReady: false,

  // A different user always starts with no claims: carrying the previous
  // user's role across a sign-out would, for one render, show the next person
  // the last person's shop. The same user keeps theirs while they are re-read,
  // so a repeat notification from Firebase does not flicker the Credit tab.
  setSession: (user) =>
    set((state) =>
      !user
        ? { status: 'unauthenticated', user: null, claims: NO_CLAIMS, claimsReady: true }
        : state.user?.uid === user.uid
          ? { status: 'authenticated', user }
          : { status: 'authenticated', user, claims: NO_CLAIMS, claimsReady: false },
    ),

  setClaims: (claims) => set({ claims, claimsReady: true }),
}));
