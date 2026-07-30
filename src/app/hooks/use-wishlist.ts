/**
 * Wishlist access for components, and the sync that keeps local and stored lists
 * in step.
 *
 * `useWishlistSync` is mounted **once**, in `AuthProvider`'s subtree, and owns all
 * the write-through. `useWishlist` is the read/write surface every card uses. That
 * split matters: if each card ran its own sync effect, a grid of twenty frames
 * would fire twenty merges on sign-in.
 */
import { useCallback, useEffect, useRef } from 'react';

import { useAuth } from '@/app/hooks/use-auth';
import { useWishlistStore } from '@/app/stores/wishlist-store';
import {
  addToWishlist,
  mergeWishlist,
  removeFromWishlist,
  setWishlist,
} from '@/lib/firestore/wishlist';

/**
 * Keeps the local list and the member document in step. Mount once.
 *
 * On sign-in: merge local into stored, then push whatever was local-only.
 * While signed in: the member document is the source of truth, so a change made
 * on another device flows in through the existing member subscription.
 * On sign-out: clear, so a shared machine does not leak one customer's list to
 * the next.
 */
export function useWishlistSync(): void {
  const { isSignedIn, phoneKey, member } = useAuth();
  const mergeRemote = useWishlistStore((s) => s.mergeRemote);
  const reset = useWishlistStore((s) => s.reset);

  // Guards against merging twice for the same member — the member document
  // updates on every write, and each update would otherwise retrigger this.
  const mergedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      // Only reset on an actual transition to signed-out, not on first mount,
      // where it would wipe a guest's list before they ever signed in.
      if (mergedFor.current !== null) {
        mergedFor.current = null;
        reset();
      }
      return;
    }

    if (!phoneKey || !member) return;
    if (mergedFor.current === phoneKey) return;

    mergedFor.current = phoneKey;

    const remote = Array.isArray(member.wishlist) ? member.wishlist : [];
    const localOnly = mergeRemote(remote);

    if (localOnly.length > 0) {
      // Fire-and-forget: the local state is already correct, and a failed merge
      // simply retries on the next sign-in rather than blocking the UI.
      void mergeWishlist(phoneKey, localOnly).catch(() => undefined);
    }
  }, [isSignedIn, phoneKey, member, mergeRemote, reset]);
}

export type UseWishlist = {
  ids: string[];
  count: number;
  has: (frameId: string) => boolean;
  /** Optimistic locally, then written through when signed in. */
  toggle: (frameId: string) => void;
  clear: () => void;
  /** True when saves are only local, so the UI can offer sign-in. */
  isGuest: boolean;
};

export function useWishlist(): UseWishlist {
  const ids = useWishlistStore((s) => s.ids);
  const toggleLocal = useWishlistStore((s) => s.toggle);
  const clearLocal = useWishlistStore((s) => s.clear);

  const { isSignedIn, phoneKey } = useAuth();

  const toggle = useCallback(
    (frameId: string) => {
      const wasSaved = ids.includes(frameId);

      // Local first, always. The heart must respond to the tap, not to the
      // network — and if the write fails the local list is still what the
      // customer chose, which the next sign-in merge will reconcile.
      toggleLocal(frameId);

      if (!phoneKey) return;

      const write = wasSaved
        ? removeFromWishlist(phoneKey, frameId)
        : addToWishlist(phoneKey, frameId);

      void write.catch(() => undefined);
    },
    [ids, toggleLocal, phoneKey],
  );

  const clear = useCallback(() => {
    clearLocal();
    if (phoneKey) void setWishlist(phoneKey, []).catch(() => undefined);
  }, [clearLocal, phoneKey]);

  return {
    ids,
    count: ids.length,
    has: useCallback((frameId: string) => ids.includes(frameId), [ids]),
    toggle,
    clear,
    isGuest: !isSignedIn,
  };
}
