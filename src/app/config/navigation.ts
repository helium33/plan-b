import type { TranslationSchema } from '@/app/i18n/locales/en';

/**
 * Every path in the app, in one place. Route definitions, links and redirects
 * all read from here so a rename cannot leave a dead `<Link>` behind.
 *
 * There are two buyer-facing paths and that is the whole app: the catalogue and
 * the voucher. Everything under `/admin` is staff tooling for filling the
 * catalogue, and `/sign-in` exists only to reach it.
 */
export const ROUTES = {
  /** Catalogue — ငါတို့ကိုင်း. The landing page: frames, immediately. */
  catalog: '/',
  /** One frame, with its photos and the C-colour order panel. */
  frame: '/frame/:id',
  /** The draft order priced as a voucher — ဘောက်ချာ. */
  order: '/order',

  /**
   * Pinky Beauty — the retail storefront, checkout and B2B Credit/AR dashboard.
   *
   * A separate identity with its own pink theme and its own shell, so it is
   * mounted outside `AppShell` rather than added as a third wholesale tab.
   */
  pinky: '/pinky',

  signIn: '/sign-in',
  /**
   * Where signing out goes. The goodbye screen ends the session itself and
   * then shows the sign-in screen — see `components/auth/auth-screens.tsx`.
   */
  goodbye: '/goodbye',

  /** A shop's credit dashboard: limit, used, remaining, payment term, loyalty. */
  credit: '/credit',

  /** Admin area. Index tab is the upload form; children are nested under it. */
  admin: '/admin',
  adminFrames: '/admin/frames',
  adminSeed: '/admin/seed',
  /** The wholesale credit ledger — per-shop running balance, 14-day cycles. */
  adminCredit: '/admin/credit',
} as const;

/** Builds a concrete frame URL from the parameterised route. */
export function framePath(id: string): string {
  return ROUTES.frame.replace(':id', encodeURIComponent(id));
}

/**
 * A translation key, dotted. Typed against the English bundle so a link
 * pointing at a deleted key fails to compile.
 */
type NavLabelKey = `nav.${keyof TranslationSchema['nav']}`;

export interface NavLink {
  to: string;
  labelKey: NavLabelKey;
}

/**
 * The bottom bar's two tabs, in display order.
 *
 * Two, deliberately. A wholesale order is one loop — look at frames, enter
 * quantities, check the voucher, send — and a bar with room for five icons
 * invites the fourth and fifth to be invented.
 */
export const PRIMARY_NAV: readonly NavLink[] = [
  { to: ROUTES.catalog, labelKey: 'nav.catalog' },
  { to: ROUTES.order, labelKey: 'nav.order' },
] as const;
