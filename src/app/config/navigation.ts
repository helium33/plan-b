import type { TranslationSchema } from '@/app/i18n/locales/en';

/**
 * Every path in the app, in one place. Route definitions, links and redirects
 * all read from here so a rename cannot leave a dead `<Link>` behind.
 */
export const ROUTES = {
  home: '/',
  shop: '/shop',
  product: '/product/:id',
  lookbook: '/lookbook',
  eyeCare: '/eye-care',
  booking: '/booking',
  about: '/about',
  contact: '/contact',
  signIn: '/sign-in',
  signUp: '/sign-up',
  onboarding: '/onboarding',
  /** Results of the personalisation form. Needs a completed profile. */
  recommendations: '/recommendations',
  account: '/account',
  wishlist: '/wishlist',
  compare: '/compare',
  cart: '/cart',
  checkout: '/checkout',
  /** Admin area. Index tab is the upload form; children are nested under it. */
  admin: '/admin',
  adminFrames: '/admin/frames',
  adminSeed: '/admin/seed',
} as const;

/** Builds a concrete product URL from the parameterised route. */
export function productPath(id: string): string {
  return ROUTES.product.replace(':id', encodeURIComponent(id));
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

/** Header links, in display order. */
export const PRIMARY_NAV: readonly NavLink[] = [
  { to: ROUTES.home, labelKey: 'nav.home' },
  { to: ROUTES.shop, labelKey: 'nav.shop' },
  { to: ROUTES.lookbook, labelKey: 'nav.lookbook' },
  { to: ROUTES.eyeCare, labelKey: 'nav.eyeCare' },
  { to: ROUTES.booking, labelKey: 'nav.booking' },
  { to: ROUTES.about, labelKey: 'nav.about' },
  { to: ROUTES.contact, labelKey: 'nav.contact' },
] as const;

type FooterLabelKey =
  | `footer.${keyof TranslationSchema['footer']}`
  | `nav.${keyof TranslationSchema['nav']}`
  | `pages.${'wishlist' | 'compare' | 'account'}.title`;

export interface FooterColumn {
  titleKey: `footer.${keyof TranslationSchema['footer']}`;
  links: readonly { to: string; labelKey: FooterLabelKey }[];
}

/**
 * Footer columns. Some targets (FAQ, warranty, privacy…) are content pages that
 * do not exist yet; they point at their eventual paths and currently resolve to
 * the not-found page, which is preferable to `href="#"` shipping to production.
 */
export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    titleKey: 'footer.shop',
    links: [
      { to: ROUTES.shop, labelKey: 'nav.shop' },
      { to: ROUTES.lookbook, labelKey: 'nav.lookbook' },
      { to: ROUTES.wishlist, labelKey: 'pages.wishlist.title' },
      { to: ROUTES.compare, labelKey: 'pages.compare.title' },
    ],
  },
  {
    titleKey: 'footer.company',
    links: [
      { to: ROUTES.about, labelKey: 'nav.about' },
      { to: ROUTES.contact, labelKey: 'nav.contact' },
      { to: ROUTES.booking, labelKey: 'nav.booking' },
      { to: ROUTES.eyeCare, labelKey: 'nav.eyeCare' },
    ],
  },
  {
    titleKey: 'footer.customerService',
    links: [
      { to: '/faq', labelKey: 'footer.faq' },
      { to: '/shipping-returns', labelKey: 'footer.shippingReturns' },
      { to: '/warranty', labelKey: 'footer.warranty' },
      { to: '/size-guide', labelKey: 'footer.sizeGuide' },
      { to: '/prescription-guide', labelKey: 'footer.prescriptionGuide' },
    ],
  },
] as const;
