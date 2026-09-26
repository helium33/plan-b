/**
 * Saving files to the buyer's device: HD frame assets, and the voucher.
 *
 * ── Why the images are fetched rather than linked ──────────────────────────
 * `<a download>` is ignored for cross-origin URLs — the browser navigates to the
 * image instead of saving it, which on a phone means the buyer ends up staring
 * at a photo with no obvious way back. Fetching to a blob and saving that keeps
 * the download a download. Cloudinary sends `Access-Control-Allow-Origin: *`, so
 * the fetch is allowed; the seed catalogue's data URIs need no fetch at all.
 */

/** Triggers a save for an already-local blob or data URI. */
function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoked on the next tick rather than immediately: Safari has not finished
  // reading the URL when `click()` returns, and revoking too early saves 0 bytes.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Strips anything a filesystem would object to. */
function safeFilename(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'download';
}

function extensionFor(type: string, url: string): string {
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('svg')) return 'svg';
  if (type.includes('mp4')) return 'mp4';
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';

  const fromUrl = url.split('?')[0].split('.').pop();
  return fromUrl && fromUrl.length <= 4 ? fromUrl : 'jpg';
}

/**
 * Requests the original, untransformed asset from Cloudinary.
 *
 * Delivery URLs carry transformations in the path (`/upload/w_400,f_auto/…`).
 * The catalogue is served resized, but a buyer downloading art for their own
 * Facebook page wants the full-resolution original — so any transformation
 * segment is stripped. A URL that is not a Cloudinary delivery URL, including a
 * data URI, is returned untouched.
 */
export function originalAssetUrl(url: string): string {
  if (!url.includes('res.cloudinary.com')) return url;
  // `/upload/<transformations>/v123/path` → `/upload/v123/path`
  return url.replace(/\/upload\/[^/]*?(?=v\d+\/)/, '/upload/');
}

export type DownloadResult = { ok: true } | { ok: false; reason: 'fetch-failed' };

/** Downloads one asset at full resolution. */
export async function downloadAsset(url: string, baseName: string): Promise<DownloadResult> {
  try {
    const response = await fetch(originalAssetUrl(url), { mode: 'cors' });
    if (!response.ok) return { ok: false, reason: 'fetch-failed' };

    const blob = await response.blob();
    saveBlob(blob, `${safeFilename(baseName)}.${extensionFor(blob.type, url)}`);
    return { ok: true };
  } catch {
    // CORS refusal, offline, or a deleted object. The caller shows a message —
    // opening the raw URL as a "fallback" would just navigate away from the app.
    return { ok: false, reason: 'fetch-failed' };
  }
}

/**
 * Downloads every asset for a frame, one at a time.
 *
 * Sequential with a gap: browsers rate-limit or silently drop programmatic
 * downloads fired in a tight loop, and a buyer who asked for six photos and got
 * two has no way to tell which are missing.
 */
export async function downloadAll(
  assets: { url: string; name: string }[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ saved: number; failed: number }> {
  let saved = 0;
  let failed = 0;

  for (const [index, asset] of assets.entries()) {
    const result = await downloadAsset(asset.url, asset.name);
    if (result.ok) saved += 1;
    else failed += 1;

    onProgress?.(index + 1, assets.length);
    if (index < assets.length - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
    }
  }

  return { saved, failed };
}

/* ── Voucher export ────────────────────────────────────────────────────────── */

/**
 * Renders a DOM node to PNG or PDF.
 *
 * ── Why `html2canvas-pro` and not `html2canvas` ────────────────────────────
 * The original has not shipped a release since 2022 and its colour parser
 * throws on `oklch()` — "Attempting to parse an unsupported color function".
 * Tailwind v4, which this app is built on, emits *every* colour token in oklch,
 * so the original fails on every voucher rather than in some edge case.
 *
 * That is not fixable from the outside. Rewriting the computed colours in the
 * clone does not help, because the failure happens in how the library reads
 * styles rather than in what the element computes to — several increasingly
 * elaborate attempts at that all failed the same way. `html2canvas-pro` is the
 * maintained fork of the same code with modern colour-space support, so the fix
 * is a changed import rather than a workaround that would need re-explaining to
 * whoever reads this next.
 *
 * ── Why the libraries are imported inside the function ─────────────────────
 * The renderer and the PDF engine together are around 175 kB gzipped. Loading
 * them with the app would mean every buyer downloads a PDF engine on first paint
 * to support a button most of them never press. A dynamic import puts them in
 * their own chunks, fetched on the first click.
 *
 * @param node     The element to capture.
 * @param filename Without extension.
 * @param format   `png` for sharing in a chat, `pdf` for filing or printing.
 */
export async function exportVoucher(
  node: HTMLElement,
  filename: string,
  format: 'png' | 'pdf',
): Promise<DownloadResult> {
  try {
    const { default: html2canvas } = await import('html2canvas-pro');

    const canvas = await html2canvas(node, {
      // 2× so the text is still sharp when the shop zooms into the total on a
      // phone. Higher multiples blow past the canvas size limit on long orders.
      scale: 2,
      useCORS: true,
      // Captured against the page's own background rather than transparent —
      // a transparent PNG pasted into Telegram renders black-on-black.
      backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff',
      logging: false,
    });

    if (format === 'png') {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (!blob) return { ok: false, reason: 'fetch-failed' };
      saveBlob(blob, `${safeFilename(filename)}.png`);
      return { ok: true };
    }

    const { jsPDF } = await import('jspdf');

    // The page is sized to the capture rather than forced onto A4: a wholesale
    // voucher is a tall narrow document, and letterboxing it into a portrait
    // sheet leaves the totals the size of a footnote.
    const pdf = new jsPDF({
      orientation: canvas.height >= canvas.width ? 'portrait' : 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${safeFilename(filename)}.pdf`);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'fetch-failed' };
  }
}
