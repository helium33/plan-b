/**
 * Image and video pickers for the upload form.
 *
 * Compression runs **at selection time**, not at submit. That is the important
 * design choice here: the shop sees the before/after size on each thumbnail while
 * they are still choosing photos, so a 9 MB shot that compressed badly is obvious
 * immediately rather than after a submit that appears to hang. It also means the
 * long CPU-bound work happens while they are still reviewing, and submit is then
 * only network time.
 *
 * Object URLs are created for previews and revoked on unmount. Without that, a
 * shop uploading twenty photos in one session holds every original in memory
 * until the tab closes.
 */
import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ImagePlus,
  Loader2,
  Trash2,
  Video as VideoIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import {
  type CompressedImage,
  type CompressErrorCode,
  compressImages,
  formatBytes,
} from '@/lib/media/compress-image';
import {
  type InspectedVideo,
  type VideoErrorCode,
  ACCEPTED_VIDEO_TYPES,
  MAX_VIDEO_SECONDS,
  formatDuration,
  inspectVideo,
} from '@/lib/media/video';

/* ── Images ────────────────────────────────────────────────────────────────── */

/** One selected, already-compressed image plus its preview URL. */
export type PickedImage = {
  id: string;
  compressed: CompressedImage;
  previewUrl: string;
  originalName: string;
};

export function ImagePicker({
  images,
  onChange,
  minimum,
  label,
}: {
  images: PickedImage[];
  onChange: (next: PickedImage[]) => void;
  /** Shown as a requirement hint and drives the shortfall warning. */
  minimum: number;
  label: string;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState<{ done: number; total: number } | null>(null);
  const [failures, setFailures] = useState<Array<{ name: string; code: CompressErrorCode }>>([]);

  /**
   * Revoke every preview URL when this picker unmounts.
   *
   * Keyed off a ref rather than `images` so the effect does not tear down URLs
   * that are still displayed each time the list changes.
   */
  const liveUrls = useRef<Set<string>>(new Set());
  useEffect(() => {
    const urls = liveUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setFailures([]);
    setBusy({ done: 0, total: files.length });

    const results = await compressImages(files, (done, total) => setBusy({ done, total }));

    const added: PickedImage[] = [];
    const failed: Array<{ name: string; code: CompressErrorCode }> = [];

    for (const entry of results) {
      if (entry.result) {
        const previewUrl = URL.createObjectURL(entry.result.blob);
        liveUrls.current.add(previewUrl);
        added.push({
          // `crypto.randomUUID` is available in every browser this app supports,
          // and avoids two photos picked in the same millisecond colliding.
          id: crypto.randomUUID(),
          compressed: entry.result,
          previewUrl,
          originalName: entry.file.name,
        });
      } else if (entry.error) {
        failed.push({ name: entry.file.name, code: entry.error });
      }
    }

    onChange([...images, ...added]);
    setFailures(failed);
    setBusy(null);

    // Reset the input so picking the same file again still fires `change`.
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (id: string) => {
    const target = images.find((image) => image.id === id);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
      liveUrls.current.delete(target.previewUrl);
    }
    onChange(images.filter((image) => image.id !== id));
  };

  const shortfall = Math.max(0, minimum - images.length);

  const totalOriginal = images.reduce((sum, image) => sum + image.compressed.originalBytes, 0);
  const totalCompressed = images.reduce((sum, image) => sum + image.compressed.compressedBytes, 0);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span
          className={cn(
            'text-xs',
            shortfall > 0 ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {shortfall > 0
            ? t('admin.needMoreImages', { count: shortfall })
            : t('admin.imageCount', { count: images.length })}
        </span>
      </div>

      {images.length > 0 ? (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-card"
            >
              <span className="block aspect-[4/3] overflow-hidden bg-muted">
                <img src={image.previewUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
              </span>

              {index === 0 ? (
                // The first image is the card thumbnail everywhere else, so say so
                // rather than letting the order look arbitrary.
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-primary-foreground">
                  {t('admin.mainImage')}
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => remove(image.id)}
                aria-label={t('admin.removeImage', { name: image.originalName })}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-muted-foreground backdrop-blur transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
              </button>

              <div className="p-2.5">
                <p className="truncate text-xs text-muted-foreground" title={image.originalName}>
                  {image.originalName}
                </p>
                <p className="mt-0.5 text-[0.7rem] text-muted-foreground" dir="ltr">
                  {image.compressed.keptOriginal ? (
                    t('admin.keptOriginal', { size: formatBytes(image.compressed.compressedBytes) })
                  ) : (
                    <>
                      {formatBytes(image.compressed.originalBytes)} →{' '}
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {formatBytes(image.compressed.compressedBytes)}
                      </span>
                    </>
                  )}
                </p>
                <p className="text-[0.7rem] text-muted-foreground" dir="ltr">
                  {image.compressed.width}×{image.compressed.height} · {image.compressed.extension.toUpperCase()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {failures.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {failures.map((failure) => (
            <li
              key={failure.name}
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
              <span>
                <span className="font-medium">{failure.name}</span> —{' '}
                {t(`admin.compressErrors.${failure.code}`)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => void handleFiles(event.target.files)}
          className="hidden"
          /* No `id`: the input is opened through the ref below rather than a
             label, and an id derived from the C-number would duplicate across two
             variants that (briefly) share one. */
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy !== null}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          )}
          {busy
            ? t('admin.compressing', { done: busy.done, total: busy.total })
            : t('admin.addImages')}
        </Button>

        {images.length > 0 && totalOriginal > totalCompressed ? (
          <p className="text-xs text-muted-foreground" dir="ltr">
            {t('admin.totalSaved', {
              from: formatBytes(totalOriginal),
              to: formatBytes(totalCompressed),
              percent: Math.round((1 - totalCompressed / totalOriginal) * 100),
            })}
          </p>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{t('admin.imageHint')}</p>
    </div>
  );
}

/* ── Videos ────────────────────────────────────────────────────────────────── */

export type PickedVideo = {
  id: string;
  file: File;
  inspected: InspectedVideo;
  previewUrl: string;
};

export function VideoPicker({
  videos,
  onChange,
  label,
}: {
  videos: PickedVideo[];
  onChange: (next: PickedVideo[]) => void;
  label: string;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<VideoErrorCode | null>(null);

  const liveUrls = useRef<Set<string>>(new Set());
  useEffect(() => {
    const urls = liveUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const handleFiles = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    setErrorCode(null);
    setBusy(true);

    try {
      const inspected = await inspectVideo(file);
      // Preview the poster where one could be extracted, otherwise the video
      // itself — a black tile with no indication of content is worse than either.
      const previewUrl = inspected.poster
        ? URL.createObjectURL(inspected.poster.blob)
        : URL.createObjectURL(file);

      liveUrls.current.add(previewUrl);
      onChange([...videos, { id: crypto.randomUUID(), file, inspected, previewUrl }]);
    } catch (error) {
      setErrorCode(
        error && typeof error === 'object' && 'code' in error
          ? (error as { code: VideoErrorCode }).code
          : 'decode-failed',
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (id: string) => {
    const target = videos.find((video) => video.id === id);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
      liveUrls.current.delete(target.previewUrl);
    }
    onChange(videos.filter((video) => video.id !== id));
  };

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{t('common.optional')}</span>
      </div>

      {videos.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {videos.map((video) => (
            <li
              key={video.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5"
            >
              <span className="block h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                <img src={video.previewUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground" title={video.file.name}>
                  {video.file.name}
                </p>
                <p className="mt-0.5 text-[0.7rem] text-muted-foreground" dir="ltr">
                  {formatDuration(video.inspected.durationSeconds)} ·{' '}
                  {video.inspected.width}×{video.inspected.height} ·{' '}
                  {formatBytes(video.inspected.bytes)}
                </p>

                {video.inspected.compatibilityWarning ? (
                  <p className="mt-1 text-[0.7rem] text-amber-600 dark:text-amber-400">
                    {t('admin.videoCompatWarning')}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => remove(video.id)}
                aria-label={t('admin.removeVideo', { name: video.file.name })}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {errorCode ? (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          {t(`admin.videoErrors.${errorCode}`)}
        </p>
      ) : null}

      <div className="mt-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_VIDEO_TYPES.join(',')}
          onChange={(event) => void handleFiles(event.target.files)}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <VideoIcon className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          )}
          {busy ? t('admin.readingVideo') : t('admin.addVideo')}
        </Button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {t('admin.videoHint', { seconds: MAX_VIDEO_SECONDS })}
      </p>
    </div>
  );
}
