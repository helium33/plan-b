/**
 * One shop's live account: the shop, its vouchers, and what they add up to.
 *
 * Subscribed, not fetched. A payment the office records in the POS, or an
 * order a rep places for the shop, lands on the dashboard while it is open —
 * which is the point of the two apps sharing one database.
 *
 * Credit and loyalty are derived here, on every snapshot, with the same pure
 * functions `handlePurchase` uses to decide whether an order goes through. The
 * dashboard therefore cannot show "available" a figure the checkout refuses.
 */
import { useEffect, useMemo, useState } from 'react';

import { useAuthStore } from '@/app/stores/auth-store';
import { evaluateShopCredit, type ShopCreditState } from '@/lib/pos/credit';
import { evaluateLoyalty, type LoyaltyState } from '@/lib/pos/loyalty';
import type { PosShop, PosVoucher } from '@/lib/pos/schema';
import { subscribeShop, subscribeShopVouchers } from '@/lib/pos/shop-data';
import type { AppRole } from '@/lib/rbac';

export type UseShopCredit =
  | { status: 'idle' | 'loading' | 'error' | 'missing' }
  | {
      status: 'ready';
      shop: PosShop;
      vouchers: PosVoucher[];
      credit: ShopCreditState;
      loyalty: LoyaltyState;
    };

export function useShopCredit(shopId: string | null, role: AppRole | null): UseShopCredit {
  const uid = useAuthStore((s) => s.user?.uid ?? null);

  const [shop, setShop] = useState<PosShop | null | undefined>(undefined);
  const [vouchers, setVouchers] = useState<PosVoucher[] | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setShop(undefined);
    setVouchers(undefined);
    setFailed(false);
    if (!shopId || !uid || !role) return;

    const fail = () => setFailed(true);
    const offShop = subscribeShop(shopId, setShop, fail);
    const offVouchers = subscribeShopVouchers(shopId, { uid, role }, setVouchers, fail);

    return () => {
      offShop();
      offVouchers();
    };
  }, [shopId, uid, role]);

  return useMemo<UseShopCredit>(() => {
    if (!shopId || !uid || !role) return { status: 'idle' };
    if (failed) return { status: 'error' };
    if (shop === undefined || vouchers === undefined) return { status: 'loading' };
    if (shop === null) return { status: 'missing' };

    // "Today" is read per snapshot. A dashboard left open past midnight moves
    // a day on the next change — and on reload — which is as fresh as a
    // credit term counted in whole days needs.
    const today = new Date();
    return {
      status: 'ready',
      shop,
      vouchers,
      credit: evaluateShopCredit(shop, vouchers, today),
      loyalty: evaluateLoyalty(vouchers, today),
    };
  }, [shopId, uid, role, failed, shop, vouchers]);
}
