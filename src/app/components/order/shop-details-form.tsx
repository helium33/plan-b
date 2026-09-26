/**
 * Who the order is from, where it ships, and how it is paid.
 *
 * There is no account behind this and deliberately so: the order arrives at the
 * shop from the buyer's own Telegram or Viber account, which identifies them
 * more reliably than a password would. These fields exist so the *voucher* is
 * self-describing when it is printed, forwarded or pasted into a ledger —
 * detached from the conversation that carried it.
 *
 * Everything persists with the draft, so a returning buyer types their shop name
 * and branch addresses once ever rather than once per order.
 */
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import { useOrderStore, type ShopDetails } from '@/app/stores/order-store';
import { BANKS, PAYMENT_METHODS, needsBank, needsShopName } from '@/lib/payment';

type FieldKey = keyof ShopDetails;

const FIELDS: { key: FieldKey; autoComplete?: string; inputMode?: 'tel' }[] = [
  { key: 'shopName', autoComplete: 'organization' },
  { key: 'contactName', autoComplete: 'name' },
  { key: 'phone', autoComplete: 'tel', inputMode: 'tel' },
  { key: 'location', autoComplete: 'address-level2' },
];

const inputClass =
  'h-11 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">
        <span className="font-myanmar">{title}</span>
      </h2>
      {hint ? <p className="mt-0.5 text-[0.72rem] text-muted-foreground">{hint}</p> : null}
      {children}
    </section>
  );
}

/* ── Shop identity ─────────────────────────────────────────────────────────── */

export function ShopDetailsForm() {
  const { t } = useTranslation();
  const shop = useOrderStore((s) => s.shop);
  const setShop = useOrderStore((s) => s.setShop);

  return (
    <Section title={t('order.shopSection')} hint={t('order.shopSectionHint')}>
      <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
        {FIELDS.map(({ key, autoComplete, inputMode }) => (
          <label key={key} className="block space-y-1.5">
            <span className="block text-[0.75rem] font-medium text-foreground">
              <span className="font-myanmar">{t(`order.fields.${key}`)}</span>
            </span>
            <input
              type="text"
              value={shop[key]}
              onChange={(event) => setShop({ [key]: event.target.value })}
              placeholder={t(`order.placeholders.${key}`)}
              autoComplete={autoComplete}
              inputMode={inputMode}
              dir={inputMode === 'tel' ? 'ltr' : undefined}
              className={inputClass}
            />
          </label>
        ))}
      </div>

      <label className="mt-3 block space-y-1.5">
        <span className="block text-[0.75rem] font-medium text-foreground">
          <span className="font-myanmar">{t('order.fields.note')}</span>
        </span>
        <textarea
          value={shop.note}
          onChange={(event) => setShop({ note: event.target.value })}
          placeholder={t('order.placeholders.note')}
          rows={2}
          maxLength={300}
          className="w-full resize-y rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
    </Section>
  );
}

/* ── Branches ──────────────────────────────────────────────────────────────── */

/**
 * Saved shipping destinations.
 *
 * A buyer with shops in Yangon and Mandalay splits deliveries between them
 * constantly. Re-typing an address every order is exactly the friction that
 * sends people back to ordering by voice note, so branches are saved once and
 * picked per order.
 */
export function BranchPicker() {
  const { t } = useTranslation();

  const branches = useOrderStore((s) => s.branches);
  const shipToBranchId = useOrderStore((s) => s.shipToBranchId);
  const addBranch = useOrderStore((s) => s.addBranch);
  const updateBranch = useOrderStore((s) => s.updateBranch);
  const removeBranch = useOrderStore((s) => s.removeBranch);
  const setShipToBranch = useOrderStore((s) => s.setShipToBranch);

  return (
    <Section title={t('order.branchSection')} hint={t('order.branchSectionHint')}>
      {/*
        Radio cards rather than a `<select>`. The chosen destination is the one
        thing on this form that a mistake makes expensive — a carton on the wrong
        bus — and a collapsed dropdown shows the answer only while it is open.
      */}
      <div role="radiogroup" aria-label={t('order.branchSection')} className="mt-3 space-y-2">
        <button
          type="button"
          role="radio"
          aria-checked={shipToBranchId === null}
          onClick={() => setShipToBranch(null)}
          className={cn(
            'flex min-h-11 w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            shipToBranchId === null ? 'border-primary bg-primary/5' : 'border-border',
          )}
        >
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
          <span className="text-[0.82rem] font-medium text-foreground">
            <span className="font-myanmar">{t('order.mainShop')}</span>
          </span>
        </button>

        {branches.map((branch, index) => (
          <div
            key={branch.id}
            className={cn(
              'rounded-xl border p-3 transition-colors',
              shipToBranchId === branch.id ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                role="radio"
                aria-checked={shipToBranchId === branch.id}
                aria-label={t('order.shipHere', {
                  branch: branch.label || t('order.branchNumber', { number: index + 1 }),
                })}
                onClick={() => setShipToBranch(branch.id)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'grid h-5 w-5 place-items-center rounded-full border-2',
                    shipToBranchId === branch.id ? 'border-primary' : 'border-border',
                  )}
                >
                  {shipToBranchId === branch.id ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  ) : null}
                </span>
              </button>

              <input
                type="text"
                value={branch.label}
                onChange={(event) => updateBranch(branch.id, { label: event.target.value })}
                placeholder={t('order.branchNumber', { number: index + 1 })}
                aria-label={t('order.branchLabel')}
                className={cn(inputClass, 'flex-1')}
              />

              <button
                type="button"
                onClick={() => removeBranch(branch.id)}
                aria-label={t('order.removeBranch', { branch: branch.label })}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <input
                type="text"
                value={branch.city}
                onChange={(event) => updateBranch(branch.id, { city: event.target.value })}
                placeholder={t('order.placeholders.city')}
                aria-label={t('order.fields.location')}
                className={inputClass}
              />
              <input
                type="text"
                value={branch.address}
                onChange={(event) => updateBranch(branch.id, { address: event.target.value })}
                placeholder={t('order.placeholders.address')}
                aria-label={t('order.branchAddress')}
                className={cn(inputClass, 'sm:col-span-2')}
              />
            </div>

            <input
              type="text"
              inputMode="tel"
              dir="ltr"
              value={branch.phone}
              onChange={(event) => updateBranch(branch.id, { phone: event.target.value })}
              placeholder={t('order.placeholders.phone')}
              aria-label={t('order.fields.phone')}
              className={cn(inputClass, 'mt-2')}
            />
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" className="mt-3 min-h-11" onClick={addBranch}>
        <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        <span className="font-myanmar">{t('order.addBranch')}</span>
      </Button>
    </Section>
  );
}

/* ── Payment ───────────────────────────────────────────────────────────────── */

export function PaymentPicker() {
  const { t } = useTranslation();

  const paymentMethod = useOrderStore((s) => s.paymentMethod);
  const bank = useOrderStore((s) => s.bank);
  const shopName = useOrderStore((s) => s.shop.shopName);
  const setPaymentMethod = useOrderStore((s) => s.setPaymentMethod);
  const setBank = useOrderStore((s) => s.setBank);

  return (
    <Section title={t('order.paymentSection')} hint={t('order.paymentSectionHint')}>
      <div role="radiogroup" aria-label={t('order.paymentSection')} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method}
            type="button"
            role="radio"
            aria-checked={paymentMethod === method}
            onClick={() => setPaymentMethod(method)}
            className={cn(
              'min-h-11 rounded-xl border px-3 py-2 text-[0.82rem] font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              paymentMethod === method
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-foreground hover:border-primary/50',
            )}
          >
            <span className="font-myanmar">{t(`payment.methods.${method}`)}</span>
          </button>
        ))}
      </div>

      {/* Only asked when it means something — see `needsBank`. */}
      {needsBank(paymentMethod) ? (
        <fieldset className="mt-3">
          <legend className="mb-1.5 text-[0.75rem] font-medium text-foreground">
            <span className="font-myanmar">{t('order.chooseBank')}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {BANKS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={bank === option}
                onClick={() => setBank(bank === option ? null : option)}
                className={cn(
                  'min-h-11 rounded-full border px-5 text-[0.82rem] font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  bank === option
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground',
                )}
              >
                {option}
              </button>
            ))}
          </div>

          {bank === null ? (
            <p className="mt-1.5 text-[0.72rem] text-orange-700 dark:text-orange-400">
              {t('order.bankRequired')}
            </p>
          ) : null}
        </fieldset>
      ) : null}

      {/*
        Credit does not open a picker here — it points back at the shop-name
        field already collected above. Adding a second, Firestore-backed shop
        selector would mean this public page reading the credit ledger just to
        support one payment chip, which is exactly the boundary this feature is
        built to not cross. See the note on `needsShopName` in `lib/payment.ts`.
      */}
      {needsShopName(paymentMethod) ? (
        <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <p className="text-[0.78rem] leading-relaxed text-foreground">
            <span className="font-myanmar">{t('order.creditHint')}</span>
          </p>
          {shopName.trim() ? (
            <p className="mt-1.5 text-[0.78rem] font-semibold text-foreground">
              {t('order.fields.shopName')}: {shopName.trim()}
            </p>
          ) : (
            <p className="mt-1.5 text-[0.72rem] font-medium text-orange-700 dark:text-orange-400">
              <span className="font-myanmar">{t('order.shopNameRequiredForCredit')}</span>
            </p>
          )}
        </div>
      ) : null}
    </Section>
  );
}
