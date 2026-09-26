/**
 * The single place Firebase is initialised.
 *
 * Everything else imports `app` and `db` from here — never calls
 * `initializeApp` again — so there is exactly one app instance and one emulator
 * decision in the whole bundle.
 *
 * ── Why Auth and Storage are not here ──────────────────────────────────────
 * They live in `firebase-staff.ts`. Buyers never sign in and never upload, so
 * importing `firebase/auth` and `firebase/storage` from this module — which the
 * catalogue needs for `db` — would pull roughly a third of the Firebase SDK onto
 * the first paint of a phone on mobile data, to support screens that audience
 * cannot reach. Keeping them apart lets the bundler leave them out until the
 * staff routes are actually loaded.
 *
 * Config comes from `env.ts` (backed by `.env.local`) rather than being pasted
 * inline: the same source file then builds against staging and production
 * without an edit. These values are public client identifiers, not secrets — the
 * actual protection is Firestore/Storage security rules.
 */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

import { env } from '@/lib/env';

/**
 * Vite's Fast Refresh re-executes this module on edit. `initializeApp` throws
 * on a duplicate app name, so reuse the existing instance if there is one.
 */
export const app = getApps().length ? getApp() : initializeApp(env.firebase);

export const db = getFirestore(app);

/**
 * Analytics needs a browser with cookies and measurement enabled, so it can
 * legitimately be unavailable (private mode, blockers). Callers await the
 * promise and skip logging when it resolves to `null` rather than crashing.
 */
export const analyticsPromise = env.firebase.measurementId
  ? isSupported().then((supported) => (supported ? getAnalytics(app) : null))
  : Promise.resolve(null);

if (env.useEmulators) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
