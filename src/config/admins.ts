/**
 * Bootstrap admin accounts.
 *
 * ── The problem this solves ────────────────────────────────────────────────
 * Staff access is granted by an `admins/{uid}` document, and those documents can
 * only be created by an admin. On a fresh project nobody is an admin, so nobody
 * can create the first one — the classic chicken-and-egg. The previous answer was
 * "create it by hand in the Firebase console", which works but is a manual step
 * that has to be explained, repeated on every new environment, and is easy to get
 * wrong (paste the wrong uid and nothing happens, with no error to explain why).
 *
 * Instead, the owner's email address is trusted directly. Anyone signing in with
 * a **verified** address on this list is an admin, whether or not the Firestore
 * document exists.
 *
 * ── Why `email_verified` is not optional ───────────────────────────────────
 * Without it, someone could register an email/password account claiming this
 * address and inherit the shop's catalogue. Firebase only sets
 * `email_verified: true` after the address is actually proven — automatically for
 * Google sign-in, and after clicking the emailed link for email/password. Both
 * rulesets check the flag, so an unverified claim grants nothing.
 *
 * ── Keeping three copies in step ───────────────────────────────────────────
 * This list is duplicated in `firestore.rules` and `storage.rules`, because
 * security rules cannot import TypeScript. **Changing it here means changing it
 * in both of those files too**, and each is a separate deploy. The duplication is
 * unavoidable; the comment in each file points back here.
 *
 * Prefer adding further staff as `admins/{uid}` documents from the admin page —
 * that needs no deploy at all. This list is for the first account only.
 */

export const BOOTSTRAP_ADMIN_EMAILS: readonly string[] = ['kyawwinhtun564@gmail.com'];

/**
 * Whether an email grants bootstrap admin access.
 *
 * Compared case-insensitively: email addresses are case-insensitive in the part
 * that matters here, and a provider returning `Kyaw...@gmail.com` should not
 * silently fail to match. Trimmed too, because a stray space in the config list
 * would otherwise be invisible and break access with no clue why.
 */
export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const needle = email.trim().toLowerCase();
  return BOOTSTRAP_ADMIN_EMAILS.some((entry) => entry.trim().toLowerCase() === needle);
}
