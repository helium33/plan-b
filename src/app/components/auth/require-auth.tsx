/**
 * Route guards.
 *
 * The subtlety in all three is the `loading` state. Firebase restores a session
 * from IndexedDB asynchronously, so for the first few hundred milliseconds after
 * a hard refresh a signed-in customer looks signed out. A guard that treats that
 * as "unauthenticated" bounces them to the sign-in page every time they reload
 * their account — so each guard renders a spinner until the answer is known.
 */
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';

/** Full-height spinner, sized so the header does not jump when it resolves. */
function AuthPending() {
  const { t } = useTranslation();

  return (
    <div className="grid flex-1 place-items-center py-24" aria-busy="true">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        <p className="text-sm">{t('common.loading')}</p>
      </div>
    </div>
  );
}

/**
 * Requires a signed-in user.
 *
 * The attempted path is passed to the sign-in page in router state, so after
 * signing in the customer lands where they were going instead of on the home
 * page having forgotten why they signed in.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isSignedIn } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthPending />;

  if (!isSignedIn) {
    return <Navigate to={ROUTES.signIn} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

/**
 * Requires a signed-in user **with a member record** — that is, a verified phone
 * number. Anything touching loyalty points needs this rather than `RequireAuth`,
 * since without a phone key there is no document to read points from.
 */
export function RequireMember({ children }: { children: ReactNode }) {
  const { isLoading, isSignedIn, isMemberLoading, needsPhoneLink } = useAuth();
  const location = useLocation();

  if (isLoading || isMemberLoading) return <AuthPending />;

  if (!isSignedIn) {
    return <Navigate to={ROUTES.signIn} replace state={{ from: location }} />;
  }

  // Signed in but no phone linked. The account page hosts the linking form, so
  // send them there rather than to a dead end.
  if (needsPhoneLink && location.pathname !== ROUTES.account) {
    return <Navigate to={ROUTES.account} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

/**
 * Keeps signed-in customers off the sign-in and sign-up pages.
 *
 * Without this, the header's "Sign in" link stays reachable after signing in and
 * offers to authenticate someone who already is.
 *
 * The exception is a customer mid-signup: they have an email or Google account
 * but no verified phone yet, and the sign-up page hosts that final step inline.
 * Redirecting them here would strand them one step from a finished account.
 */
export function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  const { isLoading, isSignedIn, isMemberLoading, needsPhoneLink } = useAuth();

  if (isLoading || (isSignedIn && isMemberLoading)) return <AuthPending />;
  if (isSignedIn && !needsPhoneLink) return <Navigate to={ROUTES.account} replace />;

  return <>{children}</>;
}
