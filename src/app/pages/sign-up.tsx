/**
 * Create an account.
 *
 * Two shapes, decided by whether a phone number is already verified:
 *
 *  1. **Choose a method** — phone/OTP (finishes in one step), or email/Google.
 *  2. **Verify your phone** — shown once an email or Google account exists but
 *     has no number attached.
 *
 * Step 2 is not optional flair. A membership record is keyed by phone number, so
 * an account without one has nowhere to hold loyalty points and cannot be matched
 * to the same customer walking into the shop. Presenting it as the natural last
 * step of signing up gets it done while the customer is still motivated, instead
 * of leaving a half-built account behind.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AuthAlert } from '@/app/components/auth/auth-alert';
import { AuthShell } from '@/app/components/auth/auth-shell';
import { EmailAuthForm } from '@/app/components/auth/email-auth-form';
import { GoogleButton } from '@/app/components/auth/google-button';
import { Divider, MethodTabs } from '@/app/components/auth/method-tabs';
import { PhoneAuthForm } from '@/app/components/auth/phone-auth-form';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { resolveErrorKey, signInWithGoogle } from '@/lib/auth';
import type { ClaimResult } from '@/lib/firestore/members';
import { LOYALTY, hasCompletedOnboarding } from '@/lib/membership';

export function SignUpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isSignedIn, needsPhoneLink, user } = useAuth();

  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [googleBusy, setGoogleBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  /**
   * The brief routes new customers to the personalisation form (Module 3) —
   * that is where the onboarding bonus is earned, so it is worth going straight
   * there while they are still in a form-filling frame of mind.
   */
  const finish = (result: ClaimResult) => {
    navigate(hasCompletedOnboarding(result.member) ? ROUTES.account : ROUTES.onboarding, {
      replace: true,
    });
  };

  const handleGoogle = async () => {
    setErrorKey(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      // No navigation: the provider will report `needsPhoneLink`, which flips
      // this page to the phone step below.
    } catch (error) {
      setErrorKey(resolveErrorKey(error));
    } finally {
      setGoogleBusy(false);
    }
  };

  /* ── Step 2: attach a phone number ─────────────────────────────────────── */

  if (isSignedIn && needsPhoneLink) {
    return (
      <AuthShell
        title={t('auth.verifyPhoneTitle')}
        description={t('auth.verifyPhoneDescription', { points: LOYALTY.signUpBonus })}
        footer={
          <p>
            {t('auth.signedInAs', { identity: user?.email ?? user?.displayName ?? '' })}{' '}
            <Link
              to={ROUTES.account}
              className="font-medium text-primary transition-colors hover:underline"
            >
              {t('auth.skipForNow')}
            </Link>
          </p>
        }
      >
        <PhoneAuthForm mode="link" onComplete={finish} />
      </AuthShell>
    );
  }

  /* ── Step 1: pick a method ─────────────────────────────────────────────── */

  return (
    <AuthShell
      title={t('auth.signUpTitle')}
      description={t('auth.signUpDescription', { points: LOYALTY.signUpBonus })}
      footer={
        <p>
          {t('auth.haveAccount')}{' '}
          <Link
            to={ROUTES.signIn}
            className="font-medium text-primary transition-colors hover:underline"
          >
            {t('actions.signIn')}
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <MethodTabs
          value={method}
          onChange={setMethod}
          options={[
            { value: 'phone', label: t('auth.methodPhone'), icon: Smartphone },
            { value: 'email', label: t('auth.methodEmail'), icon: KeyRound },
          ]}
        />

        {errorKey ? <AuthAlert messageKey={errorKey} /> : null}

        {method === 'phone' ? (
          <PhoneAuthForm mode="signin" onComplete={finish} />
        ) : (
          // No `onSuccess` navigation: creating the account flips this page to
          // the phone step, which is the same component either way.
          <EmailAuthForm mode="signup" onSuccess={() => undefined} />
        )}

        <Divider label={t('auth.orContinueWith')} />

        <GoogleButton onClick={() => void handleGoogle()} loading={googleBusy} />

        <p className="text-xs leading-relaxed text-muted-foreground">{t('auth.termsNotice')}</p>
      </div>
    </AuthShell>
  );
}
