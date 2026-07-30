/**
 * Writes the sample catalogue into Firestore.
 *
 * ── Why this runs in the browser, not as a Node script ─────────────────────
 * A `firebase-admin` script would need a downloaded service-account key on disk.
 * That is a genuine secret, it has to be kept out of git, and it grants far more
 * than seeding needs. Running as a signed-in admin instead reuses the auth that
 * already exists, adds no dependency, and the allowlist it requires
 * (`admins/{uid}`) is the same gate Module 5's upload form needs — so the setup
 * step is not throwaway work.
 *
 * The one manual step is creating your own `admins/{uid}` document in the
 * Firebase console. The seeding panel shows your uid ready to copy.
 *
 * Idempotent: document ids are derived from brand + frame code, so re-running
 * overwrites rather than accumulating near-duplicates.
 */
import { doc, getDocs, collection, writeBatch, limit as fbLimit, query } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { FRAMES_COLLECTION } from '@/lib/product';

/**
 * The sample catalogue is loaded on demand, never imported at the top level.
 *
 * Statically importing it put the mock data and its artwork generator into the
 * main bundle — shipped to every customer browsing the shop, to support a button
 * only staff can press. A dynamic import moves it to its own chunk, fetched the
 * first time someone actually seeds.
 *
 * The bundle saving is modest (~7 kB) because the artwork is *generated* at
 * module evaluation rather than stored as literals — the ~160 kB of data URIs
 * only ever exists in memory and in Firestore. The split is still right: mock
 * fixtures have no business on a customer's download path, and Module 5's real
 * admin tooling will grow this chunk considerably.
 */
const loadSamples = () => import('@/lib/seed/sample-frames');

export type SeedResult = {
  written: number;
  /** Documents already in the collection before this run. */
  existingBefore: number;
};

/**
 * How many frames seeding will write.
 *
 * Loaded through the same dynamic import, so displaying the number in the admin
 * panel does not drag the artwork back into the main bundle.
 */
export async function sampleFrameCount(): Promise<number> {
  const { SAMPLE_FRAMES } = await loadSamples();
  return SAMPLE_FRAMES.length;
}

/**
 * Upserts every sample frame.
 *
 * Uses `set` without merge, so a frame edited by hand in the console is reset to
 * the known sample state — which is what makes this useful for repeatedly
 * testing the recommender against a fixed catalogue.
 */
export async function seedSampleFrames(): Promise<SeedResult> {
  const { SAMPLE_FRAMES } = await loadSamples();
  const framesRef = collection(db, FRAMES_COLLECTION);

  // Counted before writing, purely so the UI can distinguish "seeded a fresh
  // database" from "reset an existing one".
  const before = await getDocs(query(framesRef, fbLimit(500)));

  // One batch: 12 documents is far inside the 500-write limit, and an atomic
  // write means a half-seeded catalogue cannot be left behind by a dropped
  // connection.
  const batch = writeBatch(db);

  for (const frame of SAMPLE_FRAMES) {
    const { id, ...data } = frame;
    batch.set(doc(framesRef, id), data);
  }

  await batch.commit();

  return { written: SAMPLE_FRAMES.length, existingBefore: before.size };
}

/** Removes only the sample frames, leaving anything uploaded via Module 5. */
export async function clearSampleFrames(): Promise<{ deleted: number }> {
  const { SAMPLE_FRAMES } = await loadSamples();
  const batch = writeBatch(db);

  for (const frame of SAMPLE_FRAMES) {
    batch.delete(doc(db, FRAMES_COLLECTION, frame.id));
  }

  await batch.commit();

  return { deleted: SAMPLE_FRAMES.length };
}
