/**
 * Sign in — phone/OTP, email/password or Google.
 *
 * Phone is the default method, deliberately: it is the identifier the shop
 * already holds for every walk-in customer, there is no password to forget, and
 * it is the only method that produces a membership record on its own.
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AuthAlert } from '@/app/components/auth/auth-alert';
import { AuthShell } from '@/app/components/auth/auth-shell';
import { EmailAuthForm } from '@/app/components/auth/email-auth-form';
import { GoogleButton } from '@/app/components/auth/google-button';
import { Divider, MethodTabs } from '@/app/components/auth/method-tabs';
import { PhoneAuthForm } from '@/app/components/auth/phone-auth-form';
import { ROUTES } from '@/app/config/navigation';
import { resolveErrorKey, signInWithGoogle } from '@/lib/auth';
import type { ClaimResult } from '@/lib/firestore/members';
import { hasCompletedOnboarding } from '@/lib/membership';

export function SignInPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [googleBusy, setGoogleBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  /**
   * Where the customer was headed before a guard intercepted them. Falls back to
   * the account page rather than home — someone who just signed in almost always
   * wants to see their own account.
   */
  const intended =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? ROUTES.account;

  /** Phone sign-in yields a member record, so onboarding can be checked at once. */
  const handlePhoneComplete = (result: ClaimResult) => {
    navigate(hasCompletedOnboarding(result.member) ? intended : ROUTES.onboarding, {
      replace: true,
    });
  };

  /**
   * Email and Google leave the customer signed in but with no phone number, and
   * therefore no member record. Routing is left to the guards: `RequireMember`
   * sends them to the account page, which hosts the phone-linking form.
   */
  const handleCredentialSuccess = () => navigate(intended, { replace: true });

  const handleGoogle = async () => {
    setErrorKey(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      handleCredentialSuccess();
    } catch (error) {
      setErrorKey(resolveErrorKey(error));
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.signInTitle')}
      description={t('auth.signInDescription')}
      footer={
        <p>
          {t('auth.noAccount')}{' '}
          <Link
            to={ROUTES.signUp}
            className="font-medium text-primary transition-colors hover:underline"
          >
            {t('actions.signUp')}
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
          <PhoneAuthForm mode="signin" onComplete={handlePhoneComplete} />
        ) : (
          <EmailAuthForm mode="signin" onSuccess={handleCredentialSuccess} />
        )}

        <Divider label={t('auth.orContinueWith')} />

        <GoogleButton onClick={() => void handleGoogle()} loading={googleBusy} />
      </div>
    </AuthShell>
  );
}
