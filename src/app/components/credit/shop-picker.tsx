/**
 * Which shop a member of staff is acting for.
 *
 * A sales rep sees their own patch — the rules would refuse anything else, so
 * listing it would only produce shops that fail to open. An admin sees every
 * active shop. A shop account never sees this: it is pinned to its own.
 *
 * A native `<select>` on purpose. A rep's patch is a few dozen shops, the
 * phone's own picker is the fastest way through a list that size, and it
 * works with every screen reader without a line of ARIA.
 */
import { useEffect, useState } from 'react';
import { Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/app/stores/auth-store';
import type { PosShop } from '@/lib/pos/schema';
import { listChoosableShops } from '@/lib/pos/shop-data';
import type { AppRole } from '@/lib/rbac';

export function ShopPicker({
  role,
  value,
  onChange,
}: {
  role: AppRole;
  value: string | null;
  onChange: (shop: { id: string; name: string } | null) => void;
}) {
  const { t } = useTranslation();
  const uid = useAuthStore((s) => s.user?.uid ?? null);

  const [shops, setShops] = useState<PosShop[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let active = true;
    setFailed(false);

    listChoosableShops({ uid, role })
      .then((result) => {
        if (active) setShops(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [uid, role]);

  return (
    <label className="block rounded-3xl border border-border bg-card p-4">
      <span className="mb-2 flex items-center gap-2 text-[0.85rem] font-bold text-foreground">
        <Store className="h-4 w-4 text-primary" strokeWidth={2.2} aria-hidden="true" />
        <span className="font-myanmar">
          {t(role === 'sales' ? 'account.picker.labelSales' : 'account.picker.labelAdmin')}
        </span>
      </span>

      {failed ? (
        <span role="alert" className="block text-sm text-destructive">
          <span className="font-myanmar">{t('account.picker.loadFailed')}</span>
        </span>
      ) : (
        <select
          value={value ?? ''}
          disabled={shops === null}
          onChange={(event) => {
            const shop = shops?.find((s) => s.id === event.target.value);
            onChange(shop ? { id: shop.id, name: shop.name } : null);
          }}
          className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          <option value="">
            {shops === null
              ? t('common.loading')
              : shops.length === 0
                ? t('account.picker.none')
                : t('account.picker.placeholder')}
          </option>
          {(shops ?? []).map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
              {shop.township ? ` · ${shop.township}` : ''}
            </option>
          ))}
        </select>
      )}
    </label>
  );
}
