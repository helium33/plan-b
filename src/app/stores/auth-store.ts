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
 * `loading` covers the gap between first paint and Firebase restoring the
 * session from IndexedDB. Route guards must wait it out — treating it as
 * signed-out bounces a signed-in admin to the sign-in page on every refresh.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  setSession: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,

  setSession: (user) =>
    set(user ? { status: 'authenticated', user } : { status: 'unauthenticated', user: null }),
}));
