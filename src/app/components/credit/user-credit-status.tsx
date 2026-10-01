/**
 * UserCreditStatus — what a shop owes, and every voucher behind it.
 *
 * ── One card, three answers ────────────────────────────────────────────────
 * A shop owner opens this to find out how much is left to pay, how much of it
 * is paid already, and the last day to pay. The card answers exactly those,
 * in that order, with the rule underneath: each voucher is due 14 days after
 * it is issued, and a new credit order waits until the last one is paid in
 * full (`canPurchase`'s UNPAID_PREVIOUS).
 *
 * ── Then the vouchers ──────────────────────────────────────────────────────
 * Every sale voucher the shop has, newest first, one line each — and a tap
 * opens the voucher itself: what was bought, what it came to, what is paid.
 *
 * ── The numbers come from the POS's own rules ──────────────────────────────
 * Status and the due dates are derived by `lib/pos/credit.ts` from the shop's
 * vouchers against today, exactly as the POS derives them. The cached
 * `shops.credit.outstanding` is never shown: it is a hint for list views, and
 * a hint that lags a payment would tell a shop it owes money it has paid.
 */
import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Info,
  Loader2,
  Lock,
  ReceiptText,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/components/ui/utils';
import { useShopCredit } from '@/app/hooks/use-shop-credit';
import {
  DUE_REMINDER_DAYS,
  ageVoucher,
  isOpenReceivable,
  type CreditStatus,
  type VoucherAging,
} from '@/lib/pos/credit';
import { WEB_CHANNEL, toDate, type DateLike, type PosVoucher } from '@/lib/pos/schema';
import { formatKyat, formatNumber } from '@/lib/format';
import type { AppRole } from '@/lib/rbac';

type Tone = 'ok' | 'warn' | 'crit' | 'muted';

const STATUS_META: Record<CreditStatus, { tone: Tone; icon: typeof CheckCircle2 }> = {
  ACTIVE: { tone: 'ok', icon: CheckCircle2 },
  WATCH: { tone: 'warn', icon: Clock },
  OVERDUE: { tone: 'crit', icon: AlertTriangle },
  LOCKED: { tone: 'crit', icon: Lock },
};

const TONE_CLASSES: Record<Tone, string> = {
  ok: 'border-primary/25 bg-primary/10 text-primary',
  warn: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  crit: 'border-destructive/40 bg-destructive/10 text-destructive',
  muted: 'border-border bg-muted text-muted-foreground',
};

const BAR_CLASSES: Record<Tone, string> = {
  ok: 'bg-primary',
  warn: 'bg-amber-500',
  crit: 'bg-destructive',
  muted: 'bg-primary',
};

/** How close a due date is, as a tone: comfortable, close, or past. */
function dueTone(daysUntilDue: number | null): Tone {
  if (daysUntilDue === null) return 'muted';
  if (daysUntilDue < 0) return 'crit';
  return daysUntilDue <= DUE_REMINDER_DAYS ? 'warn' : 'ok';
}

/** A date in the reader's language, with the year only when it is not this one. */
function useDay() {
  const { i18n } = useTranslation();
  return (value: DateLike, withYear = false) => {
    const date = toDate(value);
    if (!date) return '—';
    const showYear = withYear || date.getFullYear() !== new Date().getFullYear();
    return new Intl.DateTimeFormat(i18n.language === 'my' ? 'my-MM' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      ...(showYear ? { year: 'numeric' as const } : {}),
      numberingSystem: 'latn',
    }).format(date);
  };
}

function piecesOf(voucher: PosVoucher): number {
  return voucher.items.reduce((sum, item) => sum + item.qty, 0);
}

type Row = { voucher: PosVoucher; aging: VoucherAging; open: boolean };

/** Where a voucher stands, as the chip on its line says it. */
function useVoucherChip() {
  const { t } = useTranslation();
  return ({ voucher, aging, open }: Row): { tone: Tone; label: string } => {
    if (voucher.status === 'VOID') return { tone: 'muted', label: t('account.vouchers.cancelled') };
    if (!open) return { tone: 'ok', label: t('account.vouchers.paid') };
    if (aging.isOverdue) {
      return { tone: 'crit', label: `${t('account.vouchers.late')} · ${formatKyat(voucher.balanceDue)}` };
    }
    return {
      tone: dueTone(aging.daysUntilDue) === 'warn' ? 'warn' : 'muted',
      label: t('account.vouchers.toPay', { amount: formatKyat(voucher.balanceDue) }),
    };
  };
}

function Chip({ tone, children }: { tone: Tone; children: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full shrink-0 items-center rounded-full border px-2 py-0.5 text-[0.7rem] font-bold',
        TONE_CLASSES[tone],
      )}
    >
      <span className="truncate font-myanmar">{children}</span>
    </span>
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
  const chipFor = useVoucherChip();
  const account = useShopCredit(shopId, role);
  const [openId, setOpenId] = useState<string | null>(null);

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

  const { shop, vouchers, credit } = account;
  const today = new Date();

  // Sale vouchers only: a consignment is goods left to sell, not a purchase,
  // and a draft was never issued.
  const rows: Row[] = vouchers
    .filter((voucher) => voucher.type === 'SALE' && voucher.status !== 'DRAFT')
    .map((voucher) => ({ voucher, aging: ageVoucher(voucher, today), open: isOpenReceivable(voucher) }))
    .sort(
      (a, b) =>
        (toDate(b.voucher.issueDate)?.getTime() ?? 0) - (toDate(a.voucher.issueDate)?.getTime() ?? 0),
    );

  /* ── The card ─────────────────────────────────────────────────────────── */

  const owing = rows.filter((row) => row.open);
  const leftToPay = credit.outstanding;
  const paid = owing.reduce((sum, row) => sum + row.voucher.paidAmount, 0);
  const paidPct = leftToPay + paid > 0 ? Math.round((paid / (leftToPay + paid)) * 100) : 0;

  const next = credit.nextDue;
  const daysLeft = next?.daysUntilDue ?? null;
  const nextTone = dueTone(daysLeft);
  const dueCaption =
    daysLeft === null
      ? null
      : daysLeft < 0
        ? t('account.card.daysLate', { count: -daysLeft })
        : daysLeft === 0
          ? t('account.card.dueToday')
          : t('account.card.daysLeft', { count: daysLeft });

  const status = STATUS_META[credit.status];
  const StatusIcon = status.icon;
  const selected = rows.find((row) => row.voucher.id === openId) ?? null;

  return (
    <div className="space-y-4">
      {/* ── One card: left to pay, paid, last day ─────────────────────── */}
      <section className="rounded-3xl border border-border bg-card p-5" aria-labelledby="credit-card-title">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="credit-card-title" className="truncate text-base font-bold text-foreground">
              {shop.name}
            </h2>
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
          {t('account.card.leftToPay')}
        </p>
        {/* The figure large and the currency small, so a seven-digit balance
            stays on one line on a phone rather than breaking before "MMK". */}
        <p className="mt-1 font-bold leading-none tracking-tight text-foreground">
          <span className="text-[2.6rem] sm:text-5xl">{formatNumber(leftToPay)}</span>
          <span className="ml-1.5 text-lg text-muted-foreground">MMK</span>
        </p>

        {owing.length > 0 ? (
          <>
            {/* Paid of the whole, as a bar. The two figures it stands for are
                printed right under it, so it carries nothing on its own. */}
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div
                className={cn('h-full rounded-full', BAR_CLASSES[nextTone])}
                style={{ width: `${paidPct}%` }}
              />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-transparent bg-muted/60 p-3">
                <dt className="font-myanmar text-[0.75rem] text-muted-foreground">{t('account.card.paid')}</dt>
                <dd className="mt-1 text-[1.05rem] font-bold tabular-nums text-foreground">{formatKyat(paid)}</dd>
              </div>
              <div
                className={cn(
                  'rounded-2xl border p-3',
                  nextTone === 'warn' || nextTone === 'crit'
                    ? TONE_CLASSES[nextTone]
                    : 'border-transparent bg-muted/60 text-muted-foreground',
                )}
              >
                <dt className="font-myanmar text-[0.75rem]">{t('account.card.lastDay')}</dt>
                <dd className="mt-1 text-[1.05rem] font-bold text-foreground">{next ? day(next.dueDate) : '—'}</dd>
                {dueCaption ? (
                  <dd className="mt-0.5 font-myanmar text-[0.75rem] font-semibold">{dueCaption}</dd>
                ) : null}
              </div>
            </dl>

            {next ? (
              <p className="mt-2 text-[0.75rem] text-muted-foreground">
                <span className="font-myanmar">
                  {owing.length > 1
                    ? t('account.card.forVouchers', { count: owing.length })
                    : t('account.card.forVoucher', { voucherNo: next.voucherNo })}
                </span>
              </p>
            ) : null}
          </>
        ) : (
          <p className={cn('mt-4 flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold', TONE_CLASSES.ok)}>
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
            <span className="font-myanmar">
              {t('account.card.nothingOwed')}
              {credit.status !== 'LOCKED' ? ` · ${t('account.card.canOrder')}` : ''}
            </span>
          </p>
        )}

        <p className="mt-4 flex items-start gap-2 border-t border-border pt-3 text-[0.75rem] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
          <span className="font-myanmar">{t('account.card.rule')}</span>
        </p>
      </section>

      {/* ── Why ordering on credit is paused, when it is ──────────────── */}
      {credit.status === 'LOCKED' ? (
        <p role="alert" className={cn('flex items-start gap-2 rounded-2xl border p-3.5 text-sm', TONE_CLASSES.crit)}>
          <Lock className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
          <span className="font-myanmar">
            {t(credit.manualHold ? 'account.lockedManual' : 'account.lockedOverdue', {
              amount: formatKyat(credit.overdueAmount),
            })}
          </span>
        </p>
      ) : null}

      {/* ── Every voucher, one line each ──────────────────────────────── */}
      <section className="rounded-3xl border border-border bg-card p-2" aria-labelledby="credit-vouchers-title">
        <h3
          id="credit-vouchers-title"
          className="flex items-center gap-2 px-3 pb-1 pt-2 text-[0.85rem] font-bold text-foreground"
        >
          <ReceiptText className="h-4 w-4 text-primary" strokeWidth={2.2} aria-hidden="true" />
          <span className="font-myanmar">{t('account.vouchers.title')}</span>
        </h3>

        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            <span className="font-myanmar">{t('account.vouchers.empty')}</span>
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => {
              const chip = chipFor(row);
              const pieces = piecesOf(row.voucher);
              return (
                <li key={row.voucher.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(row.voucher.id)}
                    aria-label={t('account.vouchers.openDetail', { voucherNo: row.voucher.voucherNo })}
                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span
                          className={cn(
                            'truncate text-[0.9rem] font-bold',
                            row.voucher.status === 'VOID' ? 'text-muted-foreground line-through' : 'text-foreground',
                          )}
                          dir="ltr"
                        >
                          {row.voucher.voucherNo}
                        </span>
                        <span className="whitespace-nowrap text-[0.88rem] font-semibold tabular-nums text-foreground">
                          {formatKyat(row.voucher.grandTotal)}
                        </span>
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-3">
                        <span className="truncate text-[0.75rem] text-muted-foreground">
                          {day(row.voucher.issueDate)}
                          {pieces > 0 ? (
                            <>
                              {' · '}
                              <span className="font-myanmar">{t('account.vouchers.pieces', { count: pieces })}</span>
                            </>
                          ) : null}
                        </span>
                        <Chip tone={chip.tone}>{chip.label}</Chip>
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <VoucherDetail row={selected} onClose={() => setOpenId(null)} />
    </div>
  );
}

/* ── One voucher, opened ─────────────────────────────────────────────────── */

function Line({ label, value, strong, late }: { label: string; value: string; strong?: boolean; late?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="font-myanmar text-[0.8rem] text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'whitespace-nowrap text-[0.88rem] tabular-nums',
          strong ? 'font-bold' : 'font-semibold',
          late ? 'text-destructive' : 'text-foreground',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function VoucherDetail({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const { t } = useTranslation();
  const day = useDay();
  const chipFor = useVoucherChip();

  if (!row) return null;
  const { voucher, aging, open } = row;
  const chip = chipFor(row);
  const late = open && aging.isOverdue;
  const cancelled = voucher.status === 'VOID';

  return (
    <DialogPrimitive.Root open onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        {/* A sheet from the bottom on a phone, a card in the middle on a
            larger screen. */}
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-3xl border border-border bg-background shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
            <ReceiptText className="h-5 w-5 shrink-0 text-primary" strokeWidth={2.2} aria-hidden="true" />
            <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-base font-bold text-foreground" dir="ltr">
              {voucher.voucherNo}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t('account.vouchers.detail.close')}
            >
              <X className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <dl className="divide-y divide-border">
              <Line label={t('account.vouchers.detail.issued')} value={day(voucher.issueDate, true)} />
              {cancelled ? null : (
                <Line label={t('account.vouchers.detail.due')} value={day(aging.dueDate, true)} late={late} />
              )}
              <div className="flex items-center justify-between gap-3 py-1.5">
                <dt className="font-myanmar text-[0.8rem] text-muted-foreground">
                  {t('account.vouchers.detail.status')}
                </dt>
                <dd>
                  <Chip tone={chip.tone}>{chip.label}</Chip>
                </dd>
              </div>
            </dl>
            <p className="mt-1 font-myanmar text-[0.72rem] text-muted-foreground">
              {t(voucher.channel === WEB_CHANNEL ? 'account.vouchers.detail.fromWeb' : 'account.vouchers.detail.fromOffice')}
            </p>

            {/* ── What was bought ──────────────────────────────────────── */}
            {voucher.items.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
                <span className="font-myanmar">{t('account.vouchers.detail.noItems')}</span>
              </p>
            ) : (
              <table className="mt-4 w-full text-left text-[0.8rem]">
                <thead>
                  <tr className="border-b border-border text-[0.72rem] text-muted-foreground">
                    <th scope="col" className="pb-1.5 font-semibold">
                      <span className="font-myanmar">{t('account.vouchers.detail.item')}</span>
                    </th>
                    <th scope="col" className="pb-1.5 text-right font-semibold">
                      <span className="font-myanmar">{t('account.vouchers.detail.qty')}</span>
                    </th>
                    <th scope="col" className="pb-1.5 text-right font-semibold">
                      <span className="font-myanmar">{t('account.vouchers.detail.amount')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {voucher.items.map((item, index) => (
                    <tr key={`${item.productId}|${item.colorCode}|${index}`}>
                      <td className="py-2 pr-2">
                        <span className="block font-semibold text-foreground" dir="ltr">
                          {item.modelNo || item.productId}
                        </span>
                        <span className="block text-[0.72rem] text-muted-foreground">
                          <span dir="ltr">{item.colorCode}</span>
                          {item.colorName ? ` · ${item.colorName}` : ''}
                          {' · '}
                          {formatKyat(item.unitPrice)}
                        </span>
                      </td>
                      <td className="py-2 text-right align-top font-semibold tabular-nums text-foreground">
                        {item.qty}
                      </td>
                      <td className="whitespace-nowrap py-2 pl-2 text-right align-top font-semibold tabular-nums text-foreground">
                        {formatKyat(item.lineTotal || item.qty * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── What it came to, and what is paid ────────────────────── */}
            <dl className="mt-3 divide-y divide-border border-t-2 border-border">
              {voucher.discount > 0 ? (
                <>
                  <Line label={t('account.vouchers.detail.subtotal')} value={formatKyat(voucher.subtotal)} />
                  <Line label={t('account.vouchers.detail.discount')} value={`− ${formatKyat(voucher.discount)}`} />
                </>
              ) : null}
              <Line label={t('account.vouchers.detail.total')} value={formatKyat(voucher.grandTotal)} strong />
              {cancelled ? null : (
                <>
                  <Line label={t('account.vouchers.detail.paid')} value={formatKyat(voucher.paidAmount)} />
                  {voucher.creditedAmount > 0 ? (
                    <Line
                      label={t('account.vouchers.detail.returned')}
                      value={`− ${formatKyat(voucher.creditedAmount)}`}
                    />
                  ) : null}
                  <Line
                    label={t('account.vouchers.detail.balance')}
                    value={formatKyat(open ? voucher.balanceDue : 0)}
                    strong
                    late={late}
                  />
                </>
              )}
            </dl>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
