/**
 * Admin writes to the frame catalogue.
 *
 * Kept apart from `frames.ts` (which only reads) so the customer-facing bundle
 * never imports the write paths, and so it is obvious at a glance which functions
 * require staff privileges.
 */
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { FRAMES_COLLECTION, type FrameDoc, frameSlug } from '@/lib/product';
import { deleteFrameMedia } from '@/lib/media/upload';

/** Everything except the derived id, which comes from brand + frame code. */
export type FrameInput = Omit<FrameDoc, 'id' | 'createdAtMs' | 'fromPos'>;

/**
 * Creates or overwrites a frame.
 *
 * The document id is derived from brand + frame code, so re-uploading the same
 * frame corrects the existing entry rather than creating a near-duplicate that
 * then appears twice in the shop. `createdAtMs` is preserved when one already
 * exists, so editing a frame does not shuffle it to the top of "newest".
 *
 * An edit passes the entry's own `id` and is *merged* into it, so fields this
 * form does not know about — `source: 'POS'` above all, which keeps a synced
 * frame's stock following the POS — survive the save.
 */
export async function saveFrame(
  input: FrameInput,
  options: { existingCreatedAtMs?: number; id?: string } = {},
): Promise<{ id: string }> {
  const id = options.id ?? frameSlug(input.brand, input.frameCode);

  await setDoc(doc(db, FRAMES_COLLECTION, id), {
    ...input,
    // Sort key for "newest". A client clock is acceptable here — the ordering of
    // two frames uploaded seconds apart does not matter, and using
    // `serverTimestamp()` would mean the field is null until the write lands,
    // which breaks `orderBy` on the very first read.
    createdAtMs: options.existingCreatedAtMs ?? Date.now(),
    updatedAt: serverTimestamp(),
  }, { merge: options.id !== undefined });

  return { id };
}

/** Shows or hides a frame without deleting it or its media. */
export async function setFramePublished(id: string, published: boolean): Promise<void> {
  await updateDoc(doc(db, FRAMES_COLLECTION, id), {
    published,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes a frame.
 *
 * The media is *not* deleted with it — Cloudinary's destroy API needs an API
 * secret that cannot live in a browser. `deleteFrameMedia` says so rather than
 * pretending, and this returns that flag so the admin UI can tell the shop the
 * photos are still in the Media Library. Silently orphaning them and reporting
 * success would be the worse failure: nobody would ever go and clear them.
 */
export async function deleteFrame(
  id: string,
): Promise<{ mediaDeleted: number; requiresManualCleanup: boolean }> {
  const media = await deleteFrameMedia(id);
  await deleteDoc(doc(db, FRAMES_COLLECTION, id));
  return { mediaDeleted: media.deleted, requiresManualCleanup: media.requiresManualCleanup };
}
