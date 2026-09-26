/**
 * The shell every buyer-facing page renders inside.
 *
 * ── Two navigations, one per hand ──────────────────────────────────────────
 * On a desktop there is a fixed left sidebar carrying the destinations and the
 * catalogue's attribute filters. On a phone the destinations stay in a bottom
 * bar, because that is where a thumb rests and because a wholesale buyer flips
 * between "look at frames" and "check the total" dozens of times while building
 * one order — a hamburger would make that loop three taps instead of one.
 *
 * The phone's filters live behind the catalogue's own Filters button rather than
 * up here, so the control sits next to the grid it changes. See `filter-bar.tsx`.
 *
 * The sidebar shows the filter groups only on the catalogue route. Leaving them
 * up on the voucher would be a panel of controls that change nothing on screen.
 *
 * A third tab, Credit, appears only for accounts that have a credit account
 * behind them — a shop, or staff ordering for shops. For everyone else the
 * loop stays the two tabs it always was.
 */
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { CircleHelp, Grid2x2, ReceiptText, UserRound, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CatalogFilterGroups } from '@/app/components/catalog/filter-groups';
import { LanguageToggle } from '@/app/components/common/language-toggle';
import { BrandBadge } from '@/app/components/brand/brand-logo';
import { SplashScreen } from '@/app/components/common/splash-screen';
import { ThemeToggle } from '@/app/components/common/theme-toggle';
import { HowToUseModal } from '@/app/components/onboarding/how-to-use';
import { CartDrawer } from '@/app/components/order/cart-drawer';
import { cn } from '@/app/components/ui/utils';
import { ROUTES } from '@/app/config/navigation';
import { useRole } from '@/app/hooks/use-role';
import { draftPieceCount, useOrderStore } from '@/app/stores/order-store';
import { useOnboardingStore } from '@/app/stores/onboarding-store';

const BASE_TABS = [
  { to: ROUTES.catalog, labelKey: 'nav.catalog', icon: Grid2x2, end: true },
  { to: ROUTES.order, labelKey: 'nav.order', icon: ReceiptText, end: false },
] as const;

const CREDIT_TAB = { to: ROUTES.credit, labelKey: 'nav.credit', icon: Wallet, end: false } as const;

/** The Plan B Vision badge, for the header and the sidebar. */
function Brand({ className }: { className?: string }) {
  return <BrandBadge className={className} />;
}

export function AppShell() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const quantities = useOrderStore((s) => s.quantities);
  const replay = useOnboardingStore((s) => s.replay);
  const { ready, can } = useRole();

  const tabs = ready && can('credit:view') ? [...BASE_TABS, CREDIT_TAB] : BASE_TABS;

  const pieces = draftPieceCount(quantities);
  const onCatalog = pathname === ROUTES.catalog;

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
      >
        {t('nav.skipToContent')}
      </a>

      {/* ── Sidebar, desktop only ───────────────────────────────────────────── */}
      <aside
        aria-label={t('nav.primary')}
        className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar px-4 py-5 md:flex"
      >
        <Brand className="px-2" />

        <nav className="mt-6 space-y-1">
          {tabs.map(({ to, labelKey, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className="flex-1 font-myanmar">{t(labelKey)}</span>

                  {to === ROUTES.order && pieces > 0 ? (
                    <span
                      className={cn(
                        'min-w-[1.35rem] rounded-full px-1.5 text-center text-[0.68rem] font-bold leading-[1.35rem]',
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-primary text-primary-foreground',
                      )}
                    >
                      {pieces > 99 ? '99+' : pieces}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {onCatalog ? (
          <div className="mt-6 border-t border-sidebar-border pt-5">
            <CatalogFilterGroups />
          </div>
        ) : null}

        <Link
          to={ROUTES.signIn}
          className="mt-auto flex min-h-11 items-center gap-2.5 rounded-xl px-3 pt-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserRound className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.8} aria-hidden="true" />
          <span className="font-myanmar">{t('actions.signIn')}</span>
        </Link>
      </aside>

      {/* ── Everything to the right of it ───────────────────────────────────── */}
      <div className="flex min-h-dvh flex-col md:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4">
            {/* The sidebar already carries this on a desktop. */}
            <Brand className="min-w-0 flex-1 md:hidden" />
            <div className="hidden flex-1 md:block" />

            <button
              type="button"
              onClick={replay}
              aria-label={t('onboarding.replay')}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CircleHelp className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />
            </button>

            <ThemeToggle />
            <LanguageToggle />

            {/*
              A plain link, not an auth-aware avatar. Rendering the signed-in
              state here would mean reading the session on the very first paint
              of a catalogue most visitors browse without ever signing in. The
              sign-in page — lazily loaded — shows the session and the sign-out.
            */}
            <Link
              to={ROUTES.signIn}
              aria-label={t('auth.signInTitle')}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            >
              <UserRound className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />
            </Link>
          </div>
        </header>

        {/* `pb-20` clears the fixed bottom bar so the last row of a page is
            never hidden behind it. The bar is phone-only, and so is the pad. */}
        <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 pb-20 md:pb-8">
          <Outlet />
        </main>

        {/* ── Bottom tabs, phone only ──────────────────────────────────────── */}
        <nav
          aria-label={t('nav.primary')}
          // `env(safe-area-inset-bottom)` keeps the tabs above the iOS home
          // indicator, which otherwise sits on top of the right-hand tab.
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        >
          <div className="mx-auto flex w-full max-w-6xl">
            {tabs.map(({ to, labelKey, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[0.7rem] font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <Icon
                        className="h-[1.35rem] w-[1.35rem]"
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />

                      {/* Only on the voucher tab: the count is what tells a
                          buyer their taps landed, on a screen that does not
                          show them. */}
                      {to === ROUTES.order && pieces > 0 ? (
                        <span className="absolute -right-2.5 -top-1.5 min-w-[1.1rem] rounded-full bg-primary px-1 text-center text-[0.62rem] font-bold leading-[1.1rem] text-primary-foreground">
                          {pieces > 99 ? '99+' : pieces}
                        </span>
                      ) : null}
                    </span>

                    <span className="font-myanmar">{t(labelKey)}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      <CartDrawer />
      <HowToUseModal />
      <SplashScreen />
    </div>
  );
}
