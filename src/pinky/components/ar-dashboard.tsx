/**
 * The B2B Credit & Accounts-Receivable dashboard.
 *
 * Every figure here is derived by `lib/credit.ts` from the invoice list — none
 * of it is stored. That matters more than it sounds: a cached "balance" field
 * drifts the moment a payment is recorded anywhere else, and an AR dashboard
 * that disagrees with the ledger is worse than no dashboard, because people act
 * on it.
 *
 * Layout: cards stack on a phone, go two-up on a tablet, and the ledger becomes
 * a real table only from `lg`. Below that it renders as a list of cards — a
 * seven-column financial table on a 375px screen is a horizontal-scroll trap
 * where the customer name scrolls away from the number it belongs to.
 */
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  Bell,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Search,
  ShieldAlert,
  ShieldOff,
  Wallet,
} from 'lucide-react';

import { cn } from '@/app/components/ui/utils';
import { Badge, Card, Heading, PinkButton, SERIF, inputClass, ks } from '@/pinky/components/ui';
import {
  AGING_BUCKETS,
  AUTO_HOLD_OVERDUE_DAYS,
  CREDIT_TERM_DAYS,
  PRE_DUE_ALERT_DAYS,
  applyPayment,
  summariseLedger,
  toIsoDay,
  toLakhs,
  type AccountStatus,
  type AccountSummary,
  type AgingBucket,
  type CreditCustomer,
} from '@/pinky/lib/credit';
import { INITIAL_COLLECTIONS, INITIAL_CREDIT_CUSTOMERS } from '@/pinky/data/seed';

/* ── Vocabulary ────────────────────────────────────────────────────────────── */

const BUCKET_LABEL: Record<AgingBucket, string> = {
  current: '< 14 Days',
  days15to30: '15–30 Days',
  over30: '30+ Days',
};

const BUCKET_TONE = {
  current: 'emerald',
  days15to30: 'amber',
  over30: 'rose',
} as const;

const STATUS_LABEL: Record<AccountStatus, string> = {
  active: 'Active',
  'due-soon': 'Due soon',
  overdue: 'Overdue',
  hold: 'On hold',
};

const STATUS_TONE = {
  active: 'blue',
  'due-soon': 'amber',
  overdue: 'amber',
  hold: 'rose',
} as const;

const HOLD_EXPLANATION = {
  manual: 'blocked by the office',
  'over-limit': 'over credit limit',
  overdue: `more than ${AUTO_HOLD_OVERDUE_DAYS} days past due`,
} as const;

/* ── Stat tile ─────────────────────────────────────────────────────────────── */

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'pink',
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  sub?: string;
  tone?: 'pink' | 'emerald' | 'amber' | 'rose';
}) {
  const ring = {
    pink: 'bg-pink-100 text-[#ff2a85]',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
  }[tone];

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-2xl', ring)}>
          <Icon size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[#8c7a8b]">
            {label}
          </p>
          <p
            className="mt-0.5 truncate text-lg font-bold tabular-nums text-[#2d1f2d]"
            style={{ fontFamily: SERIF }}
          >
            {value}
          </p>
          {sub ? <p className="text-[0.68rem] text-[#8c7a8b]">{sub}</p> : null}
        </div>
      </div>
    </Card>
  );
}

/* ── Aging visualiser ──────────────────────────────────────────────────────── */

function AgingReport({ aging, total }: { aging: Record<AgingBucket, number>; total: number }) {
  return (
    <Card className="p-5">
      <Heading as="h3" className="text-base">
        Aging Report
      </Heading>
      <p className="mt-0.5 text-[0.7rem] text-[#8c7a8b]">
        Measured from the invoice date, not the due date.
      </p>

      {/* Proportional bar: the shape of the debt in one glance, before any
          numbers are read. */}
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
        {AGING_BUCKETS.map((bucket) => {
          const share = total === 0 ? 0 : (aging[bucket] / total) * 100;
          if (share === 0) return null;

          return (
            <div
              key={bucket}
              style={{ width: `${share}%` }}
              className={cn(
                bucket === 'current' && 'bg-emerald-400',
                bucket === 'days15to30' && 'bg-amber-400',
                bucket === 'over30' && 'bg-rose-500',
              )}
              title={`${BUCKET_LABEL[bucket]}: ${ks(aging[bucket])}`}
            />
          );
        })}
      </div>

      <dl className="mt-4 space-y-2">
        {AGING_BUCKETS.map((bucket) => (
          <div key={bucket} className="flex items-center justify-between gap-3">
            <dt>
              <Badge tone={BUCKET_TONE[bucket]}>{BUCKET_LABEL[bucket]}</Badge>
            </dt>
            <dd className="text-sm font-bold tabular-nums text-[#2d1f2d]">
              {ks(aging[bucket])}
              <span className="ml-2 text-[0.68rem] font-normal text-[#8c7a8b]">
                {total === 0 ? '0%' : `${Math.round((aging[bucket] / total) * 100)}%`}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/* ── Account row ───────────────────────────────────────────────────────────── */

function holdSummary(account: AccountSummary): string {
  return account.holdReasons.map((reason) => HOLD_EXPLANATION[reason]).join(' · ');
}

function AccountCard({
  account,
  onRemind,
  onCollect,
}: {
  account: AccountSummary;
  onRemind: () => void;
  onCollect: () => void;
}) {
  const { customer } = account;

  return (
    <Card className="space-y-3 p-4 lg:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#2d1f2d]">{customer.name}</p>
          <p className="truncate text-[0.7rem] text-[#8c7a8b]" dir="ltr">
            {customer.phone}
          </p>
        </div>
        <Badge tone={STATUS_TONE[account.status]}>{STATUS_LABEL[account.status]}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[0.65rem] uppercase tracking-wide text-[#8c7a8b]">Balance</p>
          <p
            className={cn(
              'font-bold tabular-nums',
              account.overLimit ? 'text-rose-600' : 'text-[#2d1f2d]',
            )}
          >
            {ks(account.balanceKyat)}
          </p>
        </div>
        <div>
          <p className="text-[0.65rem] uppercase tracking-wide text-[#8c7a8b]">Limit</p>
          <p className="font-bold tabular-nums text-[#2d1f2d]">
            {toLakhs(customer.creditLimitKyat)} L
          </p>
        </div>
        <div>
          <p className="text-[0.65rem] uppercase tracking-wide text-[#8c7a8b]">Next due</p>
          <p className="font-medium text-[#2d1f2d]">{account.nextDueOn ?? '—'}</p>
        </div>
        <div>
          <p className="text-[0.65rem] uppercase tracking-wide text-[#8c7a8b]">Aging</p>
          <p className="font-medium text-[#2d1f2d]">
            {account.worstOverdueDays > 0 ? `${account.worstOverdueDays}d overdue` : 'Within terms'}
          </p>
        </div>
      </div>

      {account.status === 'hold' ? (
        <p className="flex items-start gap-1.5 rounded-xl bg-rose-50 p-2.5 text-[0.7rem] font-medium text-rose-700">
          <ShieldOff size={13} className="mt-0.5 shrink-0" />
          Auto-hold — {holdSummary(account)}
        </p>
      ) : null}

      <div className="flex gap-2">
        <PinkButton variant="soft" className="flex-1 text-xs" onClick={onRemind}>
          <Bell size={14} /> Remind
        </PinkButton>
        <PinkButton variant="outline" className="flex-1 text-xs" onClick={onCollect}>
          <Banknote size={14} /> Collect
        </PinkButton>
      </div>
    </Card>
  );
}

/* ── Collect dialog ────────────────────────────────────────────────────────── */

function CollectDialog({
  account,
  onClose,
  onSubmit,
}: {
  account: AccountSummary;
  onClose: () => void;
  onSubmit: (amountKyat: number) => void;
}) {
  const [amount, setAmount] = useState(String(account.balanceKyat));
  const parsed = Number(amount.replace(/[^\d]/g, '')) || 0;
  const partial = parsed > 0 && parsed < account.balanceKyat;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Record payment for ${account.customer.name}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <Heading as="h3" className="text-lg">
          Record payment
        </Heading>
        <p className="mt-0.5 text-xs text-[#8c7a8b]">
          {account.customer.name} · outstanding {ks(account.balanceKyat)}
        </p>

        <label className="mt-4 block space-y-1.5">
          <span className="block text-xs font-semibold text-[#2d1f2d]">Amount received (Ks)</span>
          <input
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ''))}
            className={inputClass}
            autoFocus
          />
        </label>

        {/* Partial payments are normal here, so this explains rather than warns. */}
        {partial ? (
          <p className="mt-2 rounded-xl bg-amber-50 p-2.5 text-[0.7rem] leading-relaxed text-amber-800">
            Partial payment. {ks(account.balanceKyat - parsed)} stays outstanding and keeps ageing
            from its original invoice date.
          </p>
        ) : null}

        <div className="mt-5 flex gap-2">
          <PinkButton variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </PinkButton>
          <PinkButton
            className="flex-1"
            disabled={parsed <= 0}
            onClick={() => {
              onSubmit(parsed);
              onClose();
            }}
          >
            Apply payment
          </PinkButton>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard ─────────────────────────────────────────────────────────────── */

export function ArDashboard() {
  const today = toIsoDay(new Date());

  const [customers, setCustomers] = useState<CreditCustomer[]>(INITIAL_CREDIT_CUSTOMERS);
  const [collections, setCollections] = useState(INITIAL_COLLECTIONS);
  const [query, setQuery] = useState('');
  const [collecting, setCollecting] = useState<AccountSummary | null>(null);
  const [reminders, setReminders] = useState<string[]>([]);

  const ledger = useMemo(() => summariseLedger(customers, today), [customers, today]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ledger.accounts;
    return ledger.accounts.filter((account) =>
      account.customer.name.toLowerCase().includes(needle),
    );
  }, [ledger.accounts, query]);

  const recordPayment = (account: AccountSummary, amountKyat: number) => {
    const result = applyPayment(account.customer, amountKyat);

    setCustomers((current) =>
      current.map((entry) => (entry.id === account.customer.id ? result.customer : entry)),
    );

    setCollections((current) => [
      {
        id: `COL-${Math.floor(Math.random() * 900 + 100)}`,
        date: today,
        customerId: account.customer.id,
        amountKyat: result.appliedKyat,
        method: 'kpay' as const,
        collector: 'Front desk',
        // New receipts start unreconciled — matching them against the bank
        // statement is the whole job the log exists to track.
        reconciled: false,
        reference: `KP-${Math.floor(Math.random() * 90000 + 10000)}`,
      },
      ...current,
    ]);
  };

  const unreconciled = collections.filter((entry) => !entry.reconciled);

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Card className="flex flex-col items-start justify-between gap-4 p-5 md:flex-row md:items-center md:p-6">
        <div>
          <Heading as="h1" className="text-2xl">
            B2B Credit &amp; AR Control
          </Heading>
          <p className="mt-1 text-xs text-[#8c7a8b]">
            {CREDIT_TERM_DAYS}-day terms · auto-hold at {AUTO_HOLD_OVERDUE_DAYS} days overdue ·
            reminders {PRE_DUE_ALERT_DAYS} days before due
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone="emerald">
            <DollarSign size={12} /> Total AR {ks(ledger.totalArKyat)}
          </Badge>
          {ledger.onHold > 0 ? (
            <Badge tone="rose">
              <AlertTriangle size={12} /> {ledger.onHold} on hold
            </Badge>
          ) : null}
          {ledger.needingReminder > 0 ? (
            <Badge tone="amber">
              <Bell size={12} /> {ledger.needingReminder} due soon
            </Badge>
          ) : null}
        </div>
      </Card>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Wallet}
          label="Total receivable"
          value={ks(ledger.totalArKyat)}
          sub={`${toLakhs(ledger.totalArKyat)} lakhs across ${ledger.accounts.length} accounts`}
        />
        <Stat
          icon={Clock}
          label="Overdue accounts"
          value={String(ledger.overdue)}
          sub={ks(ledger.aging.days15to30 + ledger.aging.over30)}
          tone={ledger.overdue > 0 ? 'amber' : 'emerald'}
        />
        <Stat
          icon={ShieldAlert}
          label="On hold"
          value={String(ledger.onHold)}
          sub="Blocked from new credit sales"
          tone={ledger.onHold > 0 ? 'rose' : 'emerald'}
        />
        <Stat
          icon={FileText}
          label="Unreconciled"
          value={String(unreconciled.length)}
          sub={ks(unreconciled.reduce((sum, entry) => sum + entry.amountKyat, 0))}
          tone={unreconciled.length > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* ── Rules + aging ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-7">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                icon: Clock,
                title: 'Fixed terms & limits',
                body: `${CREDIT_TERM_DAYS}-day cycle. New credit sales blocked automatically once the limit is reached.`,
              },
              {
                icon: Bell,
                title: 'Automated alerts',
                body: `Pre-due reminders via Viber/SMS ${PRE_DUE_ALERT_DAYS} days before the due date.`,
              },
              {
                icon: ShieldAlert,
                title: 'Collection & hold',
                body: `Auto-hold past ${AUTO_HOLD_OVERDUE_DAYS} days overdue. Partial payments tracked to the oldest invoice.`,
              },
            ].map((rule) => (
              <Card key={rule.title} className="space-y-2 rounded-2xl p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-[#ff2a85]">
                  <rule.icon size={17} /> {rule.title}
                </p>
                <p className="text-xs leading-relaxed text-[#8c7a8b]">{rule.body}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <AgingReport aging={ledger.aging} total={ledger.totalArKyat} />
        </div>
      </div>

      {/* ── Ledger ─────────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Heading as="h3" className="text-base">
            Customer Aging &amp; Credit Ledger
          </Heading>

          <div className="relative sm:w-64">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7a8b]"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a customer…"
              aria-label="Search customers"
              className={cn(inputClass, 'pl-9 text-xs [&::-webkit-search-cancel-button]:hidden')}
            />
          </div>
        </div>

        {/* Cards below `lg` — see the note at the top of this file. */}
        <div className="space-y-3 p-4 lg:hidden">
          {visible.map((account) => (
            <AccountCard
              key={account.customer.id}
              account={account}
              onRemind={() => setReminders((r) => [...r, account.customer.id])}
              onCollect={() => setCollecting(account)}
            />
          ))}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 font-semibold text-[#8c7a8b]">
              <tr>
                <th scope="col" className="p-4">Customer</th>
                <th scope="col" className="p-4">Credit limit</th>
                <th scope="col" className="p-4">Balance</th>
                <th scope="col" className="p-4">Available</th>
                <th scope="col" className="p-4">Next due</th>
                <th scope="col" className="p-4">Aging</th>
                <th scope="col" className="p-4">Status</th>
                <th scope="col" className="p-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {visible.map((account) => {
                const { customer } = account;
                const worstBucket: AgingBucket =
                  account.aging.over30 > 0
                    ? 'over30'
                    : account.aging.days15to30 > 0
                      ? 'days15to30'
                      : 'current';

                return (
                  <tr key={customer.id} className="hover:bg-pink-50/30">
                    <td className="p-4">
                      <p className="font-bold text-[#2d1f2d]">{customer.name}</p>
                      <p className="text-[0.7rem] text-[#8c7a8b]" dir="ltr">
                        {customer.phone}
                      </p>
                    </td>

                    <td className="p-4 font-medium tabular-nums text-[#2d1f2d]">
                      {toLakhs(customer.creditLimitKyat)} L
                    </td>

                    <td
                      className={cn(
                        'p-4 font-bold tabular-nums',
                        account.overLimit ? 'text-rose-600' : 'text-[#2d1f2d]',
                      )}
                    >
                      {ks(account.balanceKyat)}
                    </td>

                    <td
                      className={cn(
                        'p-4 font-medium tabular-nums',
                        account.availableKyat < 0 ? 'text-rose-600' : 'text-emerald-700',
                      )}
                    >
                      {ks(account.availableKyat)}
                    </td>

                    <td className="p-4 text-[#8c7a8b]">
                      {account.nextDueOn ?? '—'}
                      {account.daysUntilDue !== null && account.daysUntilDue >= 0 ? (
                        <span className="block text-[0.65rem]">in {account.daysUntilDue}d</span>
                      ) : account.worstOverdueDays > 0 ? (
                        <span className="block text-[0.65rem] font-semibold text-rose-600">
                          {account.worstOverdueDays}d late
                        </span>
                      ) : null}
                    </td>

                    <td className="p-4">
                      <Badge tone={BUCKET_TONE[worstBucket]}>{BUCKET_LABEL[worstBucket]}</Badge>
                    </td>

                    <td className="p-4">
                      <Badge tone={STATUS_TONE[account.status]}>
                        {STATUS_LABEL[account.status]}
                      </Badge>
                      {account.status === 'hold' ? (
                        <span className="mt-1 block text-[0.62rem] text-rose-600">
                          {holdSummary(account)}
                        </span>
                      ) : null}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setReminders((r) => [...r, customer.id])}
                          className="rounded-lg px-2 py-1 font-semibold text-[#ff2a85] hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]"
                        >
                          {reminders.includes(customer.id) ? 'Sent ✓' : 'Remind'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCollecting(account)}
                          className="rounded-lg px-2 py-1 font-semibold text-[#2d1f2d] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]"
                        >
                          Collect
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {visible.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#8c7a8b]">No customer matches that search.</p>
        ) : null}
      </Card>

      {/* ── Collector log ──────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <Heading as="h3" className="text-base">
            Collector Log &amp; Bank Reconciliation
          </Heading>
          <p className="mt-0.5 text-[0.7rem] text-[#8c7a8b]">
            Receipts matched against the bank statement. Unmatched entries are money collected but
            not yet banked.
          </p>
        </div>

        <ul className="divide-y divide-slate-100">
          {collections.map((entry) => {
            const customer = customers.find((c) => c.id === entry.customerId);

            return (
              <li key={entry.id} className="flex items-center gap-3 p-4">
                <span
                  className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-full',
                    entry.reconciled
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700',
                  )}
                >
                  {entry.reconciled ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#2d1f2d]">
                    {customer?.name ?? entry.customerId}
                  </p>
                  <p className="truncate text-[0.68rem] text-[#8c7a8b]" dir="ltr">
                    {entry.date} · {entry.collector} · {entry.method.toUpperCase()} ·{' '}
                    {entry.reference}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-[#2d1f2d]">
                    {ks(entry.amountKyat)}
                  </p>
                  {!entry.reconciled ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCollections((current) =>
                          current.map((row) =>
                            row.id === entry.id ? { ...row, reconciled: true } : row,
                          ),
                        )
                      }
                      className="text-[0.65rem] font-semibold text-[#ff2a85] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]"
                    >
                      Mark reconciled
                    </button>
                  ) : (
                    <p className="text-[0.65rem] text-emerald-600">Reconciled</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {collecting ? (
        <CollectDialog
          account={collecting}
          onClose={() => setCollecting(null)}
          onSubmit={(amount) => recordPayment(collecting, amount)}
        />
      ) : null}
    </div>
  );
}
