/**
 * Who may edit the catalogue.
 *
 * ── Two tiers, and why they are not the same thing ─────────────────────────
 * *Signing in* is open: any Google account can authenticate and gets a
 * `users/{uid}` document. That costs nothing and lets the shop see who is
 * ordering.
 *
 * *Editing the catalogue* is closed to the addresses below. Uploading a frame
 * changes what every buyer sees and what they are quoted, so it is not something
 * to hand out by accident.
 *
 * ── Why `email_verified` is not optional ───────────────────────────────────
 * Without it, someone could register an email/password account claiming one of
 * these addresses and inherit the shop's catalogue. Firebase only sets
 * `email_verified: true` after the address is actually proven — automatically
 * for Google sign-in, and after clicking the emailed link for email/password.
 * Both rulesets check the flag, so an unverified claim grants nothing.
 *
 * ── Keeping three copies in step ───────────────────────────────────────────
 * This list is duplicated in `firestore.rules` and `storage.rules`, because
 * security rules cannot import TypeScript. **Changing it here means changing it
 * in both of those files too**, and each is a separate deploy. The duplication
 * is unavoidable; the comment in each file points back here.
 *
 * Further staff can be added as `admins/{uid}` documents from the admin page —
 * that needs no deploy at all.
 */

export const BOOTSTRAP_ADMIN_EMAILS: readonly string[] = [
  'kyawwinhtun56@gmail.com',
  'kyawwinhtun564@gmail.com',
];

/**
 * Whether an email grants catalogue access.
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
