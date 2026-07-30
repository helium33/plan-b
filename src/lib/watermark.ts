/**
 * Canvas watermarking, for the "save branded image" button.
 *
 * ── What a watermark can and cannot do ─────────────────────────────────────
 * It **cannot prevent** image theft. The unmarked original is already in the
 * browser's cache and network panel, one right-click or one devtools tab away.
 * Anyone determined to take it, will.
 *
 * What it does do is make a stolen image visibly the shop's wherever it is
 * reposted — on Facebook Marketplace, in a Viber group, on a competitor's page.
 * That is the actual deterrent, and it works on the copies that matter: the ones
 * shared casually rather than extracted deliberately.
 *
 * So this is a *download* feature, not a display one: the gallery stays clean for
 * browsing, and the mark is applied to the file the customer or staff member
 * saves. Watermarking the on-screen images would degrade the shopping experience
 * for every honest visitor to inconvenience nobody.
 *
 * ── CORS ───────────────────────────────────────────────────────────────────
 * Reading pixels from a canvas that has drawn a cross-origin image throws a
 * security error and taints the canvas. Firebase Storage sends permissive CORS
 * headers, and `crossOrigin = 'anonymous'` opts into using them — without that
 * attribute the draw succeeds but the export fails, which is a confusing way to
 * discover the problem. Data URIs (the sample catalogue) are same-origin and
 * unaffected.
 */

export const WATERMARK_TEXT = 'Plan B Vision Official';

/** Longest edge of the exported file. Big enough to be useful, small enough to send. */
const OUTPUT_MAX_EDGE = 1400;

export type WatermarkErrorCode = 'load-failed' | 'canvas-unavailable' | 'export-blocked';

export class WatermarkError extends Error {
  constructor(readonly code: WatermarkErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'WatermarkError';
  }
}

export type WatermarkOptions = {
  /** Small caption bottom-left, e.g. "PBV-2041 · C2". */
  caption?: string;
  /** Overrides the repeated diagonal text. */
  text?: string;
};

/**
 * Loads an image with CORS enabled.
 *
 * The `crossOrigin` attribute must be set *before* `src`, or the browser has
 * already started a request without the header and will not retry.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (!src.startsWith('data:')) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new WatermarkError('load-failed'));
    image.src = src;
  });
}

/**
 * Draws the source image with the watermark over it and returns a PNG blob.
 *
 * The mark has two parts, which do different jobs:
 *
 *  - A **tiled diagonal wordmark** across the whole frame, at low opacity. Tiled
 *    rather than placed once because a single mark in one corner is trivially
 *    cropped out, and diagonal because it crosses the subject rather than sitting
 *    in flat background that can be cloned over.
 *  - A **solid corner badge** with the shop name, at full contrast. This is the
 *    part a human actually reads when the image turns up somewhere else.
 */
export async function watermarkImage(
  src: string,
  options: WatermarkOptions = {},
): Promise<Blob> {
  const image = await loadImage(src);

  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  if (naturalWidth === 0 || naturalHeight === 0) throw new WatermarkError('load-failed');

  // Scale down only; never up, which would just blur the mark onto a bigger file.
  const scale = Math.min(1, OUTPUT_MAX_EDGE / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new WatermarkError('canvas-unavailable');

  context.drawImage(image, 0, 0, width, height);

  const text = options.text ?? WATERMARK_TEXT;

  /* ── Tiled diagonal wordmark ─────────────────────────────────────────── */

  // Font size relative to the image, so the mark reads the same on a small
  // thumbnail and a large export.
  const fontSize = Math.max(12, Math.round(Math.min(width, height) * 0.045));

  context.save();
  context.globalAlpha = 0.16;
  context.fillStyle = '#ffffff';
  context.strokeStyle = 'rgba(0,0,0,0.35)';
  context.lineWidth = Math.max(1, fontSize * 0.06);
  context.font = `600 ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  context.textBaseline = 'middle';

  // Rotate the whole plane, then tile over a box large enough that the rotated
  // grid still covers every corner of the unrotated image.
  context.translate(width / 2, height / 2);
  context.rotate(-Math.PI / 6);

  const diagonal = Math.sqrt(width * width + height * height);
  const textWidth = context.measureText(text).width;
  const stepX = textWidth + fontSize * 2.5;
  const stepY = fontSize * 4.5;

  for (let y = -diagonal / 2; y <= diagonal / 2; y += stepY) {
    // Offset alternate rows so the marks interlock instead of forming columns
    // that can be cropped between.
    const rowIndex = Math.round((y + diagonal / 2) / stepY);
    const offset = rowIndex % 2 === 0 ? 0 : stepX / 2;

    for (let x = -diagonal / 2 - offset; x <= diagonal / 2; x += stepX) {
      // Stroke under fill: white text on a white shirt would otherwise vanish.
      context.strokeText(text, x, y);
      context.fillText(text, x, y);
    }
  }
  context.restore();

  /* ── Corner badge ────────────────────────────────────────────────────── */

  const badgeFont = Math.max(11, Math.round(Math.min(width, height) * 0.032));
  const padding = Math.round(badgeFont * 0.7);

  context.save();
  context.font = `700 ${badgeFont}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  context.textBaseline = 'top';

  const badgeText = WATERMARK_TEXT;
  const badgeWidth = context.measureText(badgeText).width + padding * 2;
  const badgeHeight = badgeFont + padding * 1.4;
  const badgeX = width - badgeWidth - padding;
  const badgeY = padding;

  context.globalAlpha = 0.82;
  context.fillStyle = '#0f172a';
  // `roundRect` is widely supported but not universal; fall back to a plain rect
  // rather than throwing on an older engine.
  if (typeof context.roundRect === 'function') {
    context.beginPath();
    context.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2);
    context.fill();
  } else {
    context.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
  }

  context.globalAlpha = 1;
  context.fillStyle = '#ffffff';
  context.fillText(badgeText, badgeX + padding, badgeY + padding * 0.7);
  context.restore();

  /* ── Caption ─────────────────────────────────────────────────────────── */

  if (options.caption) {
    context.save();
    context.font = `500 ${badgeFont}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    context.textBaseline = 'bottom';

    const captionWidth = context.measureText(options.caption).width + padding * 2;
    const captionHeight = badgeFont + padding * 1.4;
    const captionY = height - padding - captionHeight;

    context.globalAlpha = 0.7;
    context.fillStyle = '#0f172a';
    context.fillRect(padding, captionY, captionWidth, captionHeight);

    context.globalAlpha = 1;
    context.fillStyle = '#ffffff';
    context.fillText(options.caption, padding + padding, captionY + captionHeight - padding * 0.6);
    context.restore();
  }

  /* ── Export ──────────────────────────────────────────────────────────── */

  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new WatermarkError('export-blocked'))),
        'image/png',
      );
    } catch {
      // Thrown when the canvas is tainted by a cross-origin draw that did not
      // carry usable CORS headers.
      reject(new WatermarkError('export-blocked'));
    }
  });
}

/**
 * Watermarks an image and saves it.
 *
 * Uses an anchor with `download` rather than opening a new tab: on mobile a new
 * tab shows the image and leaves the customer to long-press it, whereas this puts
 * the file straight in their downloads.
 */
export async function downloadWatermarked(
  src: string,
  fileName: string,
  options: WatermarkOptions = {},
): Promise<void> {
  const blob = await watermarkImage(src, options);
  const url = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    // Revoked on the next tick, not immediately: some browsers abort the download
    // if the blob URL disappears before the navigation has been handed off.
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

/** A tidy, filesystem-safe file name for a saved frame photo. */
export function watermarkFileName(brand: string, frameCode: string, cNumber?: string): string {
  const parts = [brand, frameCode, cNumber].filter(Boolean).join('-');
  return `${parts
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}-plan-b-vision.png`;
}
