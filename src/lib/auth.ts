/**
 * Firebase Auth operations, wrapped so components never touch the SDK directly.
 *
 * Two things are centralised here:
 *
 *  1. **Error translation.** Firebase throws codes like `auth/invalid-credential`.
 *     Every function in this file converts those into a translation *key*, not
 *     an English sentence, so the message renders in whichever language the
 *     customer is reading. A raw Firebase code must never reach the screen.
 *
 *  2. **reCAPTCHA lifecycle.** Phone auth needs a verifier that has to be torn
 *     down and rebuilt after any failure. Getting that wrong produces an OTP
 *     form that works exactly once per page load, so it lives in one place.
 */
import {
  type ConfirmationResult,
  type User,
  type UserCredential,
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  linkWithPhoneNumber,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';
import type { AuthProviderId } from '@/lib/membership';
import { parsePhone } from '@/lib/phone';

/* ── Error handling ────────────────────────────────────────────────────────── */

/**
 * A failure with a message the UI can actually show.
 *
 * `messageKey` is an i18next path under `auth.errors`. `code` is kept for
 * logging and for the few call sites that need to branch (an
 * `account-exists-with-different-credential` needs a different recovery flow
 * from a wrong password).
 */
export class AuthError extends Error {
  constructor(
    readonly code: string,
    readonly messageKey: string,
  ) {
    super(`${code} → ${messageKey}`);
    this.name = 'AuthError';
  }
}

/**
 * Firebase code → translation key.
 *
 * Anything unmapped falls back to a generic message rather than leaking an
 * internal code, but is still logged in development so it can be added here.
 */
const ERROR_KEYS: Record<string, string> = {
  'auth/invalid-email': 'auth.errors.invalidEmail',
  'auth/user-disabled': 'auth.errors.userDisabled',
  'auth/user-not-found': 'auth.errors.invalidCredential',
  'auth/wrong-password': 'auth.errors.invalidCredential',
  // Modern Firebase collapses wrong-password and user-not-found into this, on
  // purpose: telling an attacker which half was wrong is an account-enumeration
  // gift. The message stays deliberately vague for the same reason.
  'auth/invalid-credential': 'auth.errors.invalidCredential',
  'auth/email-already-in-use': 'auth.errors.emailInUse',
  'auth/weak-password': 'auth.errors.weakPassword',
  'auth/missing-password': 'auth.errors.missingPassword',
  'auth/too-many-requests': 'auth.errors.tooManyRequests',
  'auth/network-request-failed': 'auth.errors.network',
  'auth/popup-closed-by-user': 'auth.errors.popupClosed',
  'auth/cancelled-popup-request': 'auth.errors.popupClosed',
  'auth/popup-blocked': 'auth.errors.popupBlocked',
  'auth/account-exists-with-different-credential': 'auth.errors.accountExists',
  'auth/credential-already-in-use': 'auth.errors.phoneInUse',
  'auth/provider-already-linked': 'auth.errors.providerLinked',
  'auth/invalid-verification-code': 'auth.errors.invalidCode',
  'auth/missing-verification-code': 'auth.errors.invalidCode',
  'auth/code-expired': 'auth.errors.codeExpired',
  'auth/invalid-phone-number': 'auth.errors.invalidPhone',
  'auth/missing-phone-number': 'auth.errors.invalidPhone',
  'auth/quota-exceeded': 'auth.errors.quotaExceeded',
  'auth/captcha-check-failed': 'auth.errors.captchaFailed',
  'auth/operation-not-allowed': 'auth.errors.operationNotAllowed',
  'auth/requires-recent-login': 'auth.errors.requiresRecentLogin',
  'auth/unauthorized-domain': 'auth.errors.unauthorizedDomain',
  // Raised by our own member layer (`MemberError`), which also carries a `code`.
  'phone-claimed': 'auth.errors.phoneClaimed',
  'invalid-phone': 'auth.errors.invalidPhone',
  'not-found': 'auth.errors.memberLoad',
  'insufficient-points': 'auth.errors.insufficientPoints',
};

/**
 * The translation key for any error thrown by this file or the member layer.
 *
 * Components call this instead of inspecting error types, so a `catch` block
 * that receives an `AuthError`, a `MemberError` or an unexpected `TypeError` all
 * end up showing a sentence in the customer's language rather than a stack trace
 * or a blank alert.
 */
export function resolveErrorKey(error: unknown): string {
  if (error instanceof AuthError) return error.messageKey;

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    if (ERROR_KEYS[code]) return ERROR_KEYS[code];
  }

  if (import.meta.env.DEV) console.warn('[auth] unrecognised error:', error);
  return 'auth.errors.generic';
}

function toAuthError(error: unknown): AuthError {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : 'unknown';

  const messageKey = ERROR_KEYS[code];

  if (!messageKey && import.meta.env.DEV) {
    // Surfaced in development only — an unmapped code is a missing translation,
    // which is a bug worth seeing rather than swallowing.
    console.warn('[auth] unmapped Firebase error code:', code, error);
  }

  return new AuthError(code, messageKey ?? 'auth.errors.generic');
}

/** Runs a Firebase call and rethrows anything it throws as an `AuthError`. */
async function guard<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw toAuthError(error);
  }
}

/* ── Email and password ────────────────────────────────────────────────────── */

export function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  return guard(() => signInWithEmailAndPassword(auth, email.trim(), password));
}

/**
 * Creates an account and sets the display name in the same step, so the header
 * greeting is correct on the very first render rather than after a refresh.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<UserCredential> {
  const credential = await guard(() =>
    createUserWithEmailAndPassword(auth, email.trim(), password),
  );

  const name = displayName?.trim();
  if (name) {
    await guard(() => updateProfile(credential.user, { displayName: name }));
  }

  return credential;
}

export function sendPasswordReset(email: string): Promise<void> {
  return guard(() => sendPasswordResetEmail(auth, email.trim()));
}

/* ── Google ────────────────────────────────────────────────────────────────── */

export function signInWithGoogle(): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  // Always show the chooser. Without this, a shared laptop silently signs in as
  // whoever used it last, which in a shop is a real privacy problem.
  provider.setCustomParameters({ prompt: 'select_account' });
  return guard(() => signInWithPopup(auth, provider));
}

/* ── Phone / OTP ───────────────────────────────────────────────────────────── */

let verifier: RecaptchaVerifier | null = null;

/**
 * Returns the invisible reCAPTCHA verifier, creating it if needed.
 *
 * Firebase requires a real DOM node that survives until the OTP is confirmed,
 * and reuses the widget's token per instance. `resetRecaptcha` must be called
 * after any failure — a spent verifier rejects every later attempt with an
 * opaque error, which is why this is not inlined into the component.
 *
 * @param containerId Id of an empty element already in the document.
 */
export function getRecaptcha(containerId: string): RecaptchaVerifier {
  if (verifier) return verifier;

  verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    // Fired when a token expires before use; dropping the instance forces a
    // fresh challenge on the next send instead of failing silently.
    'expired-callback': () => resetRecaptcha(),
  });

  return verifier;
}

/** Destroys the verifier so the next attempt starts from a clean widget. */
export function resetRecaptcha(): void {
  try {
    verifier?.clear();
  } catch {
    // `clear()` throws if the widget is already gone. Nothing to recover.
  }
  verifier = null;
}

export type OtpSession = {
  confirmationResult: ConfirmationResult;
  /** Canonical E.164 the code was sent to, for display and for the member key. */
  phone: string;
};

/**
 * Sends an OTP for sign-in, creating the Auth user if the number is new.
 *
 * @param rawPhone       Whatever the customer typed; normalised here.
 * @param containerId    Element hosting the invisible reCAPTCHA.
 */
export async function startPhoneSignIn(
  rawPhone: string,
  containerId: string,
): Promise<OtpSession> {
  const parsed = parsePhone(rawPhone);
  if (!parsed.ok) throw new AuthError('invalid-phone', 'auth.errors.invalidPhone');

  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      parsed.phone.e164,
      getRecaptcha(containerId),
    );
    return { confirmationResult, phone: parsed.phone.e164 };
  } catch (error) {
    resetRecaptcha();
    throw toAuthError(error);
  }
}

/**
 * Sends an OTP to attach a phone number to the account already signed in.
 *
 * This is the path an email or Google customer takes, and it matters: linking
 * keeps one person as one Auth user with two providers, instead of leaving them
 * with two accounts and their points split across both.
 */
export async function startPhoneLink(
  rawPhone: string,
  containerId: string,
): Promise<OtpSession> {
  const user = auth.currentUser;
  if (!user) throw new AuthError('no-current-user', 'auth.errors.generic');

  const parsed = parsePhone(rawPhone);
  if (!parsed.ok) throw new AuthError('invalid-phone', 'auth.errors.invalidPhone');

  try {
    const confirmationResult = await linkWithPhoneNumber(
      user,
      parsed.phone.e164,
      getRecaptcha(containerId),
    );
    return { confirmationResult, phone: parsed.phone.e164 };
  } catch (error) {
    resetRecaptcha();
    throw toAuthError(error);
  }
}

/** Confirms a 6-digit code against a pending session. */
export async function confirmOtp(session: OtpSession, code: string): Promise<UserCredential> {
  try {
    const credential = await session.confirmationResult.confirm(code.trim());
    // Success consumes the widget; the next send needs a new one.
    resetRecaptcha();
    return credential;
  } catch (error) {
    throw toAuthError(error);
  }
}

/* ── Session ───────────────────────────────────────────────────────────────── */

export function signOut(): Promise<void> {
  resetRecaptcha();
  return guard(() => fbSignOut(auth));
}

/** Provider ids linked to a user, narrowed to the three this site supports. */
export function providerIdsFor(user: User): AuthProviderId[] {
  const supported = new Set(['password', 'google.com', 'phone']);
  return user.providerData
    .map((entry) => entry.providerId)
    .filter((id): id is AuthProviderId => supported.has(id));
}
