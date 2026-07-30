/**
 * Email + password, in sign-in and sign-up modes.
 *
 * One component for both because the fields and failure handling are 90% shared;
 * the differences are declared once in `isSignUp` rather than duplicated across
 * two files that then drift apart.
 *
 * Note what happens *after* success: an email account has no phone number, and
 * the phone number is the membership key, so the parent is told to move the
 * customer on to phone verification rather than treating this as done.
 */
import { type FormEvent, useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { PasswordField, TextField } from '@/app/components/auth/fields';
import { AuthAlert } from '@/app/components/auth/auth-alert';
import { resolveErrorKey, sendPasswordReset, signInWithEmail, signUpWithEmail } from '@/lib/auth';

/** Firebase enforces 6; 8 is the shortest length worth calling a password. */
const MIN_PASSWORD_LENGTH = 8;

export type EmailAuthFormProps = {
  mode: 'signin' | 'signup';
  onSuccess: () => void;
};

export function EmailAuthForm({ mode, onSuccess }: EmailAuthFormProps) {
  const { t } = useTranslation();
  const isSignUp = mode === 'signup';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [noticeKey, setNoticeKey] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /**
   * Client-side checks only for things Firebase cannot know or reports poorly.
   * Anything Firebase validates better (email deliverability, password reuse)
   * is left to it rather than reimplemented half-correctly here.
   */
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email.trim()) errors.email = t('auth.errors.emailRequired');
    if (!password) errors.password = t('auth.errors.missingPassword');

    if (isSignUp) {
      if (password && password.length < MIN_PASSWORD_LENGTH) {
        errors.password = t('auth.errors.passwordTooShort', { min: MIN_PASSWORD_LENGTH });
      }
      // Compared here because Firebase has no concept of a confirm field.
      if (confirm !== password) errors.confirm = t('auth.errors.passwordMismatch');
    }

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
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
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

      {isSignUp ? (
        <TextField
          label={t('auth.nameLabel')}
          value={name}
          onChange={setName}
          placeholder={t('auth.namePlaceholder')}
          autoComplete="name"
          disabled={busy}
        />
      ) : null}

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
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        error={fieldErrors.password}
        hint={isSignUp ? t('auth.passwordHint', { min: MIN_PASSWORD_LENGTH }) : undefined}
        disabled={busy}
      />

      {isSignUp ? (
        <PasswordField
          label={t('auth.confirmPasswordLabel')}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          error={fieldErrors.confirm}
          disabled={busy}
        />
      ) : null}

      {!isSignUp ? (
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
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Mail className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
        )}
        {isSignUp ? t('actions.signUp') : t('actions.signIn')}
      </Button>
    </form>
  );
}
