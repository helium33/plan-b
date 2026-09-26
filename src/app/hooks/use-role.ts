/**
 * The signed-in account's role, and the shop it is acting for.
 *
 * ── The acting shop ────────────────────────────────────────────────────────
 * Every credit screen is about one shop. For a `SHOP` account that is simply
 * its own — the `shopId` claim, which it cannot change. A sales rep or admin
 * orders on behalf of shops, so they choose one, and the choice is remembered
 * per account on this device: a rep working through their round should not
 * re-pick the shop after every page change.
 *
 * The remembered choice carries the uid it was made by. A shared counter
 * laptop where a different rep signs in must not open on the last rep's shop.
 */
import { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { useAuthStore } from '@/app/stores/auth-store';
import { appRoleFor, can, type AppRole, type Permission } from '@/lib/rbac';

type ActingShopState = {
  ownerUid: string | null;
  shopId: string | null;
  shopName: string | null;
  choose: (ownerUid: string, shop: { id: string; name: string } | null) => void;
};

export const useActingShopStore = create<ActingShopState>()(
  persist(
    (set) => ({
      ownerUid: null,
      shopId: null,
      shopName: null,
      choose: (ownerUid, shop) =>
        set({ ownerUid, shopId: shop?.id ?? null, shopName: shop?.name ?? null }),
    }),
    { name: 'pbw-acting-shop', version: 1 },
  ),
);

export type UseRole = {
  role: AppRole | null;
  /** False until the token's claims have been read — gate on it to avoid a flash. */
  ready: boolean;
  can: (permission: Permission) => boolean;
  /** The shop every credit screen shows and every credit order is billed to. */
  shopId: string | null;
  /** Only known for a chosen shop; a shop account reads its own name from its document. */
  shopName: string | null;
  /** Staff only: switch the acting shop. A no-op for a shop account. */
  chooseShop: (shop: { id: string; name: string } | null) => void;
};

export function useRole(): UseRole {
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  const claims = useAuthStore((s) => s.claims);
  const ready = useAuthStore((s) => s.claimsReady);

  const ownerUid = useActingShopStore((s) => s.ownerUid);
  const chosenId = useActingShopStore((s) => s.shopId);
  const chosenName = useActingShopStore((s) => s.shopName);
  const choose = useActingShopStore((s) => s.choose);

  const role = appRoleFor(claims.role);
  const mayChoose = can(role, 'shops:choose');

  const chooseShop = useCallback(
    (shop: { id: string; name: string } | null) => {
      if (uid && mayChoose) choose(uid, shop);
    },
    [uid, mayChoose, choose],
  );

  const ownChoice = mayChoose && ownerUid === uid;

  return {
    role,
    ready,
    can: (permission) => can(role, permission),
    shopId: role === 'shop' ? claims.shopId : ownChoice ? chosenId : null,
    shopName: ownChoice ? chosenName : null,
    chooseShop,
  };
}
