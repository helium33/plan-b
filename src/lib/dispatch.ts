/**
 * Order dispatch: formatting the voucher as text, and building the deep links.
 *
 * ── Why a deep link rather than a server ───────────────────────────────────
 * Telegram and Viber are where this trade already runs. A `t.me` link needs no
 * bot token, no backend and no credentials in the client: it opens the buyer's
 * own Telegram with the order pre-typed and they press send. The shop receives
 * it from the buyer's real account, which is a stronger identification than any
 * form on this site could collect.
 *
 * ── The URL length ceiling drives the format ───────────────────────────────
 * The whole order travels in a query parameter. Browsers and the messaging apps
 * both start failing somewhere past a couple of thousand characters, and a
 * truncated order is worse than a rejected one — it silently loses whatever is
 * at the end, which here is the total. So the message is built compactly and
 * `buildTelegramUrl` **refuses** rather than truncates, letting the UI fall back
 * to copy-and-paste.
 */
import { env } from '@/lib/env';
import { needsBank, needsShopName, type Bank, type PaymentMethod } from '@/lib/payment';
import { frameDisplayName } from '@/lib/product';
import type { ShopDetails } from '@/app/stores/order-store';
import type { OrderTotals } from '@/lib/wholesale';

/**
 * Practical ceiling for the encoded URL.
 *
 * Telegram's own limit is generous but the surrounding stack is not: some Android
 * intent handlers truncate around 4,000 characters. 3,500 leaves headroom.
 */
export const MAX_DEEP_LINK_LENGTH = 3_500;

/** Grouped thousands, no currency word — the message adds "MMK" per line. */
function kyat(amount: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(amount));
}

/* ── Reference code ────────────────────────────────────────────────────────── */

/**
 * A short reference for the shop to quote back, e.g. `PBW-7QK2`.
 *
 * Derived from the order's own content rather than randomly generated, so the
 * code shown on the voucher, the code in the sent message and the code after a
 * page refresh are all the same one. A random id would need storing, and a
 * stored id would survive the order it was minted for.
 */
export function orderReference(totals: OrderTotals, shop: ShopDetails): string {
  const seed = [
    shop.shopName.trim().toLowerCase(),
    totals.subtotalKyat,
    totals.totalPieces,
    ...totals.lines.map(
      (line) => `${line.frame.id}:${line.entries.map((e) => `${e.variant.cNumber}${e.qty}`).join('')}`,
    ),
  ].join('|');

  // FNV-1a. Not a security hash — it just needs to spread similar orders across
  // different codes, and to be four lines rather than a dependency.
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return `PBW-${hash.toString(36).toUpperCase().slice(-4).padStart(4, '0')}`;
}

/* ── Message ───────────────────────────────────────────────────────────────── */

/**
 * Labels the message needs, passed in already translated.
 *
 * The order is sent in whichever language the buyer was reading, because that is
 * the language they will be replying in — and because a Burmese shop reading a
 * Burmese order is the normal case, not the exception.
 */
export type DispatchLabels = {
  heading: string;
  shop: string;
  contact: string;
  location: string;
  shipTo: string;
  payment: string;
  pieces: string;
  total: string;
  note: string;
  reference: string;
  currency: string;
};

/**
 * The parts of an order that are not line items.
 *
 * Passed in already resolved and translated rather than as ids, so this module
 * stays free of both i18n and the branch/payment stores — it formats, it does
 * not look things up.
 */
export type DispatchContext = {
  /** Where the goods go: a branch address, or the main shop. */
  shipTo: string;
  /** "Bank transfer (KBZ)", "KPay", "Cash on delivery". */
  payment: string;
};

/**
 * The destination line, resolved once so the printed voucher and the message
 * actually sent can never describe two different addresses for the same order.
 *
 * A branch, when one is selected, always wins over the shop's own address —
 * that is the entire point of picking one. Falling back to the shop's own
 * name and location keeps this readable even for the common case of a single
 * address with no branches on file.
 */
export function resolveShipTo(
  branch: { label: string; city: string; address: string; phone: string } | null,
  shop: Pick<ShopDetails, 'shopName' | 'location'>,
  mainShopLabel: string,
): string {
  return branch
    ? [branch.label, branch.city, branch.address, branch.phone].filter(Boolean).join(', ')
    : [shop.shopName, shop.location].filter(Boolean).join(', ') || mainShopLabel;
}

/* ── Readiness ─────────────────────────────────────────────────────────────── */

/**
 * Why this order cannot be sent yet, or `null` when it can.
 *
 * Both cases describe an order staff would be unable to reconcile afterwards: a
 * transfer with no bank named leaves nobody knowing which account to watch, and
 * a credit sale with no shop named cannot be posted against an account at all.
 *
 * Shared rather than re-derived at each send button, because there are now two
 * of them — the voucher's dispatch panel and the cart drawer — and a drawer that
 * let an order out under conditions the voucher refused would be a hole in the
 * rule rather than a shortcut past it.
 *
 * At most one reason is ever returned: a single `paymentMethod` cannot be both
 * `bank-transfer` and `credit`.
 */
export type DispatchBlock = 'bank' | 'shop-name' | null;

export function dispatchBlockReason(
  paymentMethod: PaymentMethod,
  bank: Bank | null,
  shop: Pick<ShopDetails, 'shopName'>,
): DispatchBlock {
  if (needsBank(paymentMethod) && bank === null) return 'bank';
  if (needsShopName(paymentMethod) && !shop.shopName.trim()) return 'shop-name';
  return null;
}

/* ── Message ───────────────────────────────────────────────────────────────── */

/**
 * Builds the plain-text order.
 *
 * Each line carries the model code, every C-number with its quantity, the
 * arithmetic that produced the line total, and the set discount if one applied.
 * Showing the multiplication rather than only the result is deliberate: the shop
 * keys these into a ledger by hand, and a total they cannot check is a total they
 * will phone about.
 */
export function formatOrderMessage(
  totals: OrderTotals,
  shop: ShopDetails,
  labels: DispatchLabels,
  context: DispatchContext,
): string {
  const lines: string[] = [labels.heading, ''];

  if (shop.shopName.trim()) lines.push(`${labels.shop}: ${shop.shopName.trim()}`);
  if (shop.contactName.trim() || shop.phone.trim()) {
    lines.push(`${labels.contact}: ${[shop.contactName.trim(), shop.phone.trim()].filter(Boolean).join(' · ')}`);
  }
  if (shop.location.trim()) lines.push(`${labels.location}: ${shop.location.trim()}`);
  // Always printed, even when it is the main shop: "where does this go?" is the
  // first thing the packer asks, and an absent line reads as an oversight.
  if (context.shipTo.trim()) lines.push(`${labels.shipTo}: ${context.shipTo.trim()}`);
  lines.push(`${labels.payment}: ${context.payment}`);

  lines.push('———');

  totals.lines.forEach((line, index) => {
    const { frame } = line;
    lines.push(`${index + 1}. ${frame.frameCode} — ${frameDisplayName(frame)}`);
    lines.push(`   ${line.entries.map((e) => `${e.variant.cNumber}×${e.qty}`).join('  ')}`);
    lines.push(
      `   ${line.totalPieces} × ${kyat(frame.wholesalePrice)} = ${kyat(line.subtotalKyat)}`,
    );
    lines.push('');
  });

  lines.push('———');
  lines.push(`${labels.pieces}: ${totals.totalPieces}`);
  // One money line, not a subtotal followed by an identical total. There are no
  // automatic discounts (see `wholesale.ts`), so a breakdown would be two rows
  // of the same number — which reads as an arithmetic bug, not as clarity.
  lines.push(`${labels.total}: ${kyat(totals.subtotalKyat)} ${labels.currency}`);

  if (shop.note.trim()) {
    lines.push('———');
    lines.push(`${labels.note}: ${shop.note.trim()}`);
  }

  lines.push(`${labels.reference}: ${orderReference(totals, shop)}`);

  return lines.join('\n');
}

/* ── Deep links ────────────────────────────────────────────────────────────── */

export type DeepLink =
  | { ok: true; url: string }
  /** Too long to survive the URL. The UI offers copy-and-paste instead. */
  | { ok: false; reason: 'too-long'; length: number };

function guardLength(url: string): DeepLink {
  return url.length > MAX_DEEP_LINK_LENGTH
    ? { ok: false, reason: 'too-long', length: url.length }
    : { ok: true, url };
}

/** Opens the shop's Telegram chat with the order pre-typed. */
export function buildTelegramUrl(message: string, handle = env.telegramHandle): DeepLink {
  const clean = handle.replace(/^@/, '').trim();
  return guardLength(`https://t.me/${encodeURIComponent(clean)}?text=${encodeURIComponent(message)}`);
}

/**
 * Opens Viber with the order pre-typed, for the buyer to send to the shop.
 *
 * `viber://forward` rather than `viber://chat`: only `forward` accepts a `text`
 * parameter. `chat?number=` opens the right conversation but arrives empty, which
 * would mean re-typing the whole order — so the buyer picks the recipient once
 * from Viber's own list instead, and the order is already written.
 */
export function buildViberUrl(message: string): DeepLink {
  return guardLength(`viber://forward?text=${encodeURIComponent(message)}`);
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
