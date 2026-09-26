/**
 * Firebase Auth — the one service only signed-in users touch.
 *
 * Split out of `firebase.ts` so the bundler can keep `firebase/auth` out of the
 * chunk the catalogue loads. Nothing on the buyer path may import this module,
 * directly or transitively; the sign-in and admin routes are lazily loaded, and
 * that split is what makes the separation pay.
 *
 * Storage used to live here too. It went when catalogue media moved to
 * Cloudinary — see `lib/media/upload.ts`. The bucket still serves photos
 * uploaded before that move, but nothing in the app writes to it, so the SDK for
 * it is no longer shipped at all.
 *
 * It reuses the app instance from `firebase.ts` rather than initialising its
 * own, so there is still exactly one Firebase app.
 */
import { connectAuthEmulator, getAuth } from 'firebase/auth';

import { app } from '@/lib/firebase';
import { env } from '@/lib/env';

export const auth = getAuth(app);

if (env.useEmulators) {
  // `disableWarnings` silences the banner about unencrypted local traffic,
  // which is expected and otherwise drowns real console output.
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}
