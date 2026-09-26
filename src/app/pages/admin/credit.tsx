/**
 * The wholesale credit ledger — one page: pick a shop, fold today's order into
 * their running balance, send the voucher, see the history.
 *
 * See `lib/credit.ts` for the business rules this page is a UI over: a single
 * running balance per shop on a 14-day cycle, rolling forward automatically on
 * every voucher and auto-holding itself if a cycle lapses untouched.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CreditHistory } from '@/app/components/admin/credit-history';
import { CreditShopPicker } from '@/app/components/admin/credit-shop-picker';
import { CreditVoucherPanel } from '@/app/components/admin/credit-voucher-panel';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import {
  subscribeToCreditOrders,
  subscribeToShops,
  type CreditOrderDoc,
} from '@/lib/firestore/credit';
import type { CreditShop } from '@/lib/credit';

export function AdminCreditPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('admin.tabs.credit'));

  const [shops, setShops] = useState<CreditShop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [orders, setOrders] = useState<CreditOrderDoc[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToShops(
      (result) => {
        setShops(result);
        setShopsLoading(false);
        // Keep the selection if the shop still exists; otherwise default to
        // the most recently added one rather than an empty picker.
        setSelectedId((current) =>
          current && result.some((s) => s.id === current) ? current : (result[0]?.id ?? null),
        );
      },
      () => setShopsLoading(false),
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToCreditOrders(
      (result) => {
        setOrders(result);
        setOrdersLoading(false);
      },
      () => setOrdersLoading(false),
    );
    return unsubscribe;
  }, []);

  const shop = shops.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          <span className="font-myanmar">{t('credit.pageTitle')}</span>
        </h2>
        <p className="mt-0.5 text-[0.78rem] text-muted-foreground">{t('credit.pageHint')}</p>
      </div>

      <CreditShopPicker
        shops={shops}
        loading={shopsLoading}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreated={setSelectedId}
      />

      {shop ? (
        <CreditVoucherPanel shop={shop} onSaved={() => {}} />
      ) : !shopsLoading && shops.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          <span className="font-myanmar">{t('credit.noShopsYet')}</span>
        </p>
      ) : null}

      <CreditHistory orders={orders} loading={ordersLoading} />
    </div>
  );
}
