/**
 * Uploads to Firebase Storage.
 *
 * Paths are deterministic and human-readable:
 *
 *   frames/{frameSlug}/{cNumber}/image-1.webp
 *   frames/{frameSlug}/{cNumber}/video-1.mp4
 *   frames/{frameSlug}/{cNumber}/poster-1.webp
 *
 * Deterministic rather than random ids, for two reasons. Re-uploading a frame's
 * second photo overwrites the old one instead of orphaning it, so the bucket does
 * not silently fill with files nothing references. And when something looks wrong
 * on the shop page, the file is findable in the Firebase console from the frame
 * code alone.
 *
 * All uploads are resumable. A shop on mobile data will lose the connection
 * partway through a 15 MB video, and `uploadBytesResumable` recovers from that
 * where a single-shot `uploadBytes` would start again from zero.
 */
import {
  type UploadTask,
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';

import { storage } from '@/lib/firebase';

export type UploadHandle = {
  /** Resolves to the public download URL. */
  done: Promise<string>;
  /** Aborts the transfer. The partial object is discarded by Storage. */
  cancel: () => void;
};

export type UploadProgress = {
  bytesTransferred: number;
  totalBytes: number;
  /** 0–1. */
  fraction: number;
};

/** Where a variant's media lives. Exported so the delete path can reuse it. */
export function variantFolder(frameSlug: string, cNumber: string): string {
  // C-numbers are shop-entered, so they are sanitised before becoming a path
  // segment — a stray `/` would silently create a nested folder.
  const safeC = cNumber.replace(/[^A-Za-z0-9_-]/g, '') || 'C';
  return `frames/${frameSlug}/${safeC}`;
}

/**
 * Starts a resumable upload.
 *
 * @param path     Full object path, from `variantFolder`.
 * @param blob     The compressed blob.
 * @param onProgress Called on every progress event.
 */
export function uploadMedia(
  path: string,
  blob: Blob,
  onProgress?: (progress: UploadProgress) => void,
): UploadHandle {
  const objectRef = ref(storage, path);

  const task: UploadTask = uploadBytesResumable(objectRef, blob, {
    contentType: blob.type || 'application/octet-stream',
    // A year, immutable: the path is deterministic and the content at a given
    // path only changes when the shop deliberately re-uploads, at which point the
    // download URL's token changes too and busts the cache anyway.
    cacheControl: 'public, max-age=31536000, immutable',
  });

  const done = new Promise<string>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        onProgress?.({
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          // Guard the divide: `totalBytes` is 0 for a moment before the first chunk.
          fraction: snapshot.totalBytes > 0 ? snapshot.bytesTransferred / snapshot.totalBytes : 0,
        });
      },
      (error) => reject(error),
      () => {
        getDownloadURL(task.snapshot.ref).then(resolve).catch(reject);
      },
    );
  });

  return { done, cancel: () => task.cancel() };
}

/**
 * Uploads a batch sequentially, reporting combined progress.
 *
 * Sequential on purpose: parallel uploads on a constrained mobile connection
 * divide the same bandwidth into lanes that each time out separately, and make
 * per-file progress meaningless. One at a time finishes sooner and can be
 * reported honestly.
 */
export async function uploadAll(
  items: Array<{ path: string; blob: Blob }>,
  onProgress?: (done: number, total: number, current: UploadProgress | null) => void,
): Promise<string[]> {
  const urls: string[] = [];

  for (const [index, item] of items.entries()) {
    const handle = uploadMedia(item.path, item.blob, (progress) =>
      onProgress?.(index, items.length, progress),
    );
    urls.push(await handle.done);
    onProgress?.(index + 1, items.length, null);
  }

  return urls;
}

/**
 * Deletes every object under a frame's folder.
 *
 * Storage has no recursive delete, so this lists and removes each object. Called
 * when a frame is deleted from the admin list — without it, deleting a frame
 * leaves its photos paid for indefinitely.
 *
 * Failures are collected rather than thrown: a missing object (already deleted,
 * or never uploaded) must not stop the rest, and the Firestore document should
 * still go even if a stray file cannot.
 */
export async function deleteFrameMedia(frameSlug: string): Promise<{ deleted: number; failed: number }> {
  const folderRef = ref(storage, `frames/${frameSlug}`);

  let deleted = 0;
  let failed = 0;

  const removeAll = async (target: typeof folderRef): Promise<void> => {
    const listing = await listAll(target);

    await Promise.all(
      listing.items.map(async (item) => {
        try {
          await deleteObject(item);
          deleted += 1;
        } catch {
          failed += 1;
        }
      }),
    );

    // Variant subfolders (`.../C1`, `.../C2`).
    await Promise.all(listing.prefixes.map(removeAll));
  };

  try {
    await removeAll(folderRef);
  } catch {
    // `listAll` on a prefix that never existed throws; nothing to clean up.
  }

  return { deleted, failed };
}
