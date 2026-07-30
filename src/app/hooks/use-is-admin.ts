/**
 * Whether the signed-in user is staff.
 *
 * Two ways to qualify, matching `isAdmin()` in both rulesets exactly:
 *
 *  1. A verified email on the `BOOTSTRAP_ADMIN_EMAILS` list — the owner, who must
 *     be able to reach the admin page on a fresh project before any allowlist
 *     document exists.
 *  2. An `admins/{uid}` document, which is how everyone else is added.
 *
 * The email check runs first and needs no network round trip, so the owner never
 * sees the admin area flicker while a Firestore read resolves.
 *
 * Deliberately fails **closed**: a read that errors — including the
 * permission-denied a normal customer gets — resolves to `false` rather than
 * throwing, so a network blip hides the admin tools instead of breaking the page.
 *
 * This gates *visibility* only. The rulesets are what actually stop a write.
 */
import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { useAuth } from '@/app/hooks/use-auth';
import { isBootstrapAdminEmail } from '@/config/admins';

export type UseIsAdmin = {
  isAdmin: boolean;
  checking: boolean;
  /** True when access comes from the email list rather than a stored document. */
  viaBootstrapEmail: boolean;
  /** True once an `admins/{uid}` document exists for this user. */
  hasAdminRecord: boolean;
  /**
   * Writes `admins/{uid}` so access survives removal from the bootstrap list.
   * Only succeeds for someone the rules already consider an admin.
   */
  claimAdminRecord: () => Promise<void>;
};

export function useIsAdmin(): UseIsAdmin {
  const { user, isLoading } = useAuth();

  const [hasAdminRecord, setHasAdminRecord] = useState(false);
  const [checking, setChecking] = useState(true);

  // `emailVerified` is checked here as well as in the rules. Without it the UI
  // would unlock for an unverified claim to the address and then every write
  // would be rejected — which looks like a broken admin page rather than a
  // refused one.
  const viaBootstrapEmail = Boolean(
    user && user.emailVerified && isBootstrapAdminEmail(user.email),
  );

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      setHasAdminRecord(false);
      setChecking(false);
      return;
    }

    let active = true;
    setChecking(true);

    getDoc(doc(db, 'admins', user.uid))
      .then((snap) => {
        if (active) setHasAdminRecord(snap.exists());
      })
      .catch(() => {
        // Permission denied is the expected answer for a normal customer.
        if (active) setHasAdminRecord(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [user, isLoading]);

  const claimAdminRecord = useCallback(async () => {
    if (!user) return;

    await setDoc(doc(db, 'admins', user.uid), {
      email: user.email,
      grantedAt: serverTimestamp(),
      // Records how the grant happened, so an audit later can tell a bootstrap
      // owner apart from a colleague added by hand.
      grantedVia: 'bootstrap-email',
    });

    setHasAdminRecord(true);
  }, [user]);

  return {
    isAdmin: viaBootstrapEmail || hasAdminRecord,
    checking,
    viaBootstrapEmail,
    hasAdminRecord,
    claimAdminRecord,
  };
}
