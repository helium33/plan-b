/**
 * Client-side image compression, before anything touches Firebase Storage.
 *
 * ── Why this matters for this shop specifically ────────────────────────────
 * Product photos will be taken on a phone. A modern handset produces 4–12 MB
 * per shot, and a frame with three colourways needs at least six of them. Left
 * alone that is 30–70 MB per product: slow to upload on Myanmar mobile data,
 * paid for twice in Storage and again in egress every time a customer opens the
 * shop page, and it is the customer — on the same mobile data — who pays the
 * download. Re-encoding to ~150–400 kB before upload removes that entirely.
 *
 * ── What this does, and does not, do ───────────────────────────────────────
 * Re-encoding through a canvas has three side effects worth knowing:
 *
 *  1. **Metadata is stripped.** EXIF does not survive `canvas.toBlob`, which
 *     removes the GPS coordinates phones embed by default. That is a privacy
 *     improvement the shop gets for free — otherwise every product photo would
 *     publish the location it was taken in.
 *  2. **Orientation must be handled explicitly.** Because the EXIF tag is
 *     dropped, a photo taken in portrait would come out rotated unless the
 *     rotation is baked into the pixels first. `createImageBitmap` with
 *     `imageOrientation: 'from-image'` does that; see `decode` below.
 *  3. **It is lossy and one-way.** The original file is never uploaded, so the
 *     shop should keep their own copies. `MAX_EDGE` is set generously (1920) so
 *     the result is still usable for a full-width hero, not just a thumbnail.
 */

/** Longest edge after resizing. 1920 covers a full-bleed desktop hero. */
export const MAX_EDGE = 1920;

/** Quality for lossy re-encode. 0.82 is where WebP artefacts stop being visible. */
export const QUALITY = 0.82;

/** Anything larger is rejected before decoding — a 60 MB file will hang a phone. */
export const MAX_INPUT_BYTES = 25 * 1024 * 1024;

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];

/** Extensions this module can produce, including a passed-through original. */
export type ImageExtension = 'webp' | 'jpg' | 'png';

export type CompressedImage = {
  blob: Blob;
  /** File extension matching `blob.type` — always derived, never assumed. */
  extension: ImageExtension;
  width: number;
  height: number;
  originalBytes: number;
  compressedBytes: number;
  /** 0.82 means the result is 18% smaller than the input. */
  savedFraction: number;
  /** True when the original was returned untouched because re-encoding grew it. */
  keptOriginal: boolean;
};

export type CompressErrorCode =
  | 'unsupported-type'
  | 'too-large'
  | 'decode-failed'
  | 'encode-failed';

export class CompressError extends Error {
  constructor(readonly code: CompressErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'CompressError';
  }
}

/* ── Capability detection ──────────────────────────────────────────────────── */

/**
 * Extension for a blob's actual MIME type.
 *
 * Derived rather than inferred from intent, because the two can disagree: when the
 * `keptOriginal` guard below returns the *input* file, the extension must describe
 * that file, not the format we had planned to write. Getting this wrong uploads
 * PNG bytes under a `.jpg` name — harmless in a browser, which sniffs the
 * content type, and thoroughly confusing to anyone later reading the bucket.
 */
function extensionFor(type: string): ImageExtension {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  // JPEG, and anything unrecognised. A blob with an empty type came from a source
  // the browser decoded but did not label; JPEG is the safest assumption.
  return 'jpg';
}

let webpSupport: boolean | null = null;

/**
 * Whether this browser can *encode* WebP.
 *
 * Every current browser can, but `toDataURL` silently falls back to PNG when it
 * cannot — which would upload files several times larger than the JPEG we would
 * otherwise have produced. Checking the returned MIME type is the only reliable
 * detection. Cached, since it cannot change mid-session.
 */
function supportsWebpEncode(): boolean {
  if (webpSupport !== null) return webpSupport;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    webpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpSupport = false;
  }

  return webpSupport;
}

/* ── Decoding ──────────────────────────────────────────────────────────────── */

type Decoded = { source: ImageBitmap | HTMLImageElement; width: number; height: number };

/**
 * Decodes a file to something drawable, with the EXIF rotation already applied.
 *
 * Three paths, in descending order of reliability:
 *
 *  1. `createImageBitmap(file, { imageOrientation: 'from-image' })` — bakes the
 *     rotation into the bitmap. Chrome and Firefox.
 *  2. `createImageBitmap(file)` — for engines that reject the options argument.
 *     Orientation may be lost here; accepted because the alternative is failing
 *     the upload outright.
 *  3. `HTMLImageElement` via an object URL — Safari's historical path, and the
 *     fallback if `createImageBitmap` is missing. Modern Safari applies EXIF
 *     orientation when decoding, so `drawImage` gets upright pixels.
 */
async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      try {
        const bitmap = await createImageBitmap(file);
        return { source: bitmap, width: bitmap.width, height: bitmap.height };
      } catch {
        // Fall through to the <img> path.
      }
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new CompressError('decode-failed'));
      element.src = url;
    });

    return { source: image, width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    // Revoked even on success: the bitmap has been decoded into memory by now, and
    // leaving the URL alive holds the whole file until the tab closes.
    URL.revokeObjectURL(url);
  }
}

/* ── Resizing ──────────────────────────────────────────────────────────────── */

/** Fits `width`×`height` inside `maxEdge`, never scaling up. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge = MAX_EDGE,
): { width: number; height: number; scale: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height, scale: 1 };

  const scale = maxEdge / longest;
  return {
    // Rounded, and floored at 1: a very long thin panorama could otherwise round
    // its short edge to zero and produce a canvas that cannot be encoded.
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  };
}

/**
 * Draws `source` into a canvas at the target size, halving repeatedly when the
 * reduction is large.
 *
 * A single `drawImage` from 4000px to 1200px samples too few source pixels and
 * produces visible aliasing on fine detail — exactly the thin metal temples and
 * hinge screws these photos are meant to show. Halving in stages lets the
 * browser's filter average properly at each step.
 */
function drawResized(
  source: ImageBitmap | HTMLImageElement,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  flattenTo: string | null,
): HTMLCanvasElement {
  let currentWidth = sourceWidth;
  let currentHeight = sourceHeight;
  let current: ImageBitmap | HTMLImageElement | HTMLCanvasElement = source;

  // Halve while still more than 2× the target.
  while (currentWidth >= targetWidth * 2 && currentHeight >= targetHeight * 2) {
    const nextWidth = Math.max(targetWidth, Math.floor(currentWidth / 2));
    const nextHeight = Math.max(targetHeight, Math.floor(currentHeight / 2));

    const step = document.createElement('canvas');
    step.width = nextWidth;
    step.height = nextHeight;

    const stepContext = step.getContext('2d');
    if (!stepContext) throw new CompressError('encode-failed');
    stepContext.imageSmoothingEnabled = true;
    stepContext.imageSmoothingQuality = 'high';
    stepContext.drawImage(current, 0, 0, nextWidth, nextHeight);

    current = step;
    currentWidth = nextWidth;
    currentHeight = nextHeight;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) throw new CompressError('encode-failed');

  // JPEG has no alpha channel; without a matte, transparent PNG regions encode
  // as black. White matches the product-photo backdrop.
  if (flattenTo) {
    context.fillStyle = flattenTo;
    context.fillRect(0, 0, targetWidth, targetHeight);
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(current, 0, 0, targetWidth, targetHeight);

  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new CompressError('encode-failed'))),
      type,
      quality,
    );
  });
}

/* ── Public API ────────────────────────────────────────────────────────────── */

export type CompressOptions = {
  maxEdge?: number;
  quality?: number;
  /** Force JPEG even where WebP is available. Rarely wanted. */
  forceJpeg?: boolean;
};

/**
 * Compresses one image for upload.
 *
 * @throws {CompressError} for an unsupported type, an oversized input, or a file
 *         the browser cannot decode. Callers surface `code` through the locale
 *         files rather than showing the message.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<CompressedImage> {
  const maxEdge = options.maxEdge ?? MAX_EDGE;
  const quality = options.quality ?? QUALITY;

  // HEIC from an iPhone often has an empty `type`, so an unknown type is allowed
  // through to the decoder rather than rejected here — the decode either works or
  // raises a clear error of its own.
  if (file.type && !ACCEPTED_TYPES.includes(file.type)) {
    throw new CompressError('unsupported-type');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new CompressError('too-large');
  }

  const decoded = await decode(file);
  const target = fitWithin(decoded.width, decoded.height, maxEdge);

  const useWebp = !options.forceJpeg && supportsWebpEncode();
  const mime = useWebp ? 'image/webp' : 'image/jpeg';

  // WebP keeps alpha; JPEG needs it flattened.
  const canvas = drawResized(
    decoded.source,
    decoded.width,
    decoded.height,
    target.width,
    target.height,
    useWebp ? null : '#ffffff',
  );

  const blob = await toBlob(canvas, mime, quality);

  // Release the decoded bitmap's memory now rather than waiting for GC — a batch
  // of eight 12-megapixel photos is well over a gigabyte of decoded pixels.
  if ('close' in decoded.source && typeof decoded.source.close === 'function') {
    decoded.source.close();
  }

  /*
   * Re-encoding can make a file *bigger* — a small, already-optimised WebP, or a
   * flat graphic that PNG stored more efficiently than any lossy codec can. When
   * that happens and no resize was needed, the original is the better upload.
   */
  if (blob.size >= file.size && target.scale === 1) {
    return {
      blob: file,
      extension: extensionFor(file.type),
      width: decoded.width,
      height: decoded.height,
      originalBytes: file.size,
      compressedBytes: file.size,
      savedFraction: 0,
      keptOriginal: true,
    };
  }

  return {
    blob,
    extension: extensionFor(blob.type),
    width: target.width,
    height: target.height,
    originalBytes: file.size,
    compressedBytes: blob.size,
    savedFraction: file.size > 0 ? 1 - blob.size / file.size : 0,
    keptOriginal: false,
  };
}

/**
 * Compresses a batch, reporting progress as each finishes.
 *
 * Sequential, not parallel. Decoding a 12-megapixel photo allocates ~50 MB of
 * bitmap; doing eight at once is how a mid-range Android tab crashes. One at a
 * time is barely slower in practice because the work is CPU-bound anyway.
 */
export async function compressImages(
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<Array<{ file: File; result: CompressedImage | null; error: CompressErrorCode | null }>> {
  const output: Array<{ file: File; result: CompressedImage | null; error: CompressErrorCode | null }> = [];

  for (const [index, file] of files.entries()) {
    try {
      output.push({ file, result: await compressImage(file), error: null });
    } catch (error) {
      // One bad file must not abandon the rest of the batch; the form shows which
      // failed and lets the shop retry just those.
      output.push({
        file,
        result: null,
        error: error instanceof CompressError ? error.code : 'encode-failed',
      });
    }
    onProgress?.(index + 1, files.length);
  }

  return output;
}

/** `1536000` → `1.5 MB`. For the before/after readout on each thumbnail. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
