/**
 * The member's account: identity, loyalty balance, points history and profile.
 *
 * Also the home of the phone-linking step, which is why `RequireAuth` guards
 * this route rather than `RequireMember` — a customer who signed up with Google
 * and has no phone number yet must be able to reach *this* page to fix that.
 * Guarding it with `RequireMember` would redirect them here from here.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ChevronRight,
  LogOut,
  Mail,
  Smartphone,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { MembershipCard } from '@/app/components/account/membership-card';
import { PointsHistory } from '@/app/components/account/points-history';
import { AuthAlert } from '@/app/components/auth/auth-alert';
import { PhoneAuthForm } from '@/app/components/auth/phone-auth-form';
import { Button } from '@/app/components/ui/button';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { formatPhone } from '@/lib/phone';
import { type AuthProviderId, LOYALTY } from '@/lib/membership';

/**
 * Provider id → translation key.
 *
 * Needed because Firebase's id for Google is `google.com`, and i18next splits
 * keys on `.` — a literal `account.providers.google.com` would look up
 * `providers → google → com` and render nothing.
 */
const PROVIDER_LABEL_KEYS: Record<AuthProviderId, 'account.providers.password' | 'account.providers.google' | 'account.providers.phone'> = {
  password: 'account.providers.password',
  'google.com': 'account.providers.google',
  phone: 'account.providers.phone',
};

export function AccountPage() {
  const { t } = useTranslation();
  const {
    user,
    member,
    phoneKey,
    isMemberLoading,
    needsPhoneLink,
    needsOnboarding,
    memberErrorKey,
    signOut,
  } = useAuth();

  useDocumentTitle(t('pages.account.title'));

  const greetingName =
    member?.profile.name ?? member?.displayName ?? user?.displayName ?? user?.email ?? '';

  return (
    <div className="container-page py-10 sm:py-14">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Avatar name={greetingName} photoURL={user?.photoURL ?? null} />

          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {greetingName
                ? t('account.greeting', { name: greetingName })
                : t('pages.account.title')}
            </h1>
            {member ? (
              <p className="mt-0.5 text-sm text-muted-foreground" dir="ltr">
                {formatPhone(member.phone)}
              </p>
            ) : null}
          </div>
        </div>

        <Button variant="outline" onClick={() => void signOut()}>
          <LogOut className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          {t('actions.signOut')}
        </Button>
      </motion.header>

      {memberErrorKey ? (
        <div className="mt-8">
          <AuthAlert messageKey={memberErrorKey} />
        </div>
      ) : null}

      {needsPhoneLink ? (
        <PhoneLinkCard />
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-6">
            {member ? <MembershipCard member={member} /> : null}
            {needsOnboarding ? <OnboardingPrompt /> : null}
            {phoneKey ? <PointsHistory phoneKey={phoneKey} /> : null}
          </div>

          <ProfileCard />
        </div>
      )}

      {isMemberLoading && !needsPhoneLink ? (
        <p className="mt-8 text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : null}
    </div>
  );
}

/* ── Avatar ────────────────────────────────────────────────────────────────── */

function Avatar({ name, photoURL }: { name: string; photoURL: string | null }) {
  // Grapheme-safe-ish first character: `[...name]` iterates code points, so a
  // Burmese initial is not sliced in half the way `name[0]` would.
  const initial = [...name.trim()][0]?.toUpperCase() ?? '?';

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt=""
        // Decorative: the name is already displayed beside it, so announcing it
        // twice adds nothing.
        aria-hidden="true"
        className="h-12 w-12 rounded-full border border-border object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-lg font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300"
    >
      {initial}
    </span>
  );
}

/* ── Phone linking ─────────────────────────────────────────────────────────── */

/**
 * Shown when the customer is signed in but has no verified phone number.
 *
 * This replaces the whole account body rather than sitting alongside it: there
 * is genuinely nothing else to show, because every other panel reads from a
 * member record that does not exist yet.
 */
function PhoneLinkCard() {
  const { t } = useTranslation();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mx-auto mt-8 max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
        <Smartphone className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
      </span>

      <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
        {t('auth.verifyPhoneTitle')}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {t('auth.verifyPhoneDescription', { points: LOYALTY.signUpBonus })}
      </p>

      <div className="mt-6">
        {/* No navigation on completion — the member record appears via the
            provider's live listener and this card is replaced in place. */}
        <PhoneAuthForm mode="link" onComplete={() => undefined} />
      </div>
    </motion.section>
  );
}

/* ── Onboarding nudge ──────────────────────────────────────────────────────── */

function OnboardingPrompt() {
  const { t } = useTranslation();

  return (
    <Link
      to={ROUTES.onboarding}
      className="group flex items-center gap-4 rounded-2xl border border-brand-300/60 bg-brand-50/60 p-5 transition-colors hover:border-brand-400 dark:border-brand-800 dark:bg-brand-950/40"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-background text-brand-600 dark:text-brand-300">
        <Sparkles className="h-4.5 w-4.5" strokeWidth={1.9} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {t('account.completeProfile', { points: LOYALTY.onboardingBonus })}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t('account.completeProfileBody')}
        </p>
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        strokeWidth={2}
        aria-hidden="true"
      />
    </Link>
  );
}

/* ── Profile ───────────────────────────────────────────────────────────────── */

/**
 * Identity and linked sign-in methods.
 *
 * Read-only for now. Editing a name is trivial, but editing the *phone number*
 * is not — it is the document id, so a change means migrating the member record
 * and its points ledger to a new key. That belongs in its own change with its
 * own testing, not bolted onto a display panel.
 */
function ProfileCard() {
  const { t } = useTranslation();
  const { user, member } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const rows = [
    {
      icon: UserRound,
      label: t('auth.nameLabel'),
      value: member?.profile.name ?? user?.displayName ?? '—',
    },
    { icon: Mail, label: t('auth.emailLabel'), value: member?.email ?? user?.email ?? '—' },
    {
      icon: Smartphone,
      label: t('auth.phoneLabel'),
      value: member ? formatPhone(member.phone) : '—',
      ltr: true,
    },
  ];

  const providers = member?.authProviders ?? [];

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="border-b border-border px-6 py-4">
        <h2 className="text-sm font-medium text-foreground">{t('account.profile')}</h2>
      </header>

      <dl className="divide-y divide-border">
        {rows.map(({ icon: Icon, label, value, ltr }) => (
          <div key={label} className="flex items-start gap-3 px-6 py-3.5">
            <Icon
              className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
              strokeWidth={1.9}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="truncate text-sm text-foreground" dir={ltr ? 'ltr' : undefined}>
                {value}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="border-t border-border px-6 py-4">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="text-xs font-medium text-primary transition-colors hover:underline"
        >
          {t('account.signInMethods')}
        </button>

        {expanded ? (
          <ul className="mt-3 space-y-1.5">
            {providers.length === 0 ? (
              <li className="text-xs text-muted-foreground">{t('common.empty')}</li>
            ) : (
              providers.map((provider) => (
                <li key={provider} className="text-xs text-muted-foreground">
                  {t(PROVIDER_LABEL_KEYS[provider])}
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
