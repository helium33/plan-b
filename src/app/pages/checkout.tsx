/**
 * Checkout: promo code, points, contact details, and the Telegram hand-off.
 *
 * ── Nothing is charged here ────────────────────────────────────────────────
 * The order leaves as a Telegram message the customer sends from their own
 * account, and a person confirms it. So this page's job is to get the numbers
 * right and be honest that pressing the button starts a conversation rather than
 * completing a purchase — the copy says so, because "Buy now" would be a lie.
 *
 * ── Order of the discounts ─────────────────────────────────────────────────
 * Promo first, then points against what remains. `computeTotals` owns that and is
 * unit-tested; this page only displays it. The one rule enforced visually is that
 * every discount line is shown, so a customer can see why the total is what it is.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BadgePercent,
  Check,
  ClipboardCopy,
  Loader2,
  Send,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { TextField } from '@/app/components/auth/fields';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { cn } from '@/app/components/ui/utils';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { useCartStore } from '@/app/stores/cart-store';
import { formatKyat, formatNumber } from '@/lib/format';
import { formatPhone } from '@/lib/phone';
import {
  DELIVERY_KYAT,
  type PromoResult,
  canRedeemPoints,
  computeTotals,
  maxUsablePoints,
  resolvePromo,
} from '@/lib/promo';
import {
  buildTelegramUrl,
  copyOrderMessage,
  formatOrderMessage,
  type OrderContact,
} from '@/lib/telegram';

export function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useDocumentTitle(t('pages.checkout.title'));

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const { member, points, user } = useAuth();

  const subtotalKyat = useMemo(
    () => items.reduce((sum, item) => sum + item.lineTotalKyat, 0),
    [items],
  );

  /* ── Promo ─────────────────────────────────────────────────────────────── */

  const [promoDraft, setPromoDraft] = useState('');
  const [promo, setPromo] = useState<PromoResult | null>(null);

  // Re-validate whenever the subtotal changes: a code that met its minimum spend
  // must stop applying if the customer removes a frame.
  useEffect(() => {
    if (!promo?.ok) return;
    const revalidated = resolvePromo(promo.promo.code, subtotalKyat);
    if (!revalidated.ok) setPromo(revalidated);
  }, [subtotalKyat, promo]);

  /* ── Points ────────────────────────────────────────────────────────────── */

  const [usePoints, setUsePoints] = useState(false);
  const afterPromo = subtotalKyat - (promo?.ok ? promo.discountKyat : 0);
  const redeemable = maxUsablePoints(points, afterPromo);

  /* ── Fulfilment and contact ────────────────────────────────────────────── */

  const [fulfilment, setFulfilment] = useState<'delivery' | 'collect'>('collect');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const saved = member?.profile.name ?? member?.displayName ?? user?.displayName;
    if (saved && !name) setName(saved);
  }, [member, user, name]);

  const totals = useMemo(
    () =>
      computeTotals({
        subtotalKyat,
        promo,
        pointsBalance: points,
        wantsPoints: usePoints ? redeemable : 0,
        includeDelivery: fulfilment === 'delivery',
      }),
    [subtotalKyat, promo, points, usePoints, redeemable, fulfilment],
  );

  /* ── Telegram message ──────────────────────────────────────────────────── */

  const contact: OrderContact = {
    name: name.trim() || t('reviews.anonymous'),
    phone: member?.phone ?? '',
    note,
    fulfilment,
    address,
  };

  const message = useMemo(
    () =>
      formatOrderMessage(
        {
          items,
          totals,
          promoCode: promo?.ok ? promo.promo.code : null,
          contact,
          posCustomerNumber: member?.pos.customerNumber ?? null,
        },
        {
          heading: t('checkout.messageHeading'),
          lensTypeFor: (item) => t(`lens.types.${item.lens.lensType}`),
          coatingsFor: (item) => item.lens.coatings.map((c) => t(`lens.coatings.${c}`)),
          currency: t('common.currency'),
        },
      ),
    // `contact` is rebuilt each render but is a plain projection of the fields
    // below, so depending on those is equivalent and avoids an identity loop.
    [items, totals, promo, member, name, address, note, fulfilment, t],
  );

  const link = useMemo(() => buildTelegramUrl(message), [message]);

  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  /* ── Empty bag ─────────────────────────────────────────────────────────── */

  if (items.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground">
          <ShoppingBag className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          {t('checkout.emptyTitle')}
        </h1>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t('checkout.emptyBody')}
        </p>
        <Button asChild className="mt-5">
          <Link to={ROUTES.shop}>{t('actions.shopNow')}</Link>
        </Button>
      </div>
    );
  }

  const canSend = Boolean(member?.phone) && (fulfilment === 'collect' || address.trim().length > 0);

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {t('pages.checkout.title')}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {t('checkout.intro')}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        {/* ── Left: items and details ──────────────────────────────────── */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card">
            <h2 className="border-b border-border px-5 py-4 text-sm font-semibold text-foreground">
              {t('checkout.yourOrder', { count: items.length })}
            </h2>

            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.lineId} className="flex gap-4 p-5">
                  <span className="h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {item.image ? (
                      <img src={item.image} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                    ) : null}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{item.frameName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                      {item.brand} {item.frameCode} · {item.colorName} ({item.cNumber})
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(`lens.types.${item.lens.lensType}`)}
                      {item.lens.deferToStore ? ` · ${t('checkout.rxInStore')}` : ''}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium text-foreground">
                      {formatKyat(item.lineTotalKyat, t('common.currency'))}
                    </p>
                    <button
                      type="button"
                      onClick={() => useCartStore.getState().remove(item.lineId)}
                      className="mt-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
                    >
                      {t('checkout.remove')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Fulfilment */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">{t('checkout.fulfilmentTitle')}</h2>

            <div role="radiogroup" aria-label={t('checkout.fulfilmentTitle')} className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {(['collect', 'delivery'] as const).map((option) => {
                const Icon = option === 'collect' ? Store : Truck;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={fulfilment === option}
                    onClick={() => setFulfilment(option)}
                    className={cn(
                      'flex gap-3 rounded-xl border p-4 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      fulfilment === option
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-brand-300 dark:hover:border-brand-700',
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.9} aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        {t(`checkout.fulfilment.${option}.title`)}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                        {t(`checkout.fulfilment.${option}.body`, { fee: formatKyat(DELIVERY_KYAT, t('common.currency')) })}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 space-y-4">
              <TextField
                label={t('checkout.nameLabel')}
                value={name}
                onChange={setName}
                autoComplete="name"
                required
              />

              {/* Phone comes from the verified member record and is not editable
                  here — it is the identifier the shop matches to the POS. */}
              <div className="space-y-1.5">
                <span className="block text-sm font-medium text-foreground">
                  {t('auth.phoneLabel')}
                </span>
                <p className="text-sm text-muted-foreground" dir="ltr">
                  {member?.phone ? formatPhone(member.phone) : '—'}
                </p>
                {!member?.phone ? (
                  <p className="text-xs text-destructive">{t('checkout.phoneRequired')}</p>
                ) : null}
              </div>

              {fulfilment === 'delivery' ? (
                <div className="space-y-1.5">
                  <label htmlFor="checkout-address" className="block text-sm font-medium text-foreground">
                    {t('checkout.addressLabel')}
                  </label>
                  <textarea
                    id="checkout-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    rows={3}
                    maxLength={400}
                    placeholder={t('checkout.addressPlaceholder')}
                    className="w-full resize-y rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label htmlFor="checkout-note" className="block text-sm font-medium text-foreground">
                  {t('checkout.noteLabel')}
                </label>
                <textarea
                  id="checkout-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  maxLength={400}
                  placeholder={t('checkout.notePlaceholder')}
                  className="w-full resize-y rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </section>
        </div>

        {/* ── Right: summary ───────────────────────────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">{t('checkout.summary')}</h2>

            {/* Promo */}
            <div className="mt-4">
              <label htmlFor="promo-code" className="block text-xs font-medium text-foreground">
                {t('promo.label')}
              </label>

              <div className="mt-1.5 flex gap-2">
                <Input
                  id="promo-code"
                  value={promoDraft}
                  onChange={(event) => setPromoDraft(event.target.value.toUpperCase())}
                  placeholder={t('promo.placeholder')}
                  disabled={promo?.ok}
                  className="h-9 flex-1 text-sm uppercase"
                  dir="ltr"
                />

                {promo?.ok ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => {
                      setPromo(null);
                      setPromoDraft('');
                    }}
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                    {t('actions.clear')}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    className="h-9"
                    disabled={!promoDraft.trim()}
                    onClick={() => setPromo(resolvePromo(promoDraft, subtotalKyat))}
                  >
                    {t('actions.apply')}
                  </Button>
                )}
              </div>

              {promo?.ok ? (
                <p role="status" className="mt-2 flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                  <Check className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={3} aria-hidden="true" />
                  {t(promo.promo.descriptionKey as never)}
                  {promo.cappedByMax ? ` ${t('promo.capped')}` : ''}
                </p>
              ) : null}

              {promo && !promo.ok ? (
                <p role="alert" className="mt-2 text-xs text-destructive">
                  {promo.reason === 'below-minimum'
                    ? t('promo.belowMinimum', {
                        amount: formatKyat(promo.minSpendKyat ?? 0, t('common.currency')),
                      })
                    : t(`promo.errors.${promo.reason}`)}
                </p>
              ) : null}
            </div>

            {/* Points */}
            {canRedeemPoints(points) && redeemable > 0 ? (
              <label className="mt-4 flex cursor-pointer gap-2.5 rounded-xl border border-gold-500/30 bg-gold-500/5 p-3.5">
                <input
                  type="checkbox"
                  checked={usePoints}
                  onChange={(event) => setUsePoints(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Sparkles className="h-3 w-3 text-gold-500" strokeWidth={2.2} aria-hidden="true" />
                    {t('checkout.usePoints', { points: formatNumber(redeemable) })}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t('checkout.pointsWorth', {
                      value: formatKyat(redeemable * 50, t('common.currency')),
                      balance: formatNumber(points),
                    })}
                  </span>
                </span>
              </label>
            ) : null}

            {/* Lines */}
            <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <Line label={t('checkout.subtotal')} value={formatKyat(totals.subtotalKyat, t('common.currency'))} />

              {totals.promoDiscountKyat > 0 ? (
                <Line
                  label={t('checkout.promoLine', { code: promo?.ok ? promo.promo.code : '' })}
                  value={`−${formatKyat(totals.promoDiscountKyat, t('common.currency'))}`}
                  tone="discount"
                />
              ) : null}

              {totals.pointsDiscountKyat > 0 ? (
                <Line
                  label={t('checkout.pointsLine', { points: formatNumber(totals.pointsSpent) })}
                  value={`−${formatKyat(totals.pointsDiscountKyat, t('common.currency'))}`}
                  tone="discount"
                />
              ) : null}

              <Line
                label={t('checkout.delivery')}
                value={
                  totals.deliveryKyat > 0
                    ? formatKyat(totals.deliveryKyat, t('common.currency'))
                    : t('checkout.free')
                }
              />

              <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2.5">
                <dt className="text-sm font-semibold text-foreground">{t('lens.total')}</dt>
                <dd className="text-lg font-semibold text-foreground" dir="ltr">
                  {formatKyat(totals.totalKyat, t('common.currency'))}
                </dd>
              </div>
            </dl>
          </section>

          {/* Send */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={!canSend || sending}
              onClick={() => {
                if (!link.ok) return;
                setSending(true);
                // A new tab, not a redirect: if Telegram is not installed the
                // customer keeps this page and their order rather than landing on
                // a dead end with the bag already cleared.
                window.open(link.url, '_blank', 'noopener,noreferrer');
                setSending(false);
              }}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
              )}
              {t('checkout.sendViaTelegram')}
            </Button>

            {/* Said plainly. "Buy now" would be untrue — this opens a chat. */}
            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
              {t('checkout.telegramExplainer')}
            </p>

            {!canSend ? (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                {!member?.phone ? t('checkout.phoneRequired') : t('checkout.addressRequired')}
              </p>
            ) : null}

            {/* Fallback when the order is too long to fit in a URL. */}
            {!link.ok ? (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                <p className="text-xs leading-relaxed text-foreground">{t('checkout.tooLong')}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2.5"
                  onClick={async () => {
                    const done = await copyOrderMessage(message);
                    setCopied(done);
                  }}
                >
                  <ClipboardCopy className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
                  {copied ? t('checkout.copied') : t('checkout.copyOrder')}
                </Button>
              </div>
            ) : null}

            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-medium text-primary">
                {t('checkout.previewMessage')}
              </summary>
              {/* Shown verbatim, because the customer is about to send it under
                  their own name and should be able to read it first. */}
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 text-[0.7rem] leading-relaxed text-muted-foreground">
                {message}
              </pre>
            </details>
          </section>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              clearCart();
              navigate(ROUTES.shop);
            }}
          >
            {t('checkout.clearBag')}
          </Button>
        </aside>
      </div>
    </div>
  );
}

function Line({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'discount';
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn('tabular-nums', tone === 'discount' ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground')}
        dir="ltr"
      >
        {value}
      </dd>
    </div>
  );
}
