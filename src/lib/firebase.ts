/**
 * The single place Firebase is initialised.
 *
 * Everything else imports `auth`, `db` and `storage` from here — never calls
 * `initializeApp` again — so there is exactly one app instance, one auth
 * session and one emulator decision in the whole bundle.
 *
 * Config comes from `env.ts` (backed by `.env.local`) rather than being pasted
 * inline: the same source file then builds against staging and production
 * without an edit, and rotating a project means touching one gitignored file.
 * These values are public client identifiers, not secrets — the actual
 * protection is Firestore/Storage security rules (see `firestore.rules`).
 */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

import { env } from '@/lib/env';

/**
 * Vite's Fast Refresh re-executes this module on edit. `initializeApp` throws
 * on a duplicate app name, so reuse the existing instance if there is one.
 */
export const app = getApps().length ? getApp() : initializeApp(env.firebase);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Analytics needs a browser with cookies and measurement enabled, so it can
 * legitimately be unavailable (private mode, blockers, SSR). Callers await the
 * promise and skip logging when it resolves to `null` rather than crashing.
 */
export const analyticsPromise = env.firebase.measurementId
  ? isSupported().then((supported) => (supported ? getAnalytics(app) : null))
  : Promise.resolve(null);

if (env.useEmulators) {
  // `disableWarnings` silences the banner about unencrypted local traffic,
  // which is expected and otherwise drowns real console output.
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}
