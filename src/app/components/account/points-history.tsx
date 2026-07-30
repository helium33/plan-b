/**
 * The points ledger.
 *
 * Every balance change is listed with its reason, because "you have 1,250
 * points" invites the question "from what?" — and a loyalty scheme that cannot
 * answer that gets treated as arbitrary. Sign is shown explicitly (+/−) so an
 * earn and a redemption are distinguishable at a glance and without relying on
 * colour alone.
 *
 * Fetched once on mount rather than subscribed: history is append-only and the
 * balance itself already updates live from the member document, so a listener
 * here would cost reads for no visible benefit.
 */
import { useEffect, useState } from 'react';
import { History, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/components/ui/utils';
import { useLanguage } from '@/app/hooks/use-language';
import { getPointsHistory } from '@/lib/firestore/members';
import { formatDate, formatNumber } from '@/lib/format';
import type { PointsEntry } from '@/lib/membership';

export function PointsHistory({ phoneKey }: { phoneKey: string }) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const [entries, setEntries] = useState<PointsEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    getPointsHistory(phoneKey)
      .then((result) => {
        if (active) setEntries(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [phoneKey]);

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-6 py-4">
        <History className="h-4 w-4 text-muted-foreground" strokeWidth={1.9} aria-hidden="true" />
        <h2 className="text-sm font-medium text-foreground">{t('account.pointsHistory')}</h2>
      </header>

      {entries === null && !failed ? (
        <p className="flex items-center gap-2 px-6 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t('common.loading')}
        </p>
      ) : null}

      {failed ? (
        <p className="px-6 py-8 text-sm text-muted-foreground">{t('common.errorBody')}</p>
      ) : null}

      {entries?.length === 0 ? (
        <p className="px-6 py-8 text-sm text-muted-foreground">{t('account.noPointsYet')}</p>
      ) : null}

      {entries && entries.length > 0 ? (
        <ul className="divide-y divide-border">
          {entries.map((entry, index) => {
            const earned = entry.points >= 0;

            return (
              <li
                key={`${entry.reason}-${index}`}
                className="flex items-center justify-between gap-4 px-6 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    {t(`account.pointsReasons.${entry.reason}` as never)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(entry.createdAt, language)}
                    {entry.note ? ` · ${entry.note}` : ''}
                  </p>
                </div>

                <span
                  className={cn(
                    'shrink-0 text-sm font-medium tabular-nums',
                    earned ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                  )}
                  dir="ltr"
                >
                  {earned ? '+' : '−'}
                  {formatNumber(Math.abs(entry.points))}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
