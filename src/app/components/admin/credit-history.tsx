/**
 * Every credit voucher issued, newest first, with a delete for mistakes.
 *
 * Reachable only from `/admin/credit`, which is already behind the admin gate
 * — so unlike the mockup this was ported from, there is no second in-page
 * permission check here. Anyone who can see this list already passed the one
 * check that matters, at the route.
 */
import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/app/components/ui/button';
import { deleteCreditOrder, type CreditOrderDoc } from '@/lib/firestore/credit';
import { formatKyat } from '@/lib/format';

export function CreditHistory({ orders, loading }: { orders: CreditOrderDoc[]; loading: boolean }) {
  const { t, i18n } = useTranslation();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dateFormatter = new Intl.DateTimeFormat(i18n.language === 'my' ? 'my-MM' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    numberingSystem: 'latn',
  });

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCreditOrder(id);
      setConfirmingId(null);
    } catch {
      toast.error(t('common.errorBody'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
        <span className="font-myanmar">{t('credit.historySection')}</span>
      </h2>

      {loading ? (
        <p className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading')}
        </p>
      ) : orders.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          <span className="font-myanmar">{t('credit.historyEmpty')}</span>
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {orders.map((order) => (
            <li key={order.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{order.shopName}</p>
                  <p className="text-[0.72rem] text-muted-foreground">
                    {dateFormatter.format(new Date(order.createdAtMs))} · {order.paymentMethod}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                  {formatKyat(order.totalDueKyat)}
                </p>
              </div>

              <p className="mt-1 text-[0.72rem] text-muted-foreground">
                {t('credit.voucherTodayPayment')}: {formatKyat(order.paymentKyat)} ·{' '}
                {t('credit.voucherRemainingBalance')}: {formatKyat(order.remainingKyat)}
              </p>

              <div className="mt-1.5 flex flex-wrap gap-1">
                {order.lines.map((line) => (
                  <span
                    key={line.frameId}
                    className="rounded-full bg-muted px-2 py-0.5 text-[0.68rem] text-muted-foreground"
                  >
                    {line.frameCode} · {line.totalPieces}
                  </span>
                ))}
              </div>

              <div className="mt-2 flex justify-end">
                {confirmingId === order.id ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={deletingId === order.id}
                      onClick={() => void remove(order.id)}
                    >
                      {deletingId === order.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      {t('admin.confirmDelete')}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmingId(null)}>
                      {t('actions.cancel')}
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(order.id)}
                    aria-label={t('credit.deleteOrder', { reference: order.id })}
                    className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.9} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
