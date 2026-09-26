/**
 * Choosing a credit customer, and everything about their standing at a glance.
 *
 * The directory is small — this trade has dozens of wholesale relationships,
 * not thousands — so a plain `<select>` plus an inline "new shop" form is
 * enough; a search box or a separate management page would be machinery this
 * list will never need.
 */
import { useState } from 'react';
import { Loader2, Plus, RotateCcw, ShieldOff, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import {
  deriveStanding,
  toIsoDay,
  toLakhs,
  type CreditShop,
  type HoldReason,
} from '@/lib/credit';
import { createShop, extendCycle, setManualHold } from '@/lib/firestore/credit';
import { formatKyat } from '@/lib/format';

/**
 * Typed as the literal key union, not `string` — a lookup typed loosely would
 * let a typo'd key compile and fail silently at render, exactly the bug the
 * typed `t()` exists to catch everywhere else in this app.
 */
const HOLD_LABEL_KEY: Record<HoldReason, 'credit.holdManual' | 'credit.holdOverdue'> = {
  manual: 'credit.holdManual',
  overdue: 'credit.holdOverdue',
};

function NewShopForm({ onDone }: { onDone: (id: string) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [limit, setLimit] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && Number(limit) > 0;

  const save = async () => {
    setSaving(true);
    try {
      const id = await createShop({ name, phone, creditLimitKyat: Number(limit) });
      onDone(id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 space-y-2.5 rounded-xl border border-dashed border-border bg-muted/30 p-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('credit.shopNamePlaceholder')}
          className="h-11 rounded-lg border border-border bg-background px-3 text-sm sm:col-span-1"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('credit.shopPhonePlaceholder')}
          dir="ltr"
          className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
        />
        <input
          value={limit}
          onChange={(e) => setLimit(e.target.value.replace(/[^\d]/g, ''))}
          placeholder={t('credit.creditLimitPlaceholder')}
          inputMode="numeric"
          dir="ltr"
          className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
        />
      </div>
      <Button type="button" size="sm" disabled={!canSave || saving} onClick={() => void save()}>
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        <span className="font-myanmar">{t('credit.addShopAction')}</span>
      </Button>
    </div>
  );
}

export function CreditShopPicker({
  shops,
  loading,
  selectedId,
  onSelect,
  onCreated,
}: {
  shops: CreditShop[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreated: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [showNewForm, setShowNewForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const shop = shops.find((s) => s.id === selectedId) ?? null;
  const standing = shop ? deriveStanding(shop, toIsoDay(new Date())) : null;

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          <span className="font-myanmar">{t('credit.shopSection')}</span>
        </h2>
        <button
          type="button"
          onClick={() => setShowNewForm((v) => !v)}
          className="inline-flex min-h-9 items-center gap-1 rounded-full px-2.5 text-[0.75rem] font-medium text-primary hover:bg-primary/10"
        >
          {showNewForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          <span className="font-myanmar">{t('credit.addShopToggle')}</span>
        </button>
      </div>

      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading')}
        </p>
      ) : (
        <select
          value={selectedId ?? ''}
          onChange={(e) => onSelect(e.target.value)}
          className="mt-3 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground"
        >
          <option value="" disabled>
            {t('credit.chooseShop')}
          </option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      {showNewForm ? (
        <NewShopForm
          onDone={(id) => {
            onCreated(id);
            setShowNewForm(false);
          }}
        />
      ) : null}

      {shop && standing ? (
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground">
              {t('credit.creditLimit')}
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
              {toLakhs(shop.creditLimitKyat)} L
            </p>
          </div>

          <div className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-3">
            <p className="text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground">
              <span className="font-myanmar">{t('credit.previousBalance')}</span>
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
              {formatKyat(shop.previousBalanceKyat)}
            </p>
          </div>

          <div
            className={cn(
              'rounded-xl border p-3',
              standing.status === 'hold'
                ? 'border-destructive/30 bg-destructive/5'
                : standing.status === 'due-soon'
                  ? 'border-orange-500/30 bg-orange-500/5'
                  : 'border-emerald-600/30 bg-emerald-600/5',
            )}
          >
            <p className="text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground">
              {t('credit.statusLabel')}
            </p>
            <p
              className={cn(
                'mt-0.5 text-sm font-bold',
                standing.status === 'hold'
                  ? 'text-destructive'
                  : standing.status === 'due-soon'
                    ? 'text-orange-700 dark:text-orange-400'
                    : 'text-emerald-700 dark:text-emerald-400',
              )}
            >
              <span className="font-myanmar">{t(`credit.status.${standing.status}`)}</span>
            </p>
            {shop.dueDateIso ? (
              <p className="mt-0.5 text-[0.68rem] text-muted-foreground" dir="ltr">
                {shop.dueDateIso}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {shop && standing && standing.status === 'hold' ? (
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <p className="flex items-center gap-1.5 text-[0.78rem] font-medium text-destructive">
            <ShieldOff className="h-3.5 w-3.5 shrink-0" />
            {standing.holdReasons.map((r) => t(HOLD_LABEL_KEY[r])).join(' · ')}
          </p>

          {standing.holdReasons.includes('overdue') ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void extendCycle(shop.id).finally(() => setBusy(false));
              }}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              <span className="font-myanmar">{t('credit.extendCycle')}</span>
            </Button>
          ) : null}

          {standing.holdReasons.includes('manual') ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2 ml-2"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void setManualHold(shop.id, false).finally(() => setBusy(false));
              }}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              <span className="font-myanmar">{t('credit.releaseManualHold')}</span>
            </Button>
          ) : null}
        </div>
      ) : shop && !shop.manualHold ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void setManualHold(shop.id, true).finally(() => setBusy(false));
          }}
          className="mt-3 text-[0.72rem] font-medium text-muted-foreground hover:text-destructive"
        >
          <span className="font-myanmar">{t('credit.placeManualHold')}</span>
        </button>
      ) : null}
    </section>
  );
}
