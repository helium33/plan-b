/**
 * Visit the shop: where it is, when it is open, and booking a slot.
 *
 * Plan B Vision has one location, so there is no locator to build — the useful
 * version of "store locator" for a single-shop business is a clear address, a
 * live open/closed answer and one tap to directions.
 *
 * Booking requires sign-in. That is a real trade-off: it loses the customer who
 * wanted to book in ten seconds without an account. It is chosen anyway because
 * a booking has to be reachable by phone to be worth anything, an authenticated
 * booking carries a verified number, and an open write endpoint on a public
 * collection is a spam target with no rate limiting available client-side. Guests
 * are offered the shop's phone number instead, which is the honest alternative.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Phone,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AuthAlert } from '@/app/components/auth/auth-alert';
import { TextField } from '@/app/components/auth/fields';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { useLanguage } from '@/app/hooks/use-language';
import { resolveErrorKey } from '@/lib/auth';
import {
  APPOINTMENT_SERVICES,
  type AppointmentService,
  requestAppointment,
} from '@/lib/firestore/appointments';
import { formatPhone } from '@/lib/phone';
import {
  STORE,
  STORE_TIMEZONE,
  type Weekday,
  bookableDates,
  directionsUrl,
  formatMinutes,
  fullAddress,
  openState,
  slotsForDate,
  storeLocalNow,
  telHref,
} from '@/config/store';

/**
 * `Date.getDay()` index → locale key.
 *
 * The locale uses named keys because numeric ones make i18next treat the object
 * as array-like and drop it from the typed key union.
 */
const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function BookingPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('pages.booking.title'));

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('pages.booking.title')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t('booking.intro')}
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        <StorePanel />
        <BookingForm />
      </div>
    </div>
  );
}

/* ── Store details ─────────────────────────────────────────────────────────── */

function StorePanel() {
  const { t } = useTranslation();

  /**
   * Recomputed every minute so the open/closed badge does not go stale on a tab
   * left open — the state can change while someone is reading the page.
   */
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const state = openState(now);
  const today = storeLocalNow(now).weekday;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {STORE.name} · {STORE.branchLabel}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('booking.singleStoreNote')}</p>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            state.open
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              state.open ? 'bg-emerald-500' : 'bg-muted-foreground/50',
            )}
          />
          {state.open
            ? t('booking.openUntil', { time: formatMinutes(state.closesAt) })
            : state.reason === 'before-opening' && state.opensAt !== null
              ? t('booking.opensAt', { time: formatMinutes(state.opensAt) })
              : t('booking.closedNow')}
        </span>
      </div>

      <dl className="mt-6 space-y-4 text-sm">
        <div className="flex gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.9} aria-hidden="true" />
          <div>
            <dt className="font-medium text-foreground">{t('booking.address')}</dt>
            <dd className="mt-0.5 leading-relaxed text-muted-foreground">
              {STORE.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="block">
                {STORE.city} {STORE.postalCode}
              </span>
            </dd>
          </div>
        </div>

        <div className="flex gap-3">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.9} aria-hidden="true" />
          <div>
            <dt className="font-medium text-foreground">{t('booking.phone')}</dt>
            <dd className="mt-0.5">
              <a
                href={telHref()}
                dir="ltr"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                {STORE.phone}
              </a>
            </dd>
          </div>
        </div>

        <div className="flex gap-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.9} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <dt className="font-medium text-foreground">{t('booking.hours')}</dt>
            <dd className="mt-1.5">
              <ul className="space-y-1">
                {([1, 2, 3, 4, 5, 6, 0] as Weekday[]).map((day) => {
                  const hours = STORE.hours[day];
                  const isToday = day === today;

                  return (
                    <li
                      key={day}
                      className={cn(
                        'flex items-baseline justify-between gap-4',
                        isToday ? 'font-medium text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      <span>{t(`booking.weekdays.${WEEKDAY_KEYS[day]}`)}</span>
                      <span dir="ltr" className="tabular-nums">
                        {hours.opensAt === null || hours.closesAt === null
                          ? t('booking.closed')
                          : `${formatMinutes(hours.opensAt)} – ${formatMinutes(hours.closesAt)}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('booking.timezoneNote', { timezone: STORE_TIMEZONE })}
              </p>
            </dd>
          </div>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          {/* `noreferrer` alongside `noopener`: this leaves the site, and there is
              no reason to hand Google the referring URL. */}
          <a href={directionsUrl()} target="_blank" rel="noopener noreferrer">
            <Navigation className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
            {t('booking.directions')}
          </a>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <a href={telHref()}>
            <Phone className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
            {t('booking.callShop')}
          </a>
        </Button>
      </div>

      {/* Plain text address, so it can be copied into a ride-hailing app. */}
      <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        {fullAddress()}
      </p>
    </motion.section>
  );
}

/* ── Booking ───────────────────────────────────────────────────────────────── */

function BookingForm() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { isSignedIn, isLoading, user, member, phoneKey } = useAuth();

  const [service, setService] = useState<AppointmentService>('eye-test');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ date: string; slot: number } | null>(null);

  const dates = useMemo(() => bookableDates(), []);
  const slots = useMemo(() => (date ? slotsForDate(date) : []), [date]);

  // Default to the first bookable day rather than an empty picker.
  useEffect(() => {
    if (!date && dates.length > 0) setDate(dates[0]);
  }, [date, dates]);

  // Pre-fill the name from the member record once it arrives.
  useEffect(() => {
    const saved = member?.profile.name ?? member?.displayName ?? user?.displayName;
    if (saved && !name) setName(saved);
  }, [member, user, name]);

  // A slot chosen for one day is meaningless on another.
  useEffect(() => {
    setSlot(null);
  }, [date]);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(language === 'my' ? 'my-MM' : 'en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      numberingSystem: 'latn',
      timeZone: 'UTC',
    }).format(new Date(`${iso}T12:00:00Z`));

  const submit = async () => {
    if (!phoneKey || !member || !user || slot === null) return;

    setSaving(true);
    setErrorKey(null);

    try {
      await requestAppointment({
        uid: user.uid,
        phoneKey,
        phone: member.phone,
        name: name.trim() || member.phone,
        service,
        date,
        startMinutes: slot,
        durationMinutes: STORE.booking.slotMinutes,
        notes,
      });

      setConfirmed({ date, slot });
    } catch (error) {
      setErrorKey(resolveErrorKey(error));
    } finally {
      setSaving(false);
    }
  };

  /* Signed out — offer the phone number rather than a form that cannot submit. */
  if (!isLoading && !isSignedIn) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">{t('booking.formTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t('booking.signInRequired')}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <Link to={ROUTES.signIn} state={{ from: { pathname: ROUTES.booking } }}>
              {t('actions.signIn')}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href={telHref()}>
              <Phone className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
              {t('booking.orCallUs')}
            </a>
          </Button>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t('common.loading')}
        </p>
      </section>
    );
  }

  /* Signed in but no phone verified — no member record to attach a booking to. */
  if (!phoneKey) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">{t('booking.formTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t('booking.phoneRequired')}
        </p>
        <Button asChild className="mt-5">
          <Link to={ROUTES.account}>{t('auth.verifyPhoneTitle')}</Link>
        </Button>
      </section>
    );
  }

  if (confirmed) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        role="status"
        className="rounded-2xl border border-emerald-600/30 bg-emerald-600/5 p-6"
      >
        <CheckCircle2
          className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
          strokeWidth={1.8}
          aria-hidden="true"
        />

        <h2 className="mt-4 text-base font-semibold text-foreground">
          {t('booking.requestedTitle')}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t('booking.requestedBody', {
            service: t(`booking.services.${service}`),
            date: formatDate(confirmed.date),
            time: formatMinutes(confirmed.slot),
          })}
        </p>

        {/* "Requested", never "confirmed" — the shop confirms by phone, and
            saying otherwise would have someone turn up to a slot nobody kept. */}
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t('booking.requestedNext', { phone: formatPhone(member?.phone ?? '') })}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setConfirmed(null)}>
            {t('booking.bookAnother')}
          </Button>
          <Button asChild size="sm">
            <Link to={ROUTES.shop}>{t('actions.shopNow')}</Link>
          </Button>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <h2 className="text-base font-semibold text-foreground">{t('booking.formTitle')}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{t('booking.formSubtitle')}</p>

      {errorKey ? (
        <div className="mt-5">
          <AuthAlert messageKey={errorKey} />
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        {/* Service */}
        <fieldset>
          <legend className="text-sm font-medium text-foreground">
            {t('booking.serviceLabel')}
          </legend>

          <div role="radiogroup" aria-label={t('booking.serviceLabel')} className="mt-2.5 grid gap-2 sm:grid-cols-2">
            {APPOINTMENT_SERVICES.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={service === value}
                onClick={() => setService(value)}
                className={cn(
                  'rounded-xl border px-3.5 py-3 text-left text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  service === value
                    ? 'border-primary bg-primary/5 font-medium text-foreground'
                    : 'border-border text-muted-foreground hover:border-brand-300 hover:text-foreground dark:hover:border-brand-700',
                )}
              >
                {t(`booking.services.${value}`)}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Date */}
        <fieldset>
          <legend className="text-sm font-medium text-foreground">{t('booking.dateLabel')}</legend>

          {dates.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t('booking.noDates')}</p>
          ) : (
            <div
              role="radiogroup"
              aria-label={t('booking.dateLabel')}
              /* Horizontal scroller: 30 days of chips would otherwise push the
                 time slots off the bottom of a phone screen. */
              className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1"
            >
              {dates.map((iso) => (
                <button
                  key={iso}
                  type="button"
                  role="radio"
                  aria-checked={date === iso}
                  onClick={() => setDate(iso)}
                  className={cn(
                    'shrink-0 rounded-xl border px-3.5 py-2.5 text-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    date === iso
                      ? 'border-primary bg-primary/5 font-medium text-foreground'
                      : 'border-border text-muted-foreground hover:border-brand-300 hover:text-foreground dark:hover:border-brand-700',
                  )}
                >
                  {formatDate(iso)}
                </button>
              ))}
            </div>
          )}
        </fieldset>

        {/* Time */}
        <fieldset>
          <legend className="text-sm font-medium text-foreground">{t('booking.timeLabel')}</legend>

          {slots.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t('booking.noSlots')}</p>
          ) : (
            <div
              role="radiogroup"
              aria-label={t('booking.timeLabel')}
              className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4"
            >
              {slots.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  role="radio"
                  aria-checked={slot === minutes}
                  onClick={() => setSlot(minutes)}
                  dir="ltr"
                  className={cn(
                    'rounded-lg border py-2 text-sm tabular-nums transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    slot === minutes
                      ? 'border-primary bg-primary/5 font-medium text-foreground'
                      : 'border-border text-muted-foreground hover:border-brand-300 hover:text-foreground dark:hover:border-brand-700',
                  )}
                >
                  {formatMinutes(minutes)}
                </button>
              ))}
            </div>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            {t('booking.slotNote', { minutes: STORE.booking.slotMinutes })}
          </p>
        </fieldset>

        <TextField
          label={t('booking.nameLabel')}
          value={name}
          onChange={setName}
          placeholder={t('auth.namePlaceholder')}
          autoComplete="name"
          disabled={saving}
        />

        <div className="space-y-1.5">
          <label htmlFor="booking-notes" className="text-sm font-medium text-foreground">
            {t('booking.notesLabel')}
          </label>
          <textarea
            id="booking-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            maxLength={500}
            placeholder={t('booking.notesPlaceholder')}
            disabled={saving}
            className="w-full resize-y rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">{t('common.optional')}</p>
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={saving || slot === null || !date}
          onClick={() => void submit()}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <CalendarCheck className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          )}
          {t('booking.submit')}
        </Button>

        {slot === null ? (
          <p className="text-center text-xs text-muted-foreground">{t('booking.pickSlotFirst')}</p>
        ) : null}
      </div>
    </motion.section>
  );
}
