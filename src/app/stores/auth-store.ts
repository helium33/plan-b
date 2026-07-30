/**
 * Auth session state.
 *
 * Unlike the theme store this one is **not** persisted. Firebase already
 * persists the session in IndexedDB and is the only thing that can validate a
 * token; a mirrored copy in localStorage would let a stale "signed in" survive
 * a revoked account and flash private UI before Firebase corrected it.
 *
 * `AuthProvider` is the only writer. Components read through `useAuth`.
 */
import { create } from 'zustand';

import type { MemberDoc } from '@/lib/membership';

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
  phoneNumber: string | null;
  emailVerified: boolean;
  providerIds: string[];
};

/**
 * `loading` covers the gap between first paint and Firebase restoring the
 * session from IndexedDB. Route guards must wait it out — treating it as
 * signed-out bounces a signed-in customer to the sign-in page on every refresh.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * The member record's own lifecycle, separate from the Auth session.
 *
 * `missing-phone` is the interesting one: the customer is signed in with email
 * or Google, but has no verified phone number, so no member record exists yet.
 * They can browse, but there is nowhere to put loyalty points until they link a
 * number — the phone *is* the member key.
 */
export type MemberStatus = 'idle' | 'loading' | 'ready' | 'missing-phone' | 'error';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;

  member: MemberDoc | null;
  /** Member document id — E.164 without the `+`. */
  phoneKey: string | null;
  memberStatus: MemberStatus;
  /** Translation key for a member-load failure, if one occurred. */
  memberErrorKey: string | null;

  setSession: (user: AuthUser | null) => void;
  setMemberLoading: () => void;
  setMember: (phoneKey: string, member: MemberDoc | null) => void;
  setMissingPhone: () => void;
  setMemberError: (messageKey: string) => void;
  reset: () => void;
};

const EMPTY_MEMBER = {
  member: null,
  phoneKey: null,
  memberStatus: 'idle' as MemberStatus,
  memberErrorKey: null,
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  ...EMPTY_MEMBER,

  setSession: (user) =>
    set(
      user
        ? { status: 'authenticated', user }
        : // Signing out must clear the member too, or the next customer on a
          // shared machine briefly sees the previous one's points.
          { status: 'unauthenticated', user: null, ...EMPTY_MEMBER },
    ),

  setMemberLoading: () => set({ memberStatus: 'loading', memberErrorKey: null }),

  setMember: (phoneKey, member) =>
    set({
      phoneKey,
      member,
      // A pointer that resolves to nothing means the record was deleted while
      // the pointer survived, which is the same practical state as no phone.
      memberStatus: member ? 'ready' : 'missing-phone',
      memberErrorKey: null,
    }),

  setMissingPhone: () =>
    set({ member: null, phoneKey: null, memberStatus: 'missing-phone', memberErrorKey: null }),

  setMemberError: (messageKey) => set({ memberStatus: 'error', memberErrorKey: messageKey }),

  reset: () => set({ status: 'unauthenticated', user: null, ...EMPTY_MEMBER }),
}));
