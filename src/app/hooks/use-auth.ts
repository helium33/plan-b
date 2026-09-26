/**
 * The read side of auth for components.
 *
 * Exposes named booleans rather than making every consumer re-derive
 * `status === 'authenticated'`. Each of those expressions is a chance to forget
 * the `loading` case and flash the wrong UI.
 */
import { useCallback } from 'react';

import { useAuthStore } from '@/app/stores/auth-store';

export type UseAuth = {
  /** True until Firebase has restored (or ruled out) a stored session. */
  isLoading: boolean;
  isSignedIn: boolean;
  user: ReturnType<typeof useAuthStore.getState>['user'];
  signOut: () => Promise<void>;
};

export function useAuth(): UseAuth {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  /**
   * Imported on use, not at module scope.
   *
   * `useAuth` is called from the top bar and the voucher — both on the buyer's
   * critical path — and a static import of `lib/auth` would drag the whole
   * Firebase Auth SDK into the first paint through this hook alone, undoing the
   * split that `AuthProvider` exists to preserve.
   */
  const signOut = useCallback(async () => {
    const { signOut: doSignOut } = await import('@/lib/auth');
    await doSignOut();
  }, []);

  return {
    isLoading: status === 'loading',
    isSignedIn: status === 'authenticated',
    user,
    signOut,
  };
}
