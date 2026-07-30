/**
 * Shell for the admin area: the access gate plus tab navigation.
 *
 * `RequireAdmin` renders as a *layout* route, so the `admins/{uid}` check happens
 * once for the whole section rather than being repeated — and forgotten — on each
 * new admin page. Adding a page under `/admin` inherits the gate automatically.
 *
 * The gate is UI only. Firestore's `isAdmin()` and Storage's matching rule are
 * what actually stop a write; hiding a form from a customer is courtesy, not
 * security.
 */
import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Check, Database, KeyRound, Loader2, Package, ShieldAlert, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useIsAdmin } from '@/app/hooks/use-is-admin';
import { AdminSetupInstructions } from '@/app/components/admin/setup-instructions';

export function AdminLayout() {
  const { t } = useTranslation();
  const { isAdmin, checking, viaBootstrapEmail, hasAdminRecord, claimAdminRecord } = useIsAdmin();
  const { isSignedIn, isLoading } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [claimFailed, setClaimFailed] = useState(false);

  if (isLoading || checking) {
    return (
      <div className="container-page py-16">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t('common.loading')}
        </p>
      </div>
    );
  }

  // `RequireAuth` on the route already handles the signed-out case, but a stale
  // session can land here signed out; better a clear prompt than an empty page.
  if (!isSignedIn) {
    return (
      <div className="container-page py-16">
        <h1 className="text-xl font-semibold text-foreground">{t('admin.notAdminTitle')}</h1>
        <Button asChild className="mt-5">
          <Link to={ROUTES.signIn}>{t('actions.signIn')}</Link>
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container-page max-w-3xl py-10 sm:py-14">
        <div className="flex items-center gap-2">
          <ShieldAlert
            className="h-5 w-5 text-gold-600 dark:text-gold-300"
            strokeWidth={1.9}
            aria-hidden="true"
          />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t('admin.notAdminTitle')}
          </h1>
        </div>

        <AdminSetupInstructions />
      </div>
    );
  }

  const showClaimPrompt = viaBootstrapEmail && !hasAdminRecord;

  const tabs = [
    { to: ROUTES.admin, label: t('admin.tabs.upload'), icon: Upload, end: true },
    { to: ROUTES.adminFrames, label: t('admin.tabs.frames'), icon: Package, end: false },
    { to: ROUTES.adminSeed, label: t('admin.tabs.seed'), icon: Database, end: false },
  ];

  return (
    <div className="container-page py-8 sm:py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('admin.title')}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t('admin.subtitle')}</p>
      </header>

      <nav
        aria-label={t('admin.title')}
        className="mt-7 flex gap-1 overflow-x-auto border-b border-border"
      >
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            // `end` only on the index tab, so /admin does not stay highlighted
            // while a child route is active.
            end={end}
            className={({ isActive }) =>
              cn(
                'flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/*
        Offered once, to the bootstrap owner, until the record exists.

        Access already works without pressing this — the email list grants it. What
        the button buys is durability: a stored `admins/{uid}` means access no
        longer depends on a hard-coded list in two rules files, so the email can
        later be removed from those without locking the owner out.
      */}
      {showClaimPrompt ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold-500/30 bg-gold-500/5 p-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <KeyRound
                className="h-4 w-4 text-gold-600 dark:text-gold-300"
                strokeWidth={1.9}
                aria-hidden="true"
              />
              {t('admin.claimTitle')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t('admin.claimBody')}</p>
            {claimFailed ? (
              <p role="alert" className="mt-1.5 text-xs text-destructive">
                {t('admin.claimFailed')}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            size="sm"
            disabled={claiming}
            onClick={() => {
              setClaiming(true);
              setClaimFailed(false);
              claimAdminRecord()
                .catch(() => setClaimFailed(true))
                .finally(() => setClaiming(false));
            }}
          >
            {claiming ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
            )}
            {t('admin.claimAction')}
          </Button>
        </div>
      ) : null}

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
