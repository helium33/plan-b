/**
 * Appointment bookings.
 *
 * Layout: `appointments/{autoId}`, with the owning uid and the member's phone
 * key on every document. The phone key is stored so shop staff can match a web
 * booking to the same customer in the POS — the same join key the membership
 * records use.
 *
 * Bookings are create-and-read-only from the client. Rescheduling and
 * cancellation go through the shop, because a slot released at the wrong moment
 * is a double-booking, and that arbitration belongs on a server rather than in
 * whichever browser tab wrote last.
 */
import {
  collection,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  addDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { FirestoreDate } from '@/lib/membership';

export const APPOINTMENTS_COLLECTION = 'appointments';

/** What the customer is coming in for. */
export const APPOINTMENT_SERVICES = ['eye-test', 'frame-fitting', 'adjustment', 'collection'] as const;
export type AppointmentService = (typeof APPOINTMENT_SERVICES)[number];

/**
 * Lifecycle. Only `requested` is ever written from the browser — the shop
 * confirms, and confirmation is what the customer should trust.
 */
export const APPOINTMENT_STATUSES = ['requested', 'confirmed', 'cancelled', 'completed'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type AppointmentDoc = {
  uid: string;
  /** E.164 without the `+`, matching the member document id. */
  phoneKey: string;
  phone: string;
  name: string;

  service: AppointmentService;
  /** `YYYY-MM-DD` in shop-local time. */
  date: string;
  /** Minutes from midnight, shop-local. Stored as a number so slots sort. */
  startMinutes: number;
  /** Appointment length, copied from config at booking time. */
  durationMinutes: number;

  /** Free-text from the customer. */
  notes: string;
  status: AppointmentStatus;

  createdAt: FirestoreDate;
};

export type NewAppointment = Omit<AppointmentDoc, 'status' | 'createdAt'>;

/**
 * Creates a booking request.
 *
 * `status` is forced to `requested` here rather than taken from the caller, so
 * no UI path can accidentally write a self-confirmed appointment. The security
 * rules enforce the same thing, but a value that is never passed in cannot be
 * passed in wrongly.
 */
export async function requestAppointment(input: NewAppointment): Promise<{ id: string }> {
  const ref = await addDoc(collection(db, APPOINTMENTS_COLLECTION), {
    ...input,
    notes: input.notes.trim().slice(0, 500),
    status: 'requested' satisfies AppointmentStatus,
    createdAt: serverTimestamp(),
  });

  return { id: ref.id };
}

/**
 * The signed-in customer's own bookings, newest appointment first.
 *
 * Filters by `uid` and orders by date, which needs a composite index —
 * Firestore's error message links straight to a one-click creation form. Kept as
 * a real query rather than fetching-and-filtering because a customer's booking
 * history is unbounded, unlike the fixed-size catalogue.
 */
export async function listMyAppointments(uid: string, max = 20): Promise<AppointmentDoc[]> {
  const snap = await getDocs(
    query(
      collection(db, APPOINTMENTS_COLLECTION),
      where('uid', '==', uid),
      orderBy('date', 'desc'),
      fbLimit(max),
    ),
  );

  return snap.docs.map((d) => d.data() as AppointmentDoc);
}

/**
 * Slots already requested for a date, so the picker can grey them out.
 *
 * ⚠️ Best-effort only, and the UI says so. Reading other customers' bookings
 * would mean exposing the collection, so the rules keep it private and this
 * returns only the caller's own — meaning two customers can still request the
 * same slot. That is deliberate: the shop confirms every booking by phone
 * anyway, so a clash is resolved by a person. True slot locking needs a
 * server-side availability document, which is a Module 8-scale change.
 */
export async function myBookedSlots(uid: string, date: string): Promise<number[]> {
  const snap = await getDocs(
    query(
      collection(db, APPOINTMENTS_COLLECTION),
      where('uid', '==', uid),
      where('date', '==', date),
    ),
  );

  return snap.docs
    .map((d) => d.data() as AppointmentDoc)
    .filter((appointment) => appointment.status !== 'cancelled')
    .map((appointment) => appointment.startMinutes);
}
