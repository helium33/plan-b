/**
 * Firebase Auth operations, wrapped so components never touch the SDK directly.
 *
 * ── Scope: staff only ──────────────────────────────────────────────────────
 * Wholesale buyers never sign in. They identify their shop on the voucher and
 * the order arrives from their own Telegram account, which is a stronger
 * identification than a password would be — so the only accounts this app has
 * are the staff ones that upload the catalogue.
 *
 * That is why the phone/OTP path is gone: it existed to key retail loyalty
 * records to a phone number, and there are no loyalty records any more.
 *
 * What remains centralised here is **error translation**. Firebase throws codes
 * like `auth/invalid-credential`; every function converts those into a
 * translation *key*, not an English sentence, so the message renders in whichever
 * language the reader chose. A raw Firebase code must never reach the screen.
 */
import {
  type UserCredential,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';

import { auth } from '@/lib/firebase-staff';

/* ── Error handling ────────────────────────────────────────────────────────── */

/**
 * A failure with a message the UI can actually show.
 *
 * `messageKey` is an i18next path under `auth.errors`. `code` is kept for
 * logging and for the few call sites that need to branch.
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

const ERROR_KEYS: Record<string, string> = {
  'auth/invalid-email': 'auth.errors.invalidEmail',
  'auth/user-disabled': 'auth.errors.userDisabled',
  'auth/user-not-found': 'auth.errors.invalidCredential',
  'auth/wrong-password': 'auth.errors.invalidCredential',
  // Modern Firebase collapses wrong-password and user-not-found into this, on
  // purpose: telling an attacker which half was wrong is an account-enumeration
  // gift. The message stays deliberately vague for the same reason.
  'auth/invalid-credential': 'auth.errors.invalidCredential',
  'auth/missing-password': 'auth.errors.missingPassword',
  'auth/too-many-requests': 'auth.errors.tooManyRequests',
  'auth/network-request-failed': 'auth.errors.network',
  'auth/popup-closed-by-user': 'auth.errors.popupClosed',
  'auth/cancelled-popup-request': 'auth.errors.popupClosed',
  'auth/popup-blocked': 'auth.errors.popupBlocked',
  'auth/account-exists-with-different-credential': 'auth.errors.accountExists',
  'auth/operation-not-allowed': 'auth.errors.operationNotAllowed',
  'auth/unauthorized-domain': 'auth.errors.unauthorizedDomain',
};

/**
 * The translation key for any error thrown by this file.
 *
 * Components call this instead of inspecting error types, so a `catch` block
 * that receives an `AuthError` or an unexpected `TypeError` both end up showing
 * a sentence in the reader's language rather than a stack trace.
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

/* ── Sign in ───────────────────────────────────────────────────────────────── */

export function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  return guard(() => signInWithEmailAndPassword(auth, email.trim(), password));
}

export function sendPasswordReset(email: string): Promise<void> {
  return guard(() => sendPasswordResetEmail(auth, email.trim()));
}

export function signInWithGoogle(): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  // Always show the chooser. Without this, a shared shop laptop silently signs
  // in as whoever used it last.
  provider.setCustomParameters({ prompt: 'select_account' });
  return guard(() => signInWithPopup(auth, provider));
}

export function signOut(): Promise<void> {
  return guard(() => fbSignOut(auth));
}
