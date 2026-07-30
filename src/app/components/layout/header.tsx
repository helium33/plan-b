import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Heart, Menu, Search, ShieldCheck, ShoppingBag, Sparkles, User, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LanguageSegmented, LanguageToggle } from '@/app/components/common/language-toggle';
import { Logo } from '@/app/components/common/logo';
import { ThemeModeSelect, ThemeToggle } from '@/app/components/common/theme-toggle';
import { cn } from '@/app/components/ui/utils';
import { PRIMARY_NAV, ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useIsAdmin } from '@/app/hooks/use-is-admin';
import { useWishlist } from '@/app/hooks/use-wishlist';
import { useCartStore } from '@/app/stores/cart-store';
import { formatNumber } from '@/lib/format';


export function Header() {
  const { t } = useTranslation();
  const location = useLocation();
  const wishlistCount = useWishlist().count;
  // Selected, not read through the whole store, so the header only re-renders when
  // the number of lines actually changes.
  const cartCount = useCartStore((s) => s.items.length);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Any navigation dismisses the overlays — otherwise tapping a link in the
  // mobile menu leaves the panel covering the page you just asked for.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Subtle elevation once the page moves, so the bar detaches from the hero.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Escape closes whichever overlay is open.
  useEffect(() => {
    if (!menuOpen && !searchOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      setSearchOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, searchOpen]);

  // Freeze the page behind the mobile panel.
  useEffect(() => {
    if (!menuOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement bar */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 text-white">
        <div className="container-page flex h-9 items-center justify-center">
          <p className="truncate text-center text-[0.78rem] font-medium tracking-wide">
            {t('header.announcement')}
          </p>
        </div>
      </div>

      {/* Main bar */}
      <div
        className={cn(
          'border-b border-border bg-background/85 backdrop-blur-lg transition-shadow duration-300',
          scrolled && 'shadow-[0_1px_20px_-8px_rgb(0_0_0/0.25)]',
        )}
      >
        <div className="container-page flex h-16 items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t('nav.openMenu')}
            aria-expanded={menuOpen}
            className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <Menu className="h-5 w-5" strokeWidth={1.9} />
          </button>

          <Logo />

          {/* Desktop nav */}
          <nav aria-label={t('nav.primaryLabel')} className="mx-auto hidden lg:block">
            <ul className="flex items-center gap-1">
              {PRIMARY_NAV.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === ROUTES.home}
                    className={({ isActive }) =>
                      cn(
                        'relative block rounded-full px-3.5 py-2 text-sm transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive
                          ? 'font-medium text-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="relative z-10">{t(link.labelKey)}</span>
                        {isActive && (
                          <motion.span
                            layoutId="nav-active-pill"
                            className="absolute inset-0 rounded-full bg-accent"
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={t('actions.search')}
              aria-expanded={searchOpen}
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Search className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />
            </button>

            <ThemeToggle />
            <LanguageToggle className="hidden sm:flex" />

            <IconLink
              to={ROUTES.wishlist}
              label={t('actions.wishlist')}
              count={wishlistCount}
              countNoun="header.itemsSaved"
              className="hidden sm:grid"
            >
              <Heart className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />
            </IconLink>

            <AdminLink />
            <AccountLink />

            <IconLink to={ROUTES.cart} label={t('actions.cart')} count={cartCount}>
              <ShoppingBag className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />
            </IconLink>
          </div>
        </div>

        {/* Expandable search */}
        <AnimatePresence initial={false}>
          {searchOpen && (
            <motion.div
              key="search"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="overflow-hidden border-t border-border"
            >
              <form
                role="search"
                onSubmit={(event) => event.preventDefault()}
                className="container-page flex items-center gap-3 py-3"
              >
                <Search
                  className="h-[1.15rem] w-[1.15rem] shrink-0 text-muted-foreground"
                  strokeWidth={1.9}
                />
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder={t('actions.searchPlaceholder')}
                  aria-label={t('actions.search')}
                  className="h-10 w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label={t('actions.cancel')}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

interface IconLinkProps {
  to: string;
  label: string;
  count?: number;
  /**
   * Base locale key for the count phrase. i18next appends the plural suffix, so
   * the locale files hold `…_one` and `…_other` rather than this exact key.
   */
  countNoun?: 'header.itemsInCart' | 'header.itemsSaved';
  className?: string;
  children: React.ReactNode;
}

/**
 * Shortcut to the admin area, shown only to staff.
 *
 * Renders nothing while the check is in flight and nothing for a customer, so no
 * layout shift and no hint that the page exists. `useIsAdmin` answers from the
 * bootstrap email list without a network round trip, so the owner sees this
 * immediately on sign-in rather than after a Firestore read.
 *
 * Visibility only — Firestore and Storage rules are what actually gate writes.
 */
function AdminLink() {
  const { t } = useTranslation();
  const { isAdmin, checking } = useIsAdmin();

  if (checking || !isAdmin) return null;

  return (
    <IconLink to={ROUTES.admin} label={t('nav.admin')} className="text-gold-600 dark:text-gold-300">
      <ShieldCheck className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />
    </IconLink>
  );
}

/**
 * The account control: "Sign in" for guests, initial + points for members.
 *
 * Renders the guest version while the session is still resolving. That is the
 * right default — showing a signed-out header for a moment is unremarkable,
 * whereas a skeleton in the header makes the whole page look like it failed to
 * load, and an optimistic signed-in state would flash private data.
 */
function AccountLink() {
  const { t } = useTranslation();
  const { isSignedIn, member, points, user } = useAuth();

  if (!isSignedIn) {
    return (
      <IconLink to={ROUTES.signIn} label={t('actions.signIn')}>
        <User className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />
      </IconLink>
    );
  }

  const name = member?.profile.name ?? member?.displayName ?? user?.displayName ?? '';
  // `[...name]` iterates code points, so a Burmese initial is not cut in half.
  const initial = [...name.trim()][0]?.toUpperCase();

  return (
    <>
      {points > 0 ? (
        <Link
          to={ROUTES.account}
          className="hidden items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-1 text-xs font-medium text-gold-700 transition-colors hover:bg-gold-500/20 lg:inline-flex dark:text-gold-300"
        >
          <Sparkles className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
          {formatNumber(points)}
          <span className="sr-only"> {t('common.points')}</span>
        </Link>
      ) : null}

      <IconLink to={ROUTES.account} label={t('nav.account')}>
        {initial ? (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-200">
            {initial}
          </span>
        ) : (
          <User className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />
        )}
      </IconLink>
    </>
  );
}

function IconLink({
  to,
  label,
  count = 0,
  countNoun = 'header.itemsInCart',
  className,
  children,
}: IconLinkProps) {
  const { t } = useTranslation();

  return (
    <Link
      to={to}
      /*
        The count phrase has to match the control. This used to hard-code
        `header.itemsInCart`, so the wishlist announced "Wishlist — 2 items in
        cart" to a screen reader; and building the string by hand produced
        "1 frames saved". Now each caller names its own key and i18next handles
        both the noun and the plural form.
      */
      aria-label={count > 0 ? `${label} — ${t(countNoun, { count })}` : label}
      className={cn(
        'relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground',
        'transition-colors hover:bg-accent hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      {children}
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold-500 px-1 text-[0.65rem] font-semibold text-slate-900">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const { isAdmin } = useIsAdmin();

  return (
    // One keyed child, not a Fragment holding two: AnimatePresence tracks its
    // direct children by key, and a Fragment hides them from it — which leaves
    // both stuck on their `initial` values and the panel parked off-screen.
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 lg:hidden"
        >
          <div
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.primaryLabel')}
            // Percentages on both ends — mixing '-100%' with a unitless 0 gives
            // Motion nothing to interpolate between.
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col border-r border-border bg-background shadow-2xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <Logo />
              <button
                type="button"
                onClick={onClose}
                aria-label={t('nav.closeMenu')}
                className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-5 w-5" strokeWidth={1.9} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-1">
                {PRIMARY_NAV.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      end={link.to === ROUTES.home}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'block rounded-xl px-3.5 py-2.5 text-[0.95rem] transition-colors',
                          isActive
                            ? 'bg-accent font-medium text-foreground'
                            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                        )
                      }
                    >
                      {t(link.labelKey)}
                    </NavLink>
                  </li>
                ))}
              </ul>

              <div className="my-4 h-px bg-border" />

              <ul className="space-y-1">
                {[
                  { to: ROUTES.wishlist, label: t('actions.wishlist'), icon: Heart },
                  { to: ROUTES.cart, label: t('actions.cart'), icon: ShoppingBag },
                  // Points to the account page once signed in, so the panel
                  // never offers to sign in someone who already has.
                  isSignedIn
                    ? { to: ROUTES.account, label: t('nav.account'), icon: User }
                    : { to: ROUTES.signIn, label: t('actions.signIn'), icon: User },
                  // Staff only. Filtered out below rather than conditionally
                  // spread, so the array stays a single readable shape.
                  { to: ROUTES.admin, label: t('nav.admin'), icon: ShieldCheck, adminOnly: true },
                ]
                  .filter((entry) => !('adminOnly' in entry && entry.adminOnly) || isAdmin)
                  .map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.95rem] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                    >
                      <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="shrink-0 space-y-4 border-t border-border p-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t('language.label')}
                </p>
                <LanguageSegmented className="w-full justify-between" />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t('theme.label')}
                </p>
                <ThemeModeSelect className="w-full justify-between" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
