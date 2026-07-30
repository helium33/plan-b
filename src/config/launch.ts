/**
 * The "New Arrivals" launch teaser.
 *
 * ── Edit `LAUNCH_TARGET_ISO` to set the real date ─────────────────────────
 * Until a date is fixed, the target is computed as a fixed number of days from
 * a **pinned base date** rather than from `Date.now()`. That difference matters:
 * a target of "30 days from now" recomputes on every page load, so the countdown
 * would never actually reach zero and the launched state could never be seen or
 * tested. Pinning the base makes the deadline real, just provisional.
 */

/** Pinned so the placeholder deadline is a fixed instant, not a moving one. */
const PLACEHOLDER_BASE = Date.UTC(2026, 6, 29); // 29 July 2026
const PLACEHOLDER_DAYS_AHEAD = 30;

/**
 * When the collection goes live, as an ISO 8601 instant.
 *
 * Includes the `+06:30` offset explicitly so the deadline means the same moment
 * everywhere. Written as a bare string once a real date is known, e.g.
 * `'2026-09-15T10:00:00+06:30'`.
 */
export const LAUNCH_TARGET_ISO: string = new Date(
  PLACEHOLDER_BASE + PLACEHOLDER_DAYS_AHEAD * 86_400_000,
)
  .toISOString()
  // Rebase UTC midnight onto a 10:00 Yangon opening, which is when a shop would
  // realistically drop a collection.
  .replace(/T.*/, 'T10:00:00+06:30');

export const LAUNCH = {
  targetIso: LAUNCH_TARGET_ISO,

  /**
   * Internal name for the drop. Customer-facing copy lives in the locale files;
   * this is the identifier used in analytics and the teaser's key.
   */
  collectionId: 'monsoon-2026',

  /**
   * Whether to show the teaser at all. Set to false to hide it without
   * deleting the configuration, e.g. between collections.
   */
  enabled: true,

  /** Frames in the drop, once the catalogue has them. Empty is handled. */
  previewFrameIds: [] as string[],
} as const;

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** True once the target has passed. */
  launched: boolean;
  /** Whole milliseconds remaining, clamped at zero. */
  remainingMs: number;
};

/**
 * Splits the time until `targetIso` into display units.
 *
 * Pure and takes `now` as an argument so the boundary cases — one second out,
 * exactly zero, long past — can be tested without waiting for them.
 */
export function countdownTo(targetIso: string, now: Date = new Date()): CountdownParts {
  const target = new Date(targetIso).getTime();

  // An unparseable date must not render `NaN` days. Treating it as launched
  // hides the teaser, which is the safer failure: a broken countdown on the
  // home page is worse than no countdown.
  if (Number.isNaN(target)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, launched: true, remainingMs: 0 };
  }

  const remainingMs = Math.max(0, target - now.getTime());
  if (remainingMs === 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, launched: true, remainingMs: 0 };
  }

  const totalSeconds = Math.floor(remainingMs / 1000);

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    launched: false,
    remainingMs,
  };
}
