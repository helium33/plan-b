/**
 * Video validation and poster extraction.
 *
 * ── Why videos are not compressed, when images are ─────────────────────────
 * Transcoding video in a browser means shipping ffmpeg.wasm — roughly 25 MB of
 * WebAssembly, downloaded before the first upload, running single-threaded at a
 * fraction of native speed. For a shop uploading a handful of ten-second clips
 * that trade is not worth it: the wasm payload alone exceeds the videos.
 *
 * So instead of transcoding, this enforces limits and tells the shop plainly what
 * to shoot. Phone cameras can record 720p directly, which is the real fix and
 * costs nothing. If clips ever need genuine re-encoding it belongs in a Cloud
 * Function, where it can run at native speed once per upload rather than on the
 * shop's laptop every time.
 *
 * A poster frame *is* extracted here, because the shop page must show something
 * before a customer chooses to spend mobile data on the video itself.
 */
import { compressImage, type CompressedImage } from '@/lib/media/compress-image';

/** Product clips are short by design — reflections and thickness, not a film. */
export const MAX_VIDEO_SECONDS = 20;

/** ~15 MB is a generous ceiling for 20 seconds of 720p. */
export const MAX_VIDEO_BYTES = 15 * 1024 * 1024;

/**
 * Types every current browser can both play and upload.
 *
 * `video/quicktime` (.mov) is included because it is what an iPhone produces by
 * default, even though Chrome on Android will not play it back. That is a real
 * gap: the file uploads and stores fine but some customers cannot watch it, so
 * the UI warns rather than silently accepting.
 */
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

/** Plays everywhere. Anything else gets a compatibility warning. */
const UNIVERSAL_TYPES = ['video/mp4', 'video/webm'];

export type VideoErrorCode =
  | 'unsupported-type'
  | 'too-large'
  | 'too-long'
  | 'decode-failed';

export class VideoError extends Error {
  constructor(readonly code: VideoErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'VideoError';
  }
}

export type InspectedVideo = {
  durationSeconds: number;
  width: number;
  height: number;
  bytes: number;
  /** Compressed still from partway through the clip, for the poster. */
  poster: CompressedImage | null;
  /**
   * Set when the file will upload but may not play for every customer — an
   * iPhone `.mov`, typically.
   */
  compatibilityWarning: boolean;
};

/**
 * Loads metadata and grabs a poster frame.
 *
 * Everything happens against an object URL rather than reading the file into
 * memory: a 15 MB video does not need to be buffered as an ArrayBuffer just to
 * read its duration.
 */
export async function inspectVideo(file: File): Promise<InspectedVideo> {
  if (file.type && !ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    throw new VideoError('unsupported-type');
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new VideoError('too-large');
  }

  const url = URL.createObjectURL(file);
  const video = document.createElement('video');

  try {
    video.preload = 'metadata';
    // Required for the seek-and-capture below to work without user interaction on
    // mobile Safari, which blocks any unmuted programmatic playback.
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const metadata = await new Promise<{ duration: number; width: number; height: number }>(
      (resolve, reject) => {
        // A file the browser cannot parse fires neither event on some engines, so
        // a timeout is the only way out. 15s is generous for reading a header.
        const timeout = window.setTimeout(
          () => reject(new VideoError('decode-failed')),
          15_000,
        );

        video.onloadedmetadata = () => {
          window.clearTimeout(timeout);
          resolve({
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
          });
        };
        video.onerror = () => {
          window.clearTimeout(timeout);
          reject(new VideoError('decode-failed'));
        };
      },
    );

    // Some containers report Infinity until fully buffered; treat that as unknown
    // rather than rejecting a clip that may well be short.
    const duration = Number.isFinite(metadata.duration) ? metadata.duration : 0;

    if (duration > MAX_VIDEO_SECONDS) {
      throw new VideoError('too-long');
    }

    const poster = await capturePoster(video, duration).catch(() => null);

    return {
      durationSeconds: duration,
      width: metadata.width,
      height: metadata.height,
      bytes: file.size,
      poster,
      compatibilityWarning: Boolean(file.type) && !UNIVERSAL_TYPES.includes(file.type),
    };
  } finally {
    // Clearing `src` before revoking stops Chrome logging a network error for the
    // pending media request.
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

/**
 * Captures a still to use as the poster.
 *
 * Seeks a little way in rather than taking frame zero: the first frame of a phone
 * recording is very often black, mid-autofocus, or the inside of a pocket.
 */
async function capturePoster(
  video: HTMLVideoElement,
  duration: number,
): Promise<CompressedImage | null> {
  const seekTo = duration > 1 ? Math.min(duration * 0.25, 3) : 0;

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new VideoError('decode-failed')), 10_000);

    video.onseeked = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    video.onerror = () => {
      window.clearTimeout(timeout);
      reject(new VideoError('decode-failed'));
    };

    video.currentTime = seekTo;
  });

  if (video.videoWidth === 0 || video.videoHeight === 0) return null;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(video, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.9),
  );
  if (!blob) return null;

  // Routed through the image compressor so the poster gets the same resizing and
  // format treatment as every other image, rather than being a special case.
  return compressImage(new File([blob], 'poster.jpg', { type: 'image/jpeg' }));
}

/** `9.4` → `0:09`. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
