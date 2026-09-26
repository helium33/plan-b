/**
 * Sign in — open to any Google account.
 *
 * ── Two audiences, one page ────────────────────────────────────────────────
 * Signing in is not required to browse or to build an order; the app works
 * entirely without it. What an account buys is that the shop can put a name to
 * a Telegram order, and — for the two owner addresses — access to the catalogue
 * tools. So this page is reachable from the top bar by anyone, and it says
 * plainly which of the two things you have.
 *
 * Google is the headline method because it is the one that works on a shop
 * phone with no password to forget. Email and password stays for staff accounts
 * created in the console.
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AuthAlert } from '@/app/components/auth/auth-alert';
import { EmailAuthForm } from '@/app/components/auth/email-auth-form';
import { GoogleButton } from '@/app/components/auth/google-button';
import { LogoMark } from '@/app/components/common/logo';
import { Button } from '@/app/components/ui/button';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { useIsAdmin } from '@/app/hooks/use-is-admin';
import { resolveErrorKey, signInWithGoogle } from '@/lib/auth';

export function SignInPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('auth.signInTitle'));

  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn, user, signOut } = useAuth();
  const { isAdmin, checking } = useIsAdmin();

  const [googleBusy, setGoogleBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  /**
   * Where a guard intercepted them, if one did.
   *
   * Falls back to the catalogue rather than the admin area: most people signing
   * in now are buyers, and sending them to a page they cannot open would be a
   * strange welcome.
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

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-12">
      <header className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
          <LogoMark className="h-5 w-9" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
          {isSignedIn ? t('auth.signedInTitle') : t('auth.signInTitle')}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isSignedIn ? t('auth.signedInDescription') : t('auth.signInDescription')}
        </p>
      </header>

      {isSignedIn ? (
        <div className="mt-8 space-y-4">
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
          </div>

          {/* Only shown once the admin check has resolved, so a buyer never sees
              the catalogue link flash before it is taken away again. */}
          {!checking && isAdmin ? (
            <Button asChild size="lg" className="min-h-11 w-full">
              <Link to={ROUTES.admin}>
                <ShieldCheck className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                {t('auth.openAdmin')}
              </Link>
            </Button>
          ) : null}

          <Button
            type="button"
            size="lg"
            variant="outline"
            className="min-h-11 w-full"
            onClick={() => void signOut()}
          >
            <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {t('auth.signOut')}
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {errorKey ? <AuthAlert messageKey={errorKey} /> : null}

          <GoogleButton onClick={() => void handleGoogle()} loading={googleBusy} />

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{t('auth.orContinueWith')}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <EmailAuthForm onSuccess={onSuccess} />
        </div>
      )}

      <Link
        to={ROUTES.catalog}
        className="mx-auto mt-10 inline-flex min-h-11 items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
        <span className="font-myanmar">{t('auth.backToCatalog')}</span>
      </Link>
    </div>
  );
}
