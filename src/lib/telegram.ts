/**
 * Telegram checkout: formatting the order and building the deep link.
 *
 * ── Why Telegram, and why this is a link rather than an API call ────────────
 * Telegram is where this shop already talks to customers, and a message a human
 * reads and replies to is more trustworthy than a card form for an order that
 * needs a conversation anyway — prescriptions get checked, PDs get measured,
 * frames get adjusted.
 *
 * A `t.me` deep link needs no bot token, no server, and no credentials in the
 * client. It opens the customer's own Telegram with the message pre-typed; they
 * press send. The shop receives it from the customer's real account, which is
 * itself a verification the shop could not get from an anonymous form.
 *
 * ── The URL length constraint drives the format ─────────────────────────────
 * The whole order travels in a query parameter. Browsers and Telegram both start
 * failing somewhere past a couple of thousand characters, and a truncated order is
 * worse than a short one — it silently loses the lens details at the end, which is
 * exactly the part that must not be lost. So the message is built compactly and
 * `buildTelegramUrl` refuses to return an over-long link, letting the UI fall back
 * to copy-and-paste instead.
 */
import type { CartItem } from '@/app/stores/cart-store';
import { env } from '@/lib/env';
import {
  LENS_TYPES_NEEDING_ADD,
  formatAxis,
  formatDioptre,
  type LensSelection,
} from '@/lib/prescription';
import type { OrderTotals } from '@/lib/promo';

/**
 * Practical ceiling for the encoded URL.
 *
 * Telegram's own limit is generous but the surrounding stack is not: some Android
 * intent handlers truncate around 4,000 characters, and a silently truncated
 * prescription is the worst possible failure here. 3,500 leaves headroom.
 */
export const MAX_TELEGRAM_URL = 3_500;

export type OrderContact = {
  name: string;
  /** E.164, as stored on the member record. */
  phone: string;
  /** Optional free text — landmark, township, delivery notes. */
  note: string;
  /** Whether the customer wants delivery or will collect. */
  fulfilment: 'delivery' | 'collect';
  address: string;
};

export type OrderPayload = {
  items: CartItem[];
  totals: OrderTotals;
  /** Applied code, or null. */
  promoCode: string | null;
  contact: OrderContact;
  /** Membership number if the customer has one, for the POS. */
  posCustomerNumber: string | null;
};

/* ── Formatting ────────────────────────────────────────────────────────────── */

/** Grouped thousands, no currency word — the message adds "MMK" once per line. */
function kyat(amount: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(amount));
}

/**
 * One eye's prescription on a single line, or `null` when nothing was entered.
 *
 * Written the way an optician reads it, with CYL and AXIS omitted entirely when
 * there is no astigmatism — a line reading "CYL 0.00 AXIS —" invites a phone call
 * asking what it means.
 */
function eyeLine(eye: LensSelection['prescription']['right'], needsAdd: boolean): string | null {
  if (eye.sph === null && eye.cyl === null && eye.add === null) return null;

  const parts = [`SPH ${formatDioptre(eye.sph)}`];
  if (eye.cyl !== null && eye.cyl !== 0) {
    parts.push(`CYL ${formatDioptre(eye.cyl)}`, `AX ${formatAxis(eye.axis)}`);
  }
  if (needsAdd && eye.add !== null) parts.push(`ADD ${formatDioptre(eye.add)}`);

  return parts.join(' ');
}

/** The lens block for one line item. */
function lensBlock(lens: LensSelection, lensLabel: string, coatingLabels: string[]): string[] {
  const lines: string[] = [`  Lens: ${lensLabel}`];

  if (lens.deferToStore) {
    lines.push('  Prescription: bringing to shop');
    return lines;
  }

  const needsAdd = LENS_TYPES_NEEDING_ADD.includes(lens.lensType);
  const right = eyeLine(lens.prescription.right, needsAdd);
  const left = eyeLine(lens.prescription.left, needsAdd);

  if (right) lines.push(`  R: ${right}`);
  if (left) lines.push(`  L: ${left}`);

  if (lens.prescription.pd !== null) {
    const source =
      lens.prescription.pdSource === 'card'
        ? ' (card)'
        : lens.prescription.pdSource === 'in-store'
          ? ' (measure in shop)'
          : '';
    lines.push(`  PD: ${lens.prescription.pd}mm${source}`);
  } else {
    lines.push('  PD: to be measured in shop');
  }

  if (lens.highIndex) lines.push('  Thin (high-index) lenses');
  if (coatingLabels.length > 0) lines.push(`  Coatings: ${coatingLabels.join(', ')}`);

  return lines;
}

/**
 * Builds the plain-text order message.
 *
 * Labels are passed in already translated so the shop receives the message in the
 * language the customer was reading — they will be replying in it.
 *
 * @param labels Translated names for each item's lens type and coatings, keyed by
 *               `lineId`, plus the handful of fixed headings.
 */
export function formatOrderMessage(
  payload: OrderPayload,
  labels: {
    heading: string;
    lensTypeFor: (item: CartItem) => string;
    coatingsFor: (item: CartItem) => string[];
    currency: string;
  },
): string {
  const lines: string[] = [labels.heading, ''];

  payload.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.brand} ${item.frameCode} — ${item.frameName}`);
    lines.push(`  Colour: ${item.colorName} (${item.cNumber})`);
    lines.push(...lensBlock(item.lens, labels.lensTypeFor(item), labels.coatingsFor(item)));
    lines.push(`  Line total: ${kyat(item.lineTotalKyat)} ${labels.currency}`);
    lines.push('');
  });

  const { totals } = payload;

  lines.push('— — —');
  lines.push(`Subtotal: ${kyat(totals.subtotalKyat)} ${labels.currency}`);

  if (payload.promoCode && totals.promoDiscountKyat > 0) {
    lines.push(`Promo ${payload.promoCode}: −${kyat(totals.promoDiscountKyat)} ${labels.currency}`);
  } else if (payload.promoCode) {
    // A free-delivery code discounts nothing but must still be recorded, or the
    // shop cannot tell why delivery was waived.
    lines.push(`Promo ${payload.promoCode}: free delivery`);
  }

  if (totals.pointsSpent > 0) {
    lines.push(
      `Points (${totals.pointsSpent}): −${kyat(totals.pointsDiscountKyat)} ${labels.currency}`,
    );
  }

  if (totals.deliveryKyat > 0) {
    lines.push(`Delivery: ${kyat(totals.deliveryKyat)} ${labels.currency}`);
  }

  lines.push(`TOTAL: ${kyat(totals.totalKyat)} ${labels.currency}`);
  lines.push('');

  lines.push('— — —');
  lines.push(`Name: ${payload.contact.name}`);
  lines.push(`Phone: ${payload.contact.phone}`);
  if (payload.posCustomerNumber) lines.push(`Member: ${payload.posCustomerNumber}`);

  lines.push(payload.contact.fulfilment === 'delivery' ? 'Delivery requested' : 'Collecting in shop');
  if (payload.contact.fulfilment === 'delivery' && payload.contact.address.trim()) {
    lines.push(`Address: ${payload.contact.address.trim()}`);
  }
  if (payload.contact.note.trim()) lines.push(`Note: ${payload.contact.note.trim()}`);

  return lines.join('\n');
}

/* ── Deep link ─────────────────────────────────────────────────────────────── */

export type TelegramLink =
  | { ok: true; url: string; message: string }
  /** Too long to survive the URL. The UI offers copy-and-paste instead. */
  | { ok: false; reason: 'too-long'; message: string; length: number };

/**
 * Builds the `t.me` link with the message pre-filled.
 *
 * Refuses rather than truncates. A shortened order silently loses whatever is at
 * the end — the contact details and the prescription — so a copy-paste fallback
 * the customer can see is far better than a link that looks fine and arrives
 * incomplete.
 */
export function buildTelegramUrl(message: string, handle = env.telegramHandle): TelegramLink {
  const clean = handle.replace(/^@/, '').trim();
  const url = `https://t.me/${encodeURIComponent(clean)}?text=${encodeURIComponent(message)}`;

  if (url.length > MAX_TELEGRAM_URL) {
    return { ok: false, reason: 'too-long', message, length: url.length };
  }

  return { ok: true, url, message };
}

/** Copies the message to the clipboard, for the fallback path. */
export async function copyOrderMessage(message: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(message);
    return true;
  } catch {
    // Clipboard access is refused on insecure origins and by some permission
    // settings. The caller shows the message in a selectable textarea instead.
    return false;
  }
}

/** The shop's Telegram, for a plain "message us" link with no order attached. */
export function telegramProfileUrl(handle = env.telegramHandle): string {
  return `https://t.me/${encodeURIComponent(handle.replace(/^@/, '').trim())}`;
}
