/**
 * The read side of auth for components.
 *
 * Exposes named booleans rather than making every consumer re-derive
 * `status === 'authenticated' && memberStatus === 'ready'`. Each of those
 * expressions is a chance to forget the `loading` case and flash the wrong UI.
 */
import { useCallback } from 'react';

import { signOut as authSignOut } from '@/lib/auth';
import {
  hasCompletedOnboarding,
  nextTierProgress,
  type MemberDoc,
} from '@/lib/membership';
import { useAuthStore } from '@/app/stores/auth-store';

export type UseAuth = {
  /** True until Firebase has restored (or ruled out) a stored session. */
  isLoading: boolean;
  isSignedIn: boolean;

  user: ReturnType<typeof useAuthStore.getState>['user'];
  member: MemberDoc | null;
  phoneKey: string | null;

  /** True while the member record is still being fetched. */
  isMemberLoading: boolean;
  /**
   * Signed in, but no verified phone number — so no member record and nowhere
   * to hold loyalty points. Prompt for a number.
   */
  needsPhoneLink: boolean;
  /** Signed in with a phone, but the personalisation form is unanswered. */
  needsOnboarding: boolean;

  points: number;
  lifetimePoints: number;
  tier: MemberDoc['loyalty']['tier'] | null;
  tierProgress: ReturnType<typeof nextTierProgress>;

  memberErrorKey: string | null;
  signOut: () => Promise<void>;
};

export function useAuth(): UseAuth {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const member = useAuthStore((s) => s.member);
  const phoneKey = useAuthStore((s) => s.phoneKey);
  const memberStatus = useAuthStore((s) => s.memberStatus);
  const memberErrorKey = useAuthStore((s) => s.memberErrorKey);

  const signOut = useCallback(() => authSignOut(), []);

  const isSignedIn = status === 'authenticated';
  const lifetimePoints = member?.loyalty.lifetimePoints ?? 0;

  return {
    isLoading: status === 'loading',
    isSignedIn,
    user,
    member,
    phoneKey,

    isMemberLoading: memberStatus === 'loading',
    needsPhoneLink: isSignedIn && memberStatus === 'missing-phone',
    // Deliberately false while the member record is still loading, so a guard
    // does not bounce a returning customer into onboarding they finished months
    // ago just because Firestore had not answered yet.
    needsOnboarding: isSignedIn && memberStatus === 'ready' && !hasCompletedOnboarding(member),

    points: member?.loyalty.points ?? 0,
    lifetimePoints,
    tier: member?.loyalty.tier ?? null,
    tierProgress: member ? nextTierProgress(lifetimePoints) : null,

    memberErrorKey,
    signOut,
  };
}
