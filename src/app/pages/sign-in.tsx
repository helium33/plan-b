/**
 * Sign in — the welcome screen.
 *
 * ── Who signs in here ──────────────────────────────────────────────────────
 * Shop accounts and sales reps, with the email and password the office set up
 * for them (see `npm run set-role` in the POS repo); staff who edit the
 * catalogue; and any buyer who wants their Telegram orders kept as history.
 * Email and password is the headline form because that is what a provisioned
 * shop account has. Google stays underneath it: buyers and the owner who
 * already sign in that way must not be locked out by a redesign.
 *
 * ── Signed in already ──────────────────────────────────────────────────────
 * The same screen shows the account instead of the form, with the way on —
 * the credit dashboard for anyone who has one, the catalogue admin for staff —
 * and a sign-out that goes through the goodbye screen.
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, ShieldCheck, UserRound, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AuthAlert } from '@/app/components/auth/auth-alert';
import { WelcomeScreen } from '@/app/components/auth/auth-screens';
import { EmailAuthForm } from '@/app/components/auth/email-auth-form';
import { GoogleButton } from '@/app/components/auth/google-button';
import { Button } from '@/app/components/ui/button';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { useIsAdmin } from '@/app/hooks/use-is-admin';
import { useRole } from '@/app/hooks/use-role';
import { resolveErrorKey, signInWithGoogle } from '@/lib/auth';

export function SignInPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('auth.signInTitle'));

  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn, user } = useAuth();
  const { isAdmin, checking } = useIsAdmin();
  const { role, ready, can } = useRole();

  const [googleBusy, setGoogleBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  /**
   * Where a guard intercepted them, if one did. Without one, the page stays
   * put and shows the account, so a person can see which account they are in.
   */
  const intended = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const onSuccess = () => {
    if (intended) navigate(intended, { replace: true });
  };

  const handleGoogle = async () => {
    setErrorKey(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (error) {
      setErrorKey(resolveErrorKey(error));
    } finally {
      setGoogleBusy(false);
    }
  };

  const backLink = (
    <Link
      to={ROUTES.catalog}
      className="mx-auto mt-8 inline-flex min-h-11 items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
      <span className="font-myanmar">{t('auth.backToCatalog')}</span>
    </Link>
  );

  if (isSignedIn) {
    return (
      <WelcomeScreen footer={backLink}>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-muted-foreground">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.displayName || t('auth.signedInFallbackName')}
              </p>
              <p className="truncate text-[0.78rem] text-muted-foreground" dir="ltr">
                {user?.email}
              </p>
            </div>

            {ready && role ? (
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[0.68rem] font-bold text-primary">
                <span className="font-myanmar">{t(`roles.${role}`)}</span>
              </span>
            ) : null}
          </div>

          {ready && can('credit:view') ? (
            <Button asChild size="lg" className="min-h-11 w-full">
              <Link to={ROUTES.credit}>
                <Wallet className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                <span className="font-myanmar">{t('account.openDashboard')}</span>
              </Link>
            </Button>
          ) : null}

          {/* Only once the admin check has resolved, so a buyer never sees
              the catalogue link flash before it is taken away again. */}
          {!checking && isAdmin ? (
            <Button asChild size="lg" variant="outline" className="min-h-11 w-full">
              <Link to={ROUTES.admin}>
                <ShieldCheck className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                {t('auth.openAdmin')}
              </Link>
            </Button>
          ) : null}

          <Button asChild size="lg" variant="outline" className="min-h-11 w-full">
            <Link to={ROUTES.goodbye} replace>
              <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              {t('auth.signOut')}
            </Link>
          </Button>
        </div>
      </WelcomeScreen>
    );
  }

  return (
    <WelcomeScreen footer={backLink}>
      <div className="space-y-5">
        {errorKey ? <AuthAlert messageKey={errorKey} /> : null}

        <EmailAuthForm onSuccess={onSuccess} />

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">{t('auth.orContinueWith')}</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <GoogleButton onClick={() => void handleGoogle()} loading={googleBusy} />
      </div>
    </WelcomeScreen>
  );
}
