/**
 * PLAN B VISION EYEWEARS — the brand lockup.
 *
 * The real mark, traced from the owner's logo artwork (see `brand-art.ts`):
 * "PLAN" between two rules, the "B" drawn as a pair of sunglasses, "VISION"
 * over a tracked "EYEWEARS", white on the logo's own slate teal. It replaced
 * a lookalike set in a web font, which the owner rightly said was not their
 * logo.
 *
 * The plate colour is fixed rather than themed. The theme's `--brand-600` is
 * within a shade of it and follows dark mode; the logo is a printed mark and
 * should look the same on every screen it appears on.
 *
 * `BrandLogo` is the lockup for full-screen moments — opening the app,
 * sign-in, sign-out. `BrandBadge` is the same plate cut down for a bar, and
 * `GlassesMark` is the B on its own, for places with room for one letter.
 */
import { cn } from '@/app/components/ui/utils';

import { B_MARK_PATH, B_MARK_VIEWBOX, LOGO_VIEWBOX, WORDMARK_PATH } from './brand-art';

/** The logo's plate colour, sampled from the owner's artwork. */
export const BRAND_LOGO_COLOR = '#568595';

/** The words, the rules and the B, in `currentColor`. */
export function LogoArt({ className }: { className?: string }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d={WORDMARK_PATH} />
      <path fillRule="evenodd" d={B_MARK_PATH} />
    </svg>
  );
}

/** The sunglasses "B" on its own, in `currentColor`. */
export function GlassesMark({ className }: { className?: string }) {
  return (
    <svg viewBox={B_MARK_VIEWBOX} className={className} fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d={B_MARK_PATH} />
    </svg>
  );
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Plan B Vision Eyewears"
      style={{ backgroundColor: BRAND_LOGO_COLOR }}
      className={cn(
        'inline-flex items-center justify-center rounded-3xl px-7 py-6 text-white shadow-lg sm:px-9 sm:py-7',
        className,
      )}
    >
      <LogoArt className="h-[3.75rem] w-auto sm:h-[4.5rem]" />
    </div>
  );
}

/**
 * The compact lockup for headers and the sidebar: the same white mark on the
 * same plate, sized for a bar. `markOnly` keeps just the B, for a square.
 */
export function BrandBadge({
  className,
  markOnly = false,
}: {
  className?: string;
  markOnly?: boolean;
}) {
  return (
    <span
      role="img"
      aria-label="Plan B Vision Eyewears"
      style={{ backgroundColor: BRAND_LOGO_COLOR }}
      className={cn(
        'inline-flex h-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm',
        markOnly ? 'w-10' : 'px-2.5',
        className,
      )}
    >
      {markOnly ? <GlassesMark className="h-7 w-auto" /> : <LogoArt className="h-7 w-auto" />}
    </span>
  );
}
