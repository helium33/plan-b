/**
 * Demonstration data for the Pinky Beauty storefront and AR ledger.
 *
 * ── Why the dates are relative ─────────────────────────────────────────────
 * Invoice dates are computed backwards from *today* rather than hard-coded.
 * A fixed date set would drift into "everything is 400 days overdue" within a
 * few months, and the aging report — the whole point of the dashboard — would
 * stop demonstrating anything. Offsets keep one account inside terms, one just
 * past due, and one deep enough to trigger the auto-hold, whenever it is opened.
 *
 * ── Why product art is generated, not photographed ─────────────────────────
 * Every image is an inline SVG data URI. It cannot 404, needs no CDN or CSP
 * exception, renders with the network off, and is honestly a placeholder rather
 * than a stock photo of a product this shop does not sell.
 */
import type { CreditCustomer } from '@/pinky/lib/credit';
import { toIsoDay } from '@/pinky/lib/credit';

/* ── Products ──────────────────────────────────────────────────────────────── */

export type PinkyProduct = {
  id: string;
  name: string;
  /** Contact lens shade or frame colourway. */
  shade: string;
  priceKyat: number;
  category: 'lenses' | 'frames' | 'lashes' | 'care';
  badge: 'bestseller' | 'new' | 'low-stock' | null;
  image: string;
  /** Short marketing line, kept to one clause so cards stay level. */
  blurb: string;
};

/**
 * A lens or frame rendered as tinted SVG.
 *
 * The colour is the product's real shade, so switching products visibly changes
 * the art — which is precisely the behaviour a catalogue needs to demonstrate.
 */
function art(color: string, label: string, kind: 'lens' | 'frame'): string {
  const body =
    kind === 'lens'
      ? `<circle cx="150" cy="150" r="96" fill="${color}" opacity="0.9"/>
         <circle cx="150" cy="150" r="96" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="6"/>
         <circle cx="150" cy="150" r="42" fill="#2d1f2d" opacity="0.85"/>
         <circle cx="126" cy="126" r="20" fill="#ffffff" opacity="0.55"/>
         <circle cx="150" cy="150" r="96" fill="none" stroke="${color}" stroke-width="14" stroke-opacity="0.35"/>`
      : `<g fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round">
           <rect x="34" y="112" width="94" height="72" rx="26"/>
           <rect x="172" y="112" width="94" height="72" rx="26"/>
           <path d="M128 138q22-14 44 0"/>
           <path d="M34 130l-22-12"/>
           <path d="M266 130l22-12"/>
         </g>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff5f8"/><stop offset="1" stop-color="#fde7f0"/>
      </linearGradient></defs>
      <rect width="300" height="300" fill="url(#bg)"/>
      ${body}
      <text x="286" y="288" text-anchor="end" font-family="system-ui,sans-serif" font-size="12" fill="#c99cb4">${label}</text>
    </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

export const PINKY_PRODUCTS: readonly PinkyProduct[] = [
  {
    id: 'brownies-black',
    name: 'Brownies Black',
    shade: 'Natural Black',
    priceKyat: 13_000,
    category: 'lenses',
    badge: 'bestseller',
    image: art('#3b2b2b', 'Brownies Black', 'lens'),
    blurb: 'Soft black ring for an everyday natural lift.',
  },
  {
    id: 'barbie-hall-blue',
    name: 'Barbie Hall Blue',
    shade: 'Ocean Blue',
    priceKyat: 13_000,
    category: 'lenses',
    badge: 'bestseller',
    image: art('#3f6fa8', 'Barbie Hall Blue', 'lens'),
    blurb: 'Cool blue with a soft edge that blends at the rim.',
  },
  {
    id: 'calling-gray',
    name: 'Calling Gray',
    shade: 'Smoke Grey',
    priceKyat: 14_000,
    category: 'lenses',
    badge: 'new',
    image: art('#7e8794', 'Calling Gray', 'lens'),
    blurb: 'Grey that reads natural in daylight and photographs well.',
  },
  {
    id: 'dna-black',
    name: 'DNA Black',
    shade: 'Deep Black',
    priceKyat: 13_000,
    category: 'lenses',
    badge: null,
    image: art('#241c24', 'DNA Black', 'lens'),
    blurb: 'A wider ring for definition without looking drawn on.',
  },
  {
    id: 'honey-brown',
    name: 'Honey Brown',
    shade: 'Warm Honey',
    priceKyat: 14_000,
    category: 'lenses',
    badge: 'low-stock',
    image: art('#a9702f', 'Honey Brown', 'lens'),
    blurb: 'Warm brown that lifts dark eyes in indoor light.',
  },
  {
    id: 'rosie-cat-eye',
    name: 'Rosie Cat-Eye',
    shade: 'Rose Gold',
    priceKyat: 32_000,
    category: 'frames',
    badge: 'new',
    image: art('#c08a7d', 'Rosie Cat-Eye', 'frame'),
    blurb: 'Fine metal cat-eye, 51-16-140, adjustable pads.',
  },
  {
    id: 'petal-round',
    name: 'Petal Round',
    shade: 'Blush Pink',
    priceKyat: 28_000,
    category: 'frames',
    badge: 'bestseller',
    image: art('#e37aa4', 'Petal Round', 'frame'),
    blurb: 'Light acetate round in a soft blush, 49-19-142.',
  },
  {
    id: 'lash-edit-natural',
    name: 'Lash Edit — Natural',
    shade: '8–10mm',
    priceKyat: 9_500,
    category: 'lashes',
    badge: null,
    image: art('#8c6a7a', 'Lash Edit', 'lens'),
    blurb: 'Reusable band, mixed lengths for a natural taper.',
  },
  {
    id: 'lens-solution',
    name: 'Gentle Lens Solution',
    shade: '360ml',
    priceKyat: 6_500,
    category: 'care',
    badge: null,
    image: art('#89b9c9', 'Solution 360ml', 'lens'),
    blurb: 'Preservative-light saline for daily rinsing and storage.',
  },
  {
    id: 'lens-case-duo',
    name: 'Lens Case Duo',
    shade: 'Pink / Cream',
    priceKyat: 3_000,
    category: 'care',
    badge: null,
    image: art('#f0a8c4', 'Lens Case', 'lens'),
    blurb: 'Two screw-top cases with a mirror lid.',
  },
];

export const PRODUCT_CATEGORIES = ['lenses', 'frames', 'lashes', 'care'] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  lenses: 'Contact Lenses',
  frames: 'Eyewear Frames',
  lashes: 'Lashes',
  care: 'Lens Care',
};

/* ── Credit customers ──────────────────────────────────────────────────────── */

/** `daysAgo(20)` → the ISO date twenty days before today. */
function daysAgo(days: number): string {
  return toIsoDay(new Date(Date.now() - days * 86_400_000));
}

/**
 * Three accounts chosen to exercise every branch of the credit engine:
 *
 *  - **Royal Beauty** — inside terms, inside limit, with a due date close enough
 *    to fire a pre-due reminder. The happy path plus the alert trigger.
 *  - **Glamour Lens** — a partly-paid invoice well past due, *and* over its
 *    limit. Two independent hold reasons at once, which is what proves the
 *    dashboard explains rather than just flags.
 *  - **Mandalay Eyewear** — comfortably clear, with one settled invoice, so the
 *    "paid" path is covered by real data rather than only in principle.
 */
export const INITIAL_CREDIT_CUSTOMERS: CreditCustomer[] = [
  {
    id: 'royal-beauty',
    name: 'Royal Beauty Wholesale',
    phone: '09 771 234 567',
    creditLimitKyat: 1_000_000,
    manualHold: false,
    invoices: [
      { id: 'INV-1042', issuedOn: daysAgo(12), amountKyat: 450_000, paidKyat: 0 },
      { id: 'INV-1051', issuedOn: daysAgo(4), amountKyat: 300_000, paidKyat: 0 },
    ],
  },
  {
    id: 'glamour-lens',
    name: 'Glamour Lens Studio',
    phone: '09 445 889 210',
    creditLimitKyat: 500_000,
    manualHold: false,
    invoices: [
      // 34 days old: past the 30-day bucket and well past the 14-day auto-hold.
      { id: 'INV-0987', issuedOn: daysAgo(34), amountKyat: 400_000, paidKyat: 150_000 },
      { id: 'INV-1009', issuedOn: daysAgo(22), amountKyat: 270_000, paidKyat: 0 },
    ],
  },
  {
    id: 'mandalay-eyewear',
    name: 'Mandalay Eyewear Shop',
    phone: '09 250 447 118',
    creditLimitKyat: 1_500_000,
    manualHold: false,
    invoices: [
      { id: 'INV-1033', issuedOn: daysAgo(30), amountKyat: 180_000, paidKyat: 180_000 },
      { id: 'INV-1060', issuedOn: daysAgo(2), amountKyat: 200_000, paidKyat: 0 },
    ],
  },
];

/* ── Collector log ─────────────────────────────────────────────────────────── */

export type CollectionEntry = {
  id: string;
  date: string;
  customerId: string;
  amountKyat: number;
  method: 'kpay' | 'wavepay' | 'bank' | 'cash';
  collector: string;
  /** Whether the receipt has been matched against the bank statement. */
  reconciled: boolean;
  reference: string;
};

export const INITIAL_COLLECTIONS: CollectionEntry[] = [
  {
    id: 'COL-311',
    date: daysAgo(1),
    customerId: 'mandalay-eyewear',
    amountKyat: 180_000,
    method: 'kpay',
    collector: 'Ma Thiri',
    reconciled: true,
    reference: 'KP-88213',
  },
  {
    id: 'COL-309',
    date: daysAgo(6),
    customerId: 'glamour-lens',
    amountKyat: 150_000,
    method: 'bank',
    collector: 'Ko Zaw',
    reconciled: true,
    reference: 'KBZ-4471',
  },
  {
    id: 'COL-307',
    date: daysAgo(9),
    customerId: 'royal-beauty',
    amountKyat: 220_000,
    method: 'cash',
    collector: 'Ko Zaw',
    // Deliberately unreconciled: cash collected in the field is exactly what
    // goes missing between the shop and the bank, and the log exists to show it.
    reconciled: false,
    reference: 'CASH-0091',
  },
];
