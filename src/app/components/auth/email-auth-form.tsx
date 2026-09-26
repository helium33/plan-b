/**
 * Email + password sign-in for staff.
 *
 * There is no sign-up mode. Staff accounts are created in the Firebase console
 * and granted the catalogue through an `admins/{uid}` document — a self-serve
 * registration form on a page that leads to the upload tools would be an open
 * door to the one thing this app protects.
 */
import { type FormEvent, useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { PasswordField, TextField } from '@/app/components/auth/fields';
import { AuthAlert } from '@/app/components/auth/auth-alert';
import { resolveErrorKey, sendPasswordReset, signInWithEmail } from '@/lib/auth';

export function EmailAuthForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [noticeKey, setNoticeKey] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /**
   * Client-side checks only for things Firebase cannot know or reports poorly.
   * Anything Firebase validates better (email deliverability, credential
   * correctness) is left to it rather than reimplemented half-correctly here.
   */
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = t('auth.errors.emailRequired');
    if (!password) errors.password = t('auth.errors.missingPassword');

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorKey(null);
    setNoticeKey(null);
    if (!validate()) return;

    setBusy(true);
    try {
      await signInWithEmail(email, password);
      onSuccess();
    } catch (error) {
      setErrorKey(resolveErrorKey(error));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      setFieldErrors({ email: t('auth.errors.emailRequired') });
      return;
    }

    setErrorKey(null);
    setBusy(true);
    try {
      await sendPasswordReset(email);
      // Confirms the email was *sent*, not that an account exists — saying
      // otherwise would let anyone test which addresses are registered.
      setNoticeKey('auth.resetEmailSent');
    } catch (error) {
      setErrorKey(resolveErrorKey(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errorKey ? <AuthAlert messageKey={errorKey} /> : null}
      {noticeKey ? <AuthAlert messageKey={noticeKey} tone="success" /> : null}

      <TextField
        label={t('auth.emailLabel')}
        type="email"
        value={email}
        onChange={setEmail}
        placeholder={t('auth.emailPlaceholder')}
        autoComplete="email"
        error={fieldErrors.email}
        required
        disabled={busy}
      />

      <PasswordField
        label={t('auth.passwordLabel')}
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        error={fieldErrors.password}
        disabled={busy}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void handleReset()}
          disabled={busy}
          className="text-xs font-medium text-primary transition-colors hover:underline disabled:opacity-50"
        >
          {t('auth.forgotPassword')}
        </button>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Mail className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
        )}
        {t('actions.signIn')}
      </Button>
    </form>
  );
}
