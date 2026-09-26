/**
 * UserCreditStatus — a shop's credit at a glance.
 *
 * ── What a shop owner opens this to find out ───────────────────────────────
 * "How much more can I order?" first — so the remaining balance is the one big
 * number. Then three rings, each one allowance being used up:
 *
 *   Credit used     outstanding of the credit limit
 *   Payment term    days gone of the 14-day term on the oldest open bill
 *   On-time score   bills paid on time, of the last ones decided
 *
 * and underneath, the open bills themselves — which doubles as the table view
 * of the rings: every figure a ring shows is printed in words somewhere here.
 *
 * ── The numbers come from the POS's own rules ──────────────────────────────
 * Status, "used" and the due dates are derived by `lib/pos/credit.ts` from the
 * shop's vouchers against today, exactly as the POS derives them. The cached
 * `shops.credit.outstanding` is never shown: it is a hint for list views, and
 * a hint that lags a payment would tell a shop it owes money it has paid.
 */
import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Gift, Loader2, Lock, ReceiptText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CreditRing, type MeterTone } from '@/app/components/credit/credit-ring';
import { cn } from '@/app/components/ui/utils';
import { useShopCredit } from '@/app/hooks/use-shop-credit';
import { DUE_REMINDER_DAYS, ageVoucher, isOpenReceivable, type CreditStatus } from '@/lib/pos/credit';
import { LOYALTY_DISCOUNT_PCT, LOYALTY_WINDOW } from '@/lib/pos/loyalty';
import { toDate, type DateLike } from '@/lib/pos/schema';
import { formatKyat, formatNumber } from '@/lib/format';
import type { AppRole } from '@/lib/rbac';

const STATUS_META: Record<CreditStatus, { tone: MeterTone; icon: typeof CheckCircle2 }> = {
  ACTIVE: { tone: 'ok', icon: CheckCircle2 },
  WATCH: { tone: 'warn', icon: Clock },
  OVERDUE: { tone: 'crit', icon: AlertTriangle },
  LOCKED: { tone: 'crit', icon: Lock },
};

const TONE_CLASSES: Record<MeterTone, string> = {
  ok: 'border-primary/25 bg-primary/10 text-primary',
  warn: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  crit: 'border-destructive/40 bg-destructive/10 text-destructive',
};

function useDay() {
  const { i18n } = useTranslation();
  return (value: DateLike) => {
    const date = toDate(value);
    if (!date) return '—';
    return new Intl.DateTimeFormat(i18n.language === 'my' ? 'my-MM' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      numberingSystem: 'latn',
    }).format(date);
  };
}

function Figure({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="font-myanmar text-[0.8rem] text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'whitespace-nowrap text-[0.88rem] tabular-nums text-foreground',
          emphasis ? 'font-bold' : 'font-semibold',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-4">
      <h3 className="mb-3 text-center font-myanmar text-[0.85rem] font-bold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function UserCreditStatus({
  shopId,
  role,
}: {
  shopId: string | null;
  role: AppRole | null;
}) {
  const { t } = useTranslation();
  const day = useDay();
  const account = useShopCredit(shopId, role);

  if (account.status === 'idle') return null;

  if (account.status === 'loading') {
    return (
      <div className="grid place-items-center py-16" aria-busy="true">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  if (account.status !== 'ready') {
    return (
      <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center text-sm text-foreground">
        <span className="font-myanmar">
          {t(account.status === 'missing' ? 'account.missing' : 'account.loadFailed')}
        </span>
      </p>
    );
  }

  const { shop, vouchers, credit, loyalty } = account;
  const today = new Date();

  /* ── Credit used ──────────────────────────────────────────────────────── */

  const hasLimit = credit.creditLimit > 0;
  const usedPct = hasLimit ? Math.round((credit.outstanding / credit.creditLimit) * 100) : 0;
  const usedTone: MeterTone =
    credit.status === 'LOCKED' || usedPct >= 100 ? 'crit' : usedPct >= 75 ? 'warn' : 'ok';

  /* ── Payment term ─────────────────────────────────────────────────────── */

  const next = credit.nextDue;
  const termDays = shop.creditTermDays;
  const daysLeft = next?.daysUntilDue ?? null;
  const termTone: MeterTone =
    daysLeft === null ? 'ok' : daysLeft < 0 ? 'crit' : daysLeft <= DUE_REMINDER_DAYS ? 'warn' : 'ok';
  const elapsed = daysLeft === null ? 0 : Math.min(termDays, Math.max(0, termDays - daysLeft));

  const termFigure =
    daysLeft === null ? '—' : daysLeft < 0 ? String(-daysLeft) : String(daysLeft);
  const termCaption =
    daysLeft === null
      ? t('account.term.nothingOwed')
      : daysLeft < 0
        ? t('account.term.overdueCaption', { count: -daysLeft })
        : daysLeft === 0
          ? t('account.term.dueToday')
          : t('account.term.daysLeftCaption', { count: daysLeft });

  /* ── Loyalty ──────────────────────────────────────────────────────────── */

  const loyaltyTone: MeterTone = loyalty.scorePct === null || loyalty.perfect ? 'ok' : 'warn';

  /* ── Header ───────────────────────────────────────────────────────────── */

  const status = STATUS_META[credit.status];
  const StatusIcon = status.icon;

  const open = vouchers
    .filter(isOpenReceivable)
    .map((voucher) => ({ voucher, aging: ageVoucher(voucher, today) }))
    .sort((a, b) => (a.aging.dueDate?.getTime() ?? 0) - (b.aging.dueDate?.getTime() ?? 0));

  return (
    <div className="space-y-4">
      {/* ── The one number ─────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-foreground">{shop.name}</h2>
            <p className="truncate text-[0.75rem] text-muted-foreground">
              {[shop.code, shop.township].filter(Boolean).join(' · ')}
            </p>
          </div>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.72rem] font-bold',
              TONE_CLASSES[status.tone],
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />
            <span className="font-myanmar">{t(`account.status.${credit.status}`)}</span>
          </span>
        </div>

        <p className="mt-5 font-myanmar text-[0.8rem] font-medium text-muted-foreground">
          {t('account.available')}
        </p>
        {/* The figure large and the currency small, so a seven-digit balance
            stays on one line on a phone rather than breaking before "MMK". */}
        <p className="mt-1 font-bold leading-none tracking-tight text-foreground">
          {hasLimit ? (
            <>
              <span className="text-[2.6rem] sm:text-5xl">{formatNumber(credit.availableCredit ?? 0)}</span>
              <span className="ml-1.5 text-lg text-muted-foreground">MMK</span>
            </>
          ) : (
            <span className="text-2xl">{t('account.noLimit')}</span>
          )}
        </p>
      </section>

      {/* ── Reminders: due soon, overdue, locked ───────────────────────── */}
      {credit.status === 'LOCKED' ? (
        <p role="alert" className={cn('flex items-start gap-2 rounded-2xl border p-3.5 text-sm', TONE_CLASSES.crit)}>
          <Lock className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
          <span className="font-myanmar">
            {t(credit.manualHold ? 'account.lockedManual' : 'account.lockedOverdue', {
              amount: formatKyat(credit.overdueAmount),
            })}
          </span>
        </p>
      ) : next && daysLeft !== null && daysLeft <= DUE_REMINDER_DAYS ? (
        <p
          role="status"
          className={cn('flex items-start gap-2 rounded-2xl border p-3.5 text-sm', TONE_CLASSES[termTone])}
        >
          <Clock className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
          <span className="font-myanmar">
            {daysLeft < 0
              ? t('account.reminderOverdue', { count: -daysLeft, amount: formatKyat(next.balanceDue) })
              : daysLeft === 0
                ? t('account.reminderToday', { amount: formatKyat(next.balanceDue) })
                : t('account.reminderSoon', { count: daysLeft, amount: formatKyat(next.balanceDue) })}
          </span>
        </p>
      ) : null}

      {/* ── The three rings ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Panel title={t('account.used.title')}>
          <CreditRing
            value={credit.outstanding}
            max={credit.creditLimit}
            tone={usedTone}
            figure={hasLimit ? `${usedPct}%` : '—'}
            caption={t('account.used.caption')}
            label={
              hasLimit
                ? t('account.used.label', { pct: usedPct })
                : t('account.noLimit')
            }
          />
          <dl className="mt-3 divide-y divide-border">
            <Figure label={t('account.limit')} value={hasLimit ? formatKyat(credit.creditLimit) : t('account.noLimit')} />
            <Figure label={t('account.usedCredit')} value={formatKyat(credit.outstanding)} />
            <Figure
              label={t('account.remaining')}
              value={hasLimit ? formatKyat(credit.availableCredit ?? 0) : '—'}
              emphasis
            />
          </dl>
        </Panel>

        <Panel title={t('account.term.title')}>
          <CreditRing
            value={elapsed}
            max={next ? termDays : 0}
            tone={termTone}
            figure={termFigure}
            caption={termCaption}
            label={
              next
                ? t('account.term.label', { elapsed, term: termDays })
                : t('account.term.nothingOwed')
            }
          />
          <dl className="mt-3 divide-y divide-border">
            <Figure label={t('account.term.dueDate')} value={next ? day(next.dueDate) : '—'} />
            <Figure label={t('account.term.amount')} value={next ? formatKyat(next.balanceDue) : '—'} emphasis />
            <Figure label={t('account.term.voucher')} value={next?.voucherNo ?? '—'} />
          </dl>
        </Panel>

        <Panel title={t('account.loyalty.title')}>
          <CreditRing
            value={loyalty.onTime}
            max={loyalty.considered}
            tone={loyaltyTone}
            figure={loyalty.scorePct === null ? '—' : `${loyalty.scorePct}%`}
            caption={t('account.loyalty.caption')}
            label={
              loyalty.scorePct === null
                ? t('account.loyalty.noHistory')
                : t('account.loyalty.label', { pct: loyalty.scorePct })
            }
          />
          <p className="mt-3 text-center text-[0.78rem] text-muted-foreground">
            <span className="font-myanmar">
              {loyalty.considered > 0
                ? t('account.loyalty.summary', { onTime: loyalty.onTime, considered: loyalty.considered })
                : t('account.loyalty.noHistory')}
            </span>
          </p>

          {loyalty.couponAvailable ? (
            <p className={cn('mt-3 flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2 text-[0.8rem] font-bold', TONE_CLASSES.ok)}>
              <Gift className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
              <span className="font-myanmar">{t('account.loyalty.couponReady', { pct: LOYALTY_DISCOUNT_PCT })}</span>
            </p>
          ) : (
            <p className="mt-3 text-center text-[0.72rem] leading-relaxed text-muted-foreground">
              <span className="font-myanmar">
                {loyalty.perfect
                  ? t('account.loyalty.couponSpent', { pct: LOYALTY_DISCOUNT_PCT })
                  : t('account.loyalty.howToEarn', { pct: LOYALTY_DISCOUNT_PCT, window: LOYALTY_WINDOW })}
              </span>
            </p>
          )}
        </Panel>
      </div>

      {/* ── Open bills — the rings, as a table ─────────────────────────── */}
      <section className="rounded-3xl border border-border bg-card p-4">
        <h3 className="mb-2 flex items-center gap-2 text-[0.85rem] font-bold text-foreground">
          <ReceiptText className="h-4 w-4 text-primary" strokeWidth={2.2} aria-hidden="true" />
          <span className="font-myanmar">{t('account.open.title')}</span>
        </h3>

        {open.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            <span className="font-myanmar">{t('account.open.empty')}</span>
          </p>
        ) : (
          // Two columns — the bill and what is owed on it — so it fits a phone
          // without scrolling sideways; the dates ride under the number.
          <table className="w-full text-left text-[0.8rem]">
            <thead className="sr-only">
              <tr>
                <th scope="col">{t('account.open.voucher')}</th>
                <th scope="col">{t('account.open.balance')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {open.map(({ voucher, aging }) => (
                <tr key={voucher.id}>
                  <td className="py-2.5 pr-3">
                    <span className="block font-semibold text-foreground" dir="ltr">
                      {voucher.voucherNo}
                    </span>
                    <span className="mt-0.5 block text-[0.72rem] text-muted-foreground">
                      <span className="font-myanmar">{t('account.open.issued')}</span> {day(voucher.issueDate)}
                      {' · '}
                      <span className={cn(aging.isOverdue && 'font-bold text-destructive')}>
                        <span className="font-myanmar">{t('account.open.due')}</span> {day(aging.dueDate)}
                        {aging.isOverdue ? (
                          <span className="ml-1 font-myanmar">
                            ({t('account.open.overdueBy', { count: aging.daysOverdue })})
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-2.5 text-right align-top font-semibold tabular-nums text-foreground">
                    {formatKyat(voucher.balanceDue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
