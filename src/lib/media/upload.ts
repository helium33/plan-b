/**
 * Uploads catalogue media to Cloudinary.
 *
 * ── Why Cloudinary and not Firebase Storage ────────────────────────────────
 * Delivery. A frame photo is served to every buyer browsing the catalogue on a
 * phone, and Cloudinary resizes and re-encodes on the fly at the CDN edge, so a
 * 2 MB upload reaches a phone as a 40 kB WebP without the shop doing anything.
 * Firebase Storage serves back exactly what was uploaded, which on a Myanmar
 * mobile connection is the difference between a catalogue that loads and one
 * that does not. Everything else — Firestore, Auth, rules — stays on Firebase.
 *
 * ── The preset shapes this code ────────────────────────────────────────────
 * The unsigned preset (`ml_eyeware`) is configured *Disallow public_id*, *Use
 * filename*, *Unique filename*, *Overwrite: false*. So this sends a `folder`
 * plus a **named blob** and never a `public_id` — passing one is rejected
 * outright. Cloudinary derives the id from the filename and appends a suffix to
 * keep it unique.
 *
 * ── Diagnosing a failure ───────────────────────────────────────────────────
 * A wrong *cloud name* returns `401 Unknown API key`, which reads like a
 * credentials problem and sends you hunting through the preset. A real cloud
 * with a bad *preset* returns `400 Upload preset not found`. That pair is the
 * fastest way to tell the two apart — the message does not mean what it says.
 */
import { env } from '@/lib/env';

export type UploadHandle = {
  /** Resolves to the public delivery URL. */
  done: Promise<string>;
  /** Aborts the transfer. */
  cancel: () => void;
};

export type UploadProgress = {
  bytesTransferred: number;
  totalBytes: number;
  /** 0–1. */
  fraction: number;
};

/** Where a variant's media lives, as a Cloudinary folder. */
export function variantFolder(frameSlug: string, cNumber: string): string {
  // C-numbers are shop-entered, so they are sanitised before becoming a path
  // segment — a stray `/` would silently create a nested folder.
  const safeC = cNumber.replace(/[^A-Za-z0-9_-]/g, '') || 'C';
  return `frames/${frameSlug}/${safeC}`;
}

/** `image` for stills, `video` for clips. Cloudinary has separate endpoints. */
function resourceKind(blob: Blob): 'image' | 'video' {
  return blob.type.startsWith('video/') ? 'video' : 'image';
}

/**
 * Starts an upload.
 *
 * `XMLHttpRequest` rather than `fetch` purely for `upload.onprogress`: the
 * Fetch API still has no way to observe request-body progress, and a shop
 * uploading a 15 MB video over mobile data needs to see that something is
 * happening. The progress bar is the difference between waiting and force-quitting.
 *
 * @param path       Full object path from `variantFolder`, plus a filename.
 * @param blob       The compressed blob.
 * @param onProgress Called on every progress event.
 */
export function uploadMedia(
  path: string,
  blob: Blob,
  onProgress?: (progress: UploadProgress) => void,
): UploadHandle {
  const request = new XMLHttpRequest();

  const lastSlash = path.lastIndexOf('/');
  const folder = lastSlash > 0 ? path.slice(0, lastSlash) : '';
  const filename = path.slice(lastSlash + 1) || 'upload';

  const done = new Promise<string>((resolve, reject) => {
    const form = new FormData();
    form.append('upload_preset', env.cloudinary.uploadPreset);
    if (folder) form.append('folder', folder);
    // The filename on the blob is what Cloudinary derives the public id from,
    // since the preset forbids sending one directly.
    form.append('file', blob, filename);

    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      onProgress?.({
        bytesTransferred: event.loaded,
        totalBytes: event.total,
        fraction: event.total > 0 ? event.loaded / event.total : 0,
      });
    });

    request.addEventListener('load', () => {
      let payload: { secure_url?: string; error?: { message?: string } } = {};
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        reject(new Error(`Cloudinary returned a non-JSON response (${request.status})`));
        return;
      }

      if (request.status >= 200 && request.status < 300 && payload.secure_url) {
        resolve(payload.secure_url);
        return;
      }

      reject(
        new Error(
          payload.error?.message ?? `Cloudinary upload failed with status ${request.status}`,
        ),
      );
    });

    request.addEventListener('error', () => reject(new Error('Network error during upload')));
    request.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    request.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/${resourceKind(blob)}/upload`,
    );
    request.send(form);
  });

  return { done, cancel: () => request.abort() };
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
 * Deleting a frame's media is **not** possible from the browser.
 *
 * Cloudinary's destroy API requires the API secret to sign the request, and an
 * API secret in a client bundle is an API secret published to the world — anyone
 * could then delete the shop's entire media library. So this reports that
 * nothing was removed rather than pretending otherwise, and the frame document
 * is deleted regardless.
 *
 * The consequence is real and worth stating: deleting a frame orphans its
 * images in Cloudinary. They stop being referenced but keep occupying storage.
 * Clearing them needs either the Cloudinary console (Media Library → delete the
 * `frames/{slug}` folder) or a server-side function holding the secret, which is
 * the right fix if the shop starts deleting frames often.
 */
export async function deleteFrameMedia(
  _frameSlug: string,
): Promise<{ deleted: number; failed: number; requiresManualCleanup: boolean }> {
  return { deleted: 0, failed: 0, requiresManualCleanup: true };
}
