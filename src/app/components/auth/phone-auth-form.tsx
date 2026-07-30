/**
 * Phone number → SMS code → member record, in two steps.
 *
 * Used in three places with the same code path:
 *   - sign-in page  (`mode="signin"`) — signs in, creating the Auth user if new
 *   - sign-up page  (`mode="signin"`) — identical; a phone number *is* the signup
 *   - account page  (`mode="link"`)   — attaches a number to an email/Google user
 *
 * Whichever mode ran, the final step is the same `claimPhoneForUser` call, so
 * there is exactly one place where a phone number becomes a membership.
 */
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, MessageSquare, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/app/components/ui/input-otp';
import { PhoneField } from '@/app/components/auth/fields';
import { AuthAlert } from '@/app/components/auth/auth-alert';
import {
  type OtpSession,
  confirmOtp,
  providerIdsFor,
  resetRecaptcha,
  resolveErrorKey,
  startPhoneLink,
  startPhoneSignIn,
} from '@/lib/auth';
import { auth } from '@/lib/firebase';
import { type ClaimResult, claimPhoneForUser } from '@/lib/firestore/members';
import { formatPhone, parsePhone } from '@/lib/phone';

/** The invisible reCAPTCHA needs a real node; only one form mounts at a time. */
const RECAPTCHA_CONTAINER_ID = 'pbv-recaptcha-container';

const OTP_LENGTH = 6;

/** Firebase rate-limits resends; a minute is the shortest interval it tolerates. */
const RESEND_SECONDS = 60;

export type PhoneAuthFormProps = {
  mode: 'signin' | 'link';
  onComplete: (result: ClaimResult) => void;
  /** Rendered under the phone step — used for the "or use email" divider. */
  children?: React.ReactNode;
};

export function PhoneAuthForm({ mode, onComplete, children }: PhoneAuthFormProps) {
  const { t } = useTranslation();

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [session, setSession] = useState<OtpSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Survives unmount-during-request: an await that resolves after the customer
  // has navigated away must not call setState on a dead component.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // A verifier left behind rejects the next attempt with an opaque error,
      // so tear it down whenever this form goes away.
      resetRecaptcha();
    };
  }, []);

  /** Resend cooldown. `setInterval`, not rAF, so it ticks in a hidden tab too. */
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft]);

  const sendCode = useCallback(
    async (rawPhone: string) => {
      setBusy(true);
      setErrorKey(null);

      try {
        const next =
          mode === 'link'
            ? await startPhoneLink(rawPhone, RECAPTCHA_CONTAINER_ID)
            : await startPhoneSignIn(rawPhone, RECAPTCHA_CONTAINER_ID);

        if (!mounted.current) return;

        setSession(next);
        setStep('code');
        setCode('');
        setSecondsLeft(RESEND_SECONDS);
      } catch (error) {
        if (mounted.current) setErrorKey(resolveErrorKey(error));
      } finally {
        if (mounted.current) setBusy(false);
      }
    },
    [mode],
  );

  const handlePhoneSubmit = (event: FormEvent) => {
    event.preventDefault();
    // Validate before spending an SMS — the network round trip is the expensive
    // part, and Firebase's own error for a malformed number is unhelpful.
    if (!parsePhone(phone).ok) {
      setErrorKey('auth.errors.invalidPhone');
      return;
    }
    void sendCode(phone);
  };

  const verify = useCallback(
    async (value: string) => {
      if (!session) return;

      setBusy(true);
      setErrorKey(null);

      try {
        const credential = await confirmOtp(session, value);

        // In `link` mode the credential belongs to the already signed-in user;
        // in `signin` mode it is a fresh session. Either way `auth.currentUser`
        // is now the right user, and it carries the full provider list that
        // `credential.user` may not yet reflect after a link.
        const user = auth.currentUser ?? credential.user;

        const result = await claimPhoneForUser({
          uid: user.uid,
          phone: session.phone,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          authProviders: providerIdsFor(user),
        });

        if (mounted.current) onComplete(result);
      } catch (error) {
        if (!mounted.current) return;
        setErrorKey(resolveErrorKey(error));
        // Clear the field so the customer retypes rather than editing six boxes
        // that already look full.
        setCode('');
        setBusy(false);
      }
    },
    [session, onComplete],
  );

  /** Auto-submits on the sixth digit — nobody wants to press a button as well. */
  const handleCodeChange = (value: string) => {
    setCode(value);
    if (value.length === OTP_LENGTH) void verify(value);
  };

  const restart = () => {
    resetRecaptcha();
    setStep('phone');
    setSession(null);
    setCode('');
    setErrorKey(null);
    setSecondsLeft(0);
  };

  return (
    <div className="space-y-6">
      {/* Firebase renders the invisible challenge here. It must stay mounted
          across both steps: unmounting it mid-flow invalidates the token. */}
      <div id={RECAPTCHA_CONTAINER_ID} />

      {errorKey ? <AuthAlert messageKey={errorKey} /> : null}

      {step === 'phone' ? (
        <form onSubmit={handlePhoneSubmit} className="space-y-5" noValidate>
          <PhoneField value={phone} onChange={setPhone} disabled={busy} autoFocus />

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <MessageSquare className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
            )}
            {t('auth.sendCode')}
          </Button>

          {children}
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="space-y-5"
        >
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              {t('auth.codeSentTo')}{' '}
              <span className="font-medium text-foreground" dir="ltr">
                {formatPhone(session?.phone ?? phone)}
              </span>
            </p>

            <button
              type="button"
              onClick={restart}
              disabled={busy}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:underline disabled:opacity-50"
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
              {t('auth.changeNumber')}
            </button>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="pbv-otp"
              className="block text-sm font-medium text-foreground"
            >
              {t('auth.codeLabel')}
            </label>

            <InputOTP
              id="pbv-otp"
              maxLength={OTP_LENGTH}
              value={code}
              onChange={handleCodeChange}
              disabled={busy}
              // Lets iOS and Android offer the code straight from the SMS.
              autoComplete="one-time-code"
              containerClassName="justify-center sm:justify-start"
            >
              <InputOTPGroup>
                {Array.from({ length: OTP_LENGTH }, (_, index) => (
                  <InputOTPSlot key={index} index={index} className="h-11 w-11 text-base" />
                ))}
              </InputOTPGroup>
            </InputOTP>

            <p className="text-xs text-muted-foreground">{t('auth.codeHint')}</p>
          </div>

          {busy ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('auth.verifying')}
            </p>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void sendCode(session?.phone ?? phone)}
              disabled={secondsLeft > 0}
              className="px-0 hover:bg-transparent hover:underline"
            >
              {secondsLeft > 0
                ? t('auth.resendIn', { seconds: secondsLeft })
                : t('auth.resendCode')}
            </Button>
          )}

          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
              strokeWidth={2}
              aria-hidden="true"
            />
            {t('auth.otpReassurance')}
          </p>
        </motion.div>
      )}
    </div>
  );
}
