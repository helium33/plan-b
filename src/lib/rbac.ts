/**
 * Who may do what in this app.
 *
 * ── Three audiences ────────────────────────────────────────────────────────
 *   admin — everything, including what things cost and what they earn.
 *   sales — the shops assigned to them: order for them, take returns, see
 *           their credit. Never costs or profit.
 *   shop  — a customer account tied to one POS shop: the catalogue, its own
 *           credit, its own orders.
 *
 * The role is the POS's custom claim on the Firebase ID token (`ADMIN`,
 * `SALES`, `SHOP`), set with `npm run set-role` in the POS repo. It is read
 * from the token because that is what the security rules read — a role taken
 * from a document the user can see could disagree with the rules and leave the
 * UI offering buttons that every write then refuses.
 *
 * ── This decides what is *offered*, not what is *allowed* ──────────────────
 * The shared `firestore.rules` is the enforcement. This table exists so the UI
 * does not show a shop an order-for-another-shop picker the rules would reject.
 * Keep the two in step: a permission granted here and not there is a button
 * that always fails; the other way round is a feature nobody can find.
 *
 * The POS's back-office roles (`ACCOUNTANT`, `WAREHOUSE`) have no web-app role:
 * their work lives in the POS, and here they browse like anyone else.
 */
import type { PosRole } from '@/lib/pos/schema';

export type AppRole = 'admin' | 'sales' | 'shop';

export type Permission =
  /** Place an order on credit — `handlePurchase`. */
  | 'purchase:credit'
  /** See a shop's limit, balance and loyalty score. */
  | 'credit:view'
  /** Choose which shop to act for. A shop account is pinned to its own. */
  | 'shops:choose'
  /** See every shop, not just an assigned patch. */
  | 'shops:all'
  /** Take back defective goods and credit the shop — `processReturn`. */
  | 'return:process'
  /** Landed cost, margins, profit and the reports built on them. */
  | 'cost:view'
  | 'reports:view'
  | 'settings:manage';

const GRANTS: Record<AppRole, readonly Permission[] | '*'> = {
  admin: '*',
  sales: ['purchase:credit', 'credit:view', 'shops:choose', 'return:process'],
  shop: ['purchase:credit', 'credit:view'],
};

export function appRoleFor(role: PosRole | null): AppRole | null {
  switch (role) {
    case 'ADMIN':
      return 'admin';
    case 'SALES':
      return 'sales';
    case 'SHOP':
      return 'shop';
    default:
      return null;
  }
}

export function can(role: AppRole | null, permission: Permission): boolean {
  if (!role) return false;
  const granted = GRANTS[role];
  return granted === '*' || granted.includes(permission);
}
