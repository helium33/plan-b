/**
 * The checkout: contact, address, delivery, payment, coupon and summary.
 *
 * ── Layout ────────────────────────────────────────────────────────────────
 * A 12-column grid from `lg` up — form in seven, summary in five and sticky, so
 * the total stays visible while the form is filled. Below `lg` they stack and
 * the summary sits last, because on a phone the total is the thing you check
 * *after* filling the form, not the thing you scroll past to reach it.
 */
import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, QrCode, Upload, X } from 'lucide-react';

import { cn } from '@/app/components/ui/utils';
import {
  Badge,
  Card,
  Field,
  Heading,
  PinkButton,
  SERIF,
  inputClass,
  inputErrorClass,
  ks,
} from '@/pinky/components/ui';
import {
  DELIVERY_FEE_KYAT,
  applyCoupon,
  computeTotals,
  isValidContact,
  requiresSlip,
  validateContact,
  type CartLine,
  type ContactDetails,
  type ContactErrors,
  type DeliveryMethod,
  type PaymentOption,
} from '@/pinky/lib/checkout';
import { OTHER_TOWNSHIP, REGIONS, townshipsFor } from '@/pinky/data/regions';

const DELIVERY_CHOICES: { id: DeliveryMethod; title: string; desc: string }[] = [
  { id: 'home', title: 'Home delivery', desc: 'We deliver to your address' },
  { id: 'pickup', title: 'Pickup in store', desc: 'Collect from our shop, free' },
  { id: 'cargate', title: 'Car gate pickup', desc: '+2,000 Ks bus counter handling' },
];

const PAYMENT_CHOICES: { id: PaymentOption; label: string }[] = [
  { id: 'kpay', label: 'KPay' },
  { id: 'wavepay', label: 'WavePay' },
  { id: 'cod', label: 'COD' },
];

const EMPTY_CONTACT: ContactDetails = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  region: '',
  township: '',
};

/* ── Slip uploader ─────────────────────────────────────────────────────────── */

/**
 * Payment-proof uploader.
 *
 * The file never leaves the browser here — it is previewed from an object URL so
 * the customer can confirm they picked the right screenshot before committing.
 * Wiring it to storage is a backend decision; showing them a thumbnail costs
 * nothing and catches the commonest mistake, which is attaching the wrong image.
 */
function SlipUploader({
  file,
  onPick,
  onClear,
}: {
  file: File | null;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  if (file && preview) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-pink-200 bg-pink-50/40 p-3">
        <img src={preview} alt="Payment slip" className="h-16 w-16 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={14} /> Slip attached
          </p>
          <p className="truncate text-[0.7rem] text-[#8c7a8b]">{file.name}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Remove payment slip"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#8c7a8b] hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const dropped = event.dataTransfer.files?.[0];
        if (dropped?.type.startsWith('image/')) onPick(dropped);
      }}
      className={cn(
        'w-full space-y-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]',
        dragging ? 'border-[#ff2a85] bg-pink-100/60' : 'border-pink-200 bg-pink-50/30',
      )}
    >
      <Upload className="mx-auto text-[#ff2a85]" size={28} />
      <p className="text-xs font-semibold text-[#2d1f2d]">
        Drop payment screenshot here or browse
      </p>
      <p className="text-[0.65rem] text-[#8c7a8b]">KPay / WavePay payment proof required</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const picked = event.target.files?.[0];
          if (picked) onPick(picked);
        }}
      />
    </button>
  );
}

/* ── Checkout ──────────────────────────────────────────────────────────────── */

export function Checkout({
  lines,
  onQty,
  onRemove,
  onPlaced,
}: {
  lines: CartLine[];
  onQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onPlaced: () => void;
}) {
  const [contact, setContact] = useState<ContactDetails>(EMPTY_CONTACT);
  const [otherTownship, setOtherTownship] = useState('');
  const [delivery, setDelivery] = useState<DeliveryMethod>('home');
  const [payment, setPayment] = useState<PaymentOption>('kpay');
  const [slip, setSlip] = useState<File | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Errors appear only after a submit attempt. Validating as someone types
  // paints the form red before they have finished the first field.
  const [submitted, setSubmitted] = useState(false);
  const [placed, setPlaced] = useState(false);

  const totals = computeTotals(lines, delivery, discount);
  const errors: ContactErrors = validateContact({
    ...contact,
    township: contact.township === OTHER_TOWNSHIP ? otherTownship : contact.township,
  });

  const slipMissing = requiresSlip(payment) && slip === null;
  const canPlace = lines.length > 0 && isValidContact(errors) && !slipMissing;

  const set = <K extends keyof ContactDetails>(key: K, value: ContactDetails[K]) =>
    setContact((current) => ({ ...current, [key]: value }));

  const redeem = () => {
    const result = applyCoupon(couponCode, totals.subtotalKyat);

    if (result.ok) {
      setDiscount(result.discountKyat);
      setCouponMessage({ ok: true, text: `${result.coupon.code} applied` });
      return;
    }

    setDiscount(0);
    setCouponMessage({
      ok: false,
      text:
        result.reason === 'unknown'
          ? 'That code is not recognised'
          : `Spend ${ks(result.minSubtotalKyat ?? 0)} to use this code`,
    });
  };

  const place = () => {
    setSubmitted(true);
    if (!canPlace) return;
    setPlaced(true);
    onPlaced();
  };

  if (placed) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <CheckCircle2 className="mx-auto text-emerald-500" size={48} strokeWidth={1.6} />
        <Heading as="h2" className="mt-4 text-2xl">
          Order placed
        </Heading>
        <p className="mt-2 text-sm text-[#8c7a8b]">
          Thank you, {contact.fullName || 'friend'}. We will confirm on Viber shortly.
        </p>
        <p className="mt-4 text-3xl font-bold text-[#ff2a85]" style={{ fontFamily: SERIF }}>
          {ks(totals.totalKyat)}
        </p>
        <PinkButton
          variant="outline"
          className="mt-6"
          onClick={() => {
            setPlaced(false);
            setSubmitted(false);
          }}
        >
          Place another order
        </PinkButton>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      {/* ── Form ───────────────────────────────────────────────────────────── */}
      <div className="space-y-5 lg:col-span-7">
        <Card className="space-y-4 p-5 md:p-6">
          <Heading as="h2" className="text-lg">
            Contact Details
          </Heading>

          <div className="space-y-3">
            <Field label="Full name" required error={submitted ? errors.fullName : undefined}>
              {({ id, describedBy }) => (
                <input
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={submitted && Boolean(errors.fullName)}
                  value={contact.fullName}
                  onChange={(event) => set('fullName', event.target.value)}
                  placeholder="Daw Su Su"
                  autoComplete="name"
                  className={cn(inputClass, submitted && errors.fullName && inputErrorClass)}
                />
              )}
            </Field>

            <Field label="Email" required error={submitted ? errors.email : undefined}>
              {({ id, describedBy }) => (
                <input
                  id={id}
                  type="email"
                  aria-describedby={describedBy}
                  aria-invalid={submitted && Boolean(errors.email)}
                  value={contact.email}
                  onChange={(event) => set('email', event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={cn(inputClass, submitted && errors.email && inputErrorClass)}
                />
              )}
            </Field>

            <Field label="Phone" required error={submitted ? errors.phone : undefined}>
              {({ id, describedBy }) => (
                <input
                  id={id}
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  aria-describedby={describedBy}
                  aria-invalid={submitted && Boolean(errors.phone)}
                  value={contact.phone}
                  onChange={(event) => set('phone', event.target.value)}
                  placeholder="09 7xx xxx xxx"
                  autoComplete="tel"
                  className={cn(inputClass, submitted && errors.phone && inputErrorClass)}
                />
              )}
            </Field>
          </div>
        </Card>

        <Card className="space-y-4 p-5 md:p-6">
          <Heading as="h2" className="text-lg">
            Delivery Address
          </Heading>

          <Field label="Address" required error={submitted ? errors.address : undefined}>
            {({ id, describedBy }) => (
              <input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={submitted && Boolean(errors.address)}
                value={contact.address}
                onChange={(event) => set('address', event.target.value)}
                placeholder="No. 12, Bogyoke Road"
                autoComplete="street-address"
                className={cn(inputClass, submitted && errors.address && inputErrorClass)}
              />
            )}
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Region / State" required error={submitted ? errors.region : undefined}>
              {({ id }) => (
                <select
                  id={id}
                  value={contact.region}
                  onChange={(event) => {
                    set('region', event.target.value);
                    // Townships are region-specific, so a stale one must not
                    // survive the switch — shipping to a township in the wrong
                    // state is a parcel on the wrong bus.
                    set('township', '');
                    setOtherTownship('');
                  }}
                  className={cn(inputClass, submitted && errors.region && inputErrorClass)}
                >
                  <option value="">Choose…</option>
                  {REGIONS.map((region) => (
                    <option key={region.name} value={region.name}>
                      {region.name} · {region.nameMy}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Township" required error={submitted ? errors.township : undefined}>
              {({ id }) => (
                <select
                  id={id}
                  value={contact.township}
                  disabled={!contact.region}
                  onChange={(event) => set('township', event.target.value)}
                  className={cn(
                    inputClass,
                    'disabled:opacity-50',
                    submitted && errors.township && inputErrorClass,
                  )}
                >
                  <option value="">{contact.region ? 'Choose…' : 'Pick a region first'}</option>
                  {townshipsFor(contact.region).map((township) => (
                    <option key={township} value={township}>
                      {township}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          {contact.township === OTHER_TOWNSHIP ? (
            <Field label="Township name" required>
              {({ id }) => (
                <input
                  id={id}
                  value={otherTownship}
                  onChange={(event) => setOtherTownship(event.target.value)}
                  placeholder="Type your township"
                  className={inputClass}
                />
              )}
            </Field>
          ) : null}
        </Card>

        <Card className="space-y-4 p-5 md:p-6">
          <Heading as="h2" className="text-lg">
            Choose Delivery Method
          </Heading>

          <div role="radiogroup" aria-label="Delivery method" className="space-y-2">
            {DELIVERY_CHOICES.map((choice) => (
              <label
                key={choice.id}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 transition-colors',
                  delivery === choice.id
                    ? 'border-[#ff2a85] bg-pink-50/60'
                    : 'border-slate-200 hover:border-pink-200',
                )}
              >
                <span>
                  <span className="block text-sm font-semibold text-[#2d1f2d]">
                    {choice.title}
                  </span>
                  <span className="block text-xs text-[#8c7a8b]">{choice.desc}</span>
                </span>

                <span className="flex shrink-0 items-center gap-3">
                  {DELIVERY_FEE_KYAT[choice.id] > 0 ? (
                    <span className="text-xs font-bold text-[#ff2a85]">
                      +{ks(DELIVERY_FEE_KYAT[choice.id])}
                    </span>
                  ) : null}
                  <input
                    type="radio"
                    name="delivery"
                    checked={delivery === choice.id}
                    onChange={() => setDelivery(choice.id)}
                    className="h-5 w-5 accent-[#ff2a85]"
                  />
                </span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-5 md:p-6">
          <Heading as="h2" className="text-lg">
            Payment Option
          </Heading>

          <div role="radiogroup" aria-label="Payment option" className="grid grid-cols-3 gap-3">
            {PAYMENT_CHOICES.map((choice) => (
              <button
                key={choice.id}
                type="button"
                role="radio"
                aria-checked={payment === choice.id}
                onClick={() => {
                  setPayment(choice.id);
                  // Switching to cash discards a slip that no longer applies,
                  // so an order cannot carry proof of a payment never made.
                  if (choice.id === 'cod') setSlip(null);
                }}
                className={cn(
                  'min-h-11 rounded-2xl border text-xs font-bold uppercase transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]',
                  payment === choice.id
                    ? 'border-[#ff2a85] bg-[#ff2a85] text-white shadow-md shadow-pink-200'
                    : 'border-slate-200 text-[#8c7a8b] hover:border-pink-200',
                )}
              >
                {choice.label}
              </button>
            ))}
          </div>

          {requiresSlip(payment) ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 rounded-2xl bg-pink-50/50 p-4">
                <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl border border-pink-200 bg-white">
                  <QrCode size={52} className="text-[#2d1f2d]" strokeWidth={1.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#ff2a85]">
                    Scan to pay
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#2d1f2d]">
                    Pinky Beauty · 09 771 234 567
                  </p>
                  <p className="mt-0.5 text-[0.7rem] leading-relaxed text-[#8c7a8b]">
                    Transfer {ks(totals.totalKyat)} via {payment === 'kpay' ? 'KPay' : 'WavePay'},
                    then attach the screenshot below.
                  </p>
                </div>
              </div>

              <SlipUploader file={slip} onPick={setSlip} onClear={() => setSlip(null)} />

              {submitted && slipMissing ? (
                <p role="alert" className="text-[0.7rem] font-medium text-rose-600">
                  Attach your payment screenshot to place this order.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="rounded-2xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
              Pay the courier in cash on arrival. Please have the exact amount ready.
            </p>
          )}
        </Card>
      </div>

      {/* ── Summary ────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-5">
        <Card className="space-y-4 p-5 md:p-6 lg:sticky lg:top-24">
          <Heading as="h2" className="text-lg">
            Order Summary
          </Heading>

          {lines.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#8c7a8b]">
              Your bag is empty. Add something from the shop.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lines.map((line) => (
                <li key={line.id} className="flex items-center gap-3 py-3">
                  <img
                    src={line.image}
                    alt=""
                    aria-hidden="true"
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#2d1f2d]">{line.name}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onQty(line.id, line.qty - 1)}
                        aria-label={`Decrease ${line.name}`}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[#8c7a8b] hover:border-[#ff2a85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]"
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-xs font-bold tabular-nums">
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onQty(line.id, line.qty + 1)}
                        aria-label={`Increase ${line.name}`}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[#8c7a8b] hover:border-[#ff2a85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(line.id)}
                        aria-label={`Remove ${line.name}`}
                        className="ml-1 grid h-8 w-8 place-items-center rounded-lg text-[#8c7a8b] hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <span className="shrink-0 text-sm font-bold text-[#2d1f2d]">
                    {ks(line.priceKyat * line.qty)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Coupon */}
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                placeholder="Coupon code (SUMMER25)"
                aria-label="Coupon code"
                className={cn(inputClass, 'flex-1 uppercase')}
              />
              <PinkButton
                variant="outline"
                onClick={redeem}
                disabled={!couponCode.trim() || lines.length === 0}
                className="shrink-0 bg-[#2d1f2d] text-white hover:bg-[#2d1f2d]/90"
              >
                Apply
              </PinkButton>
            </div>

            {couponMessage ? (
              <p
                role="status"
                className={cn(
                  'text-[0.7rem] font-medium',
                  couponMessage.ok ? 'text-emerald-600' : 'text-rose-600',
                )}
              >
                {couponMessage.text}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-[#8c7a8b]">
            <div className="flex justify-between">
              <span>Subtotal ({totals.itemCount} items)</span>
              <span className="tabular-nums">{ks(totals.subtotalKyat)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="tabular-nums">{ks(totals.deliveryKyat)}</span>
            </div>
            {totals.discountKyat > 0 ? (
              <div className="flex justify-between font-semibold text-emerald-600">
                <span>Discount</span>
                <span className="tabular-nums">− {ks(totals.discountKyat)}</span>
              </div>
            ) : null}
          </div>

          <div className="flex items-baseline justify-between border-t border-slate-100 pt-3">
            <span className="text-lg font-bold text-[#2d1f2d]" style={{ fontFamily: SERIF }}>
              Total
            </span>
            <span className="text-xl font-bold tabular-nums text-[#ff2a85]" style={{ fontFamily: SERIF }}>
              {ks(totals.totalKyat)}
            </span>
          </div>

          <PinkButton block onClick={place} disabled={lines.length === 0} className="py-3.5">
            Place Order
          </PinkButton>

          {submitted && !canPlace && lines.length > 0 ? (
            <p role="alert" className="text-center text-[0.7rem] font-medium text-rose-600">
              Please fix the highlighted fields above.
            </p>
          ) : null}

          <div className="flex justify-center">
            <Badge tone="emerald">
              <CheckCircle2 size={11} /> Secure checkout
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
