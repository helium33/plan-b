/**
 * Customer reviews, with photos.
 *
 * Layout: `reviews/{autoId}`, one document per review, filtered by `frameId`. A
 * top-level collection rather than a subcollection under each frame, because the
 * shop will want "all reviews awaiting moderation" across the catalogue, and a
 * collection-group query for that is more awkward than a single `where`.
 *
 * ── Moderation is deliberate ───────────────────────────────────────────────
 * Reviews arrive as `pending` and only appear once staff publish them. Photos of
 * real customers' faces on a public product page is exactly the content that must
 * not go live unseen — and a review system with no gate becomes a spam surface
 * within a week.
 */
import {
  addDoc,
  collection,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { FirestoreDate } from '@/lib/membership';

export const REVIEWS_COLLECTION = 'reviews';

export const REVIEW_STATUSES = ['pending', 'published', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export type ReviewDoc = {
  frameId: string;
  /** C-number the customer actually bought, so the review is colour-specific. */
  cNumber: string | null;

  uid: string;
  phoneKey: string;
  /** Display name at the time of writing. Snapshotted so it cannot change later. */
  authorName: string;

  /** 1–5. */
  rating: number;
  title: string;
  body: string;

  /** Storage download URLs. Compressed on upload, same as product media. */
  photos: string[];

  status: ReviewStatus;
  createdAt: FirestoreDate;
};

export type NewReview = Pick<
  ReviewDoc,
  'frameId' | 'cNumber' | 'uid' | 'phoneKey' | 'authorName' | 'rating' | 'title' | 'body' | 'photos'
>;

export const MAX_REVIEW_PHOTOS = 3;
const MAX_TITLE = 120;
const MAX_BODY = 1500;

/**
 * Published reviews for one frame, newest first.
 *
 * Needs the composite index on (`frameId`, `createdAt` desc) declared in
 * `firestore.indexes.json`. `status` is filtered in memory rather than in the
 * query: adding a third field would need another index, and the result set here is
 * small enough that it is not worth one.
 */
export async function listReviews(frameId: string, max = 20): Promise<ReviewDoc[]> {
  const snap = await getDocs(
    query(
      collection(db, REVIEWS_COLLECTION),
      where('frameId', '==', frameId),
      orderBy('createdAt', 'desc'),
      fbLimit(max),
    ),
  );

  return snap.docs
    .map((d) => d.data() as ReviewDoc)
    .filter((review) => review.status === 'published');
}

/**
 * Submits a review for moderation.
 *
 * `status` is forced to `pending` here rather than accepted from the caller, so no
 * UI path can publish its own review. The rules enforce the same thing — but a
 * value that is never passed in cannot be passed in wrongly.
 */
export async function submitReview(input: NewReview): Promise<{ id: string }> {
  const ref = await addDoc(collection(db, REVIEWS_COLLECTION), {
    ...input,
    rating: Math.min(5, Math.max(1, Math.round(input.rating))),
    title: input.title.trim().slice(0, MAX_TITLE),
    body: input.body.trim().slice(0, MAX_BODY),
    photos: input.photos.slice(0, MAX_REVIEW_PHOTOS),
    status: 'pending' satisfies ReviewStatus,
    createdAt: serverTimestamp(),
  });

  return { id: ref.id };
}

/** Average rating and a count, or `null` when there is nothing to average. */
export function summariseRatings(reviews: ReviewDoc[]): { average: number; count: number } | null {
  if (reviews.length === 0) return null;

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    // One decimal place: "4.3" is honest, "4.28571" is false precision.
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

/** Counts per star, for the distribution bars. Index 0 is one star. */
export function ratingDistribution(reviews: ReviewDoc[]): number[] {
  const buckets = [0, 0, 0, 0, 0];
  for (const review of reviews) {
    const index = Math.min(4, Math.max(0, Math.round(review.rating) - 1));
    buckets[index] += 1;
  }
  return buckets;
}
