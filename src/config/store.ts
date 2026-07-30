/**
 * The physical shop.
 *
 * Plan B Vision has **one** retail location. The five store codes in the
 * in-store POS (`main`, `win`, `pwint`, `yangon`, `yangon-office`) are internal
 * bookkeeping, not branches, so nothing here is keyed by them.
 *
 * ── Edit this file to change the shop's real details ──────────────────────
 * Everything a customer is told about visiting is in this one object. Phone and
 * email come from `.env.local` via `env.ts` so they are not duplicated (the
 * footer already reads them from there); the address and hours live here
 * because they are not secrets and benefit from being in version control.
 *
 * The values below are placeholders. Replacing them requires no code changes —
 * opening hours drive the booking form's time slots and the live open/closed
 * badge automatically.
 */
import { env } from '@/lib/env';

/** 0 = Sunday, matching `Date.prototype.getDay`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type OpeningHours = {
  /** Minutes from midnight, e.g. 9:00 → 540. Null both means closed that day. */
  opensAt: number | null;
  closesAt: number | null;
};

/** Minutes-from-midnight helper, so hours read as times in the source. */
const at = (hour: number, minute = 0) => hour * 60 + minute;

/**
 * The shop's timezone, fixed rather than taken from the browser.
 *
 * A customer checking the site from Bangkok or Singapore must see whether the
 * shop is open *in Yangon*, not whether it would be open where they are
 * standing. Myanmar is UTC+06:30 and does not observe daylight saving.
 */
export const STORE_TIMEZONE = 'Asia/Yangon';

export const STORE = {
  name: 'Plan B Vision',
  /** Distinguishes the shop from the brand where both appear together. */
  branchLabel: 'Main Shop',

  /** Street lines, rendered in order. Keep to the local postal convention. */
  addressLines: ['No. 123, Example Street', 'Kamayut Township'],
  city: 'Yangon',
  country: 'Myanmar',
  postalCode: '11041',

  phone: env.store.phone,
  email: env.store.email,

  /**
   * Google Maps link. A search URL rather than embedded coordinates so it
   * resolves correctly before the real address is filled in, and so no Maps API
   * key is needed just to offer directions.
   */
  mapsQuery: 'Plan B Vision Optical, Yangon, Myanmar',

  /** Approximate coordinates, for a future embedded map. Placeholder. */
  coordinates: { lat: 16.8409, lng: 96.1735 },

  /**
   * Opening hours per weekday, indexed by `Date.getDay()`.
   * These drive both the open/closed badge and the bookable time slots.
   */
  hours: {
    0: { opensAt: at(10), closesAt: at(18) }, // Sunday — shorter day
    1: { opensAt: at(9), closesAt: at(20) },
    2: { opensAt: at(9), closesAt: at(20) },
    3: { opensAt: at(9), closesAt: at(20) },
    4: { opensAt: at(9), closesAt: at(20) },
    5: { opensAt: at(9), closesAt: at(20) },
    6: { opensAt: at(9), closesAt: at(20) },
  } satisfies Record<Weekday, OpeningHours>,

  /**
   * Dates the shop is shut regardless of the weekly pattern — public holidays,
   * stocktaking. `YYYY-MM-DD` in shop-local time.
   */
  closedDates: [] as string[],

  /** Booking rules, kept beside the hours they depend on. */
  booking: {
    /** Minutes per appointment. Also the spacing between offered slots. */
    slotMinutes: 30,
    /** No bookings within this many hours — staff need warning. */
    minNoticeHours: 3,
    /** How far ahead the date picker allows. */
    maxAdvanceDays: 30,
    /** Last slot must *finish* this many minutes before closing. */
    bufferBeforeCloseMinutes: 30,
  },
} as const;

/* ── Derived helpers ───────────────────────────────────────────────────────── */

/** `540` → `"9:00"`. Western numerals in both languages, as elsewhere. */
export function formatMinutes(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

/** The full postal address on one line, for `tel:`-style links and metadata. */
export function fullAddress(): string {
  return [...STORE.addressLines, STORE.city, STORE.postalCode, STORE.country]
    .filter(Boolean)
    .join(', ');
}

export function directionsUrl(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE.mapsQuery)}`;
}

/** `tel:` href with spaces stripped, which some dialers require. */
export function telHref(): string {
  return `tel:${STORE.phone.replace(/\s+/g, '')}`;
}

/**
 * The current date and time *in the shop's timezone*.
 *
 * `Intl.DateTimeFormat` with an explicit `timeZone` is the only way to do this
 * without shipping a timezone library: it converts the visitor's instant into
 * Yangon wall-clock parts, so the answer is right whether they are in Yangon,
 * London or on a plane.
 */
export function storeLocalNow(now = new Date()): {
  weekday: Weekday;
  minutes: number;
  isoDate: string;
} {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: STORE_TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

  const weekdayIndex: Record<string, Weekday> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };

  // `hour12: false` can render midnight as "24" in some engines; normalise it
  // so 24:15 does not become tomorrow's 15 past midnight-plus-a-day.
  const hour = Number(get('hour')) % 24;

  return {
    weekday: weekdayIndex[get('weekday')] ?? 0,
    minutes: hour * 60 + Number(get('minute')),
    isoDate: `${get('year')}-${get('month')}-${get('day')}`,
  };
}

export type OpenState =
  | { open: true; closesAt: number }
  | { open: false; reason: 'closed-today' | 'before-opening' | 'after-closing'; opensAt: number | null };

/** Whether the shop is open right now, and when that changes. */
export function openState(now = new Date()): OpenState {
  const { weekday, minutes, isoDate } = storeLocalNow(now);

  if ((STORE.closedDates as readonly string[]).includes(isoDate)) {
    return { open: false, reason: 'closed-today', opensAt: null };
  }

  const today = STORE.hours[weekday];
  if (today.opensAt === null || today.closesAt === null) {
    return { open: false, reason: 'closed-today', opensAt: null };
  }

  if (minutes < today.opensAt) {
    return { open: false, reason: 'before-opening', opensAt: today.opensAt };
  }
  if (minutes >= today.closesAt) {
    return { open: false, reason: 'after-closing', opensAt: null };
  }

  return { open: true, closesAt: today.closesAt };
}

/**
 * Bookable slots for a given date, as minutes from midnight.
 *
 * Applies three rules together, because they interact: the shop's hours for
 * that weekday, a buffer so the last appointment finishes before closing, and
 * a minimum notice period that only bites on today.
 *
 * @param isoDate `YYYY-MM-DD` in shop-local time.
 */
export function slotsForDate(isoDate: string, now = new Date()): number[] {
  if ((STORE.closedDates as readonly string[]).includes(isoDate)) return [];

  // Parsed as UTC noon to sidestep the off-by-one a bare `new Date('YYYY-MM-DD')`
  // causes for anyone west of Greenwich.
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return [];

  const weekday = date.getUTCDay() as Weekday;
  const { opensAt, closesAt } = STORE.hours[weekday];
  if (opensAt === null || closesAt === null) return [];

  const { slotMinutes, minNoticeHours, bufferBeforeCloseMinutes } = STORE.booking;

  const local = storeLocalNow(now);
  const isToday = local.isoDate === isoDate;
  const earliestToday = local.minutes + minNoticeHours * 60;

  const slots: number[] = [];
  const lastStart = closesAt - bufferBeforeCloseMinutes - slotMinutes;

  for (let start = opensAt; start <= lastStart; start += slotMinutes) {
    if (isToday && start < earliestToday) continue;
    slots.push(start);
  }

  return slots;
}

/** The next `maxAdvanceDays` dates the shop is open, as `YYYY-MM-DD`. */
export function bookableDates(now = new Date()): string[] {
  const { isoDate } = storeLocalNow(now);
  const start = new Date(`${isoDate}T12:00:00Z`);
  const dates: string[] = [];

  for (let offset = 0; offset <= STORE.booking.maxAdvanceDays; offset += 1) {
    const day = new Date(start);
    day.setUTCDate(day.getUTCDate() + offset);
    const iso = day.toISOString().slice(0, 10);

    // A date with no remaining slots today, or a closed day, is not offered —
    // showing a date that yields an empty time list is a dead end.
    if (slotsForDate(iso, now).length > 0) dates.push(iso);
  }

  return dates;
}
