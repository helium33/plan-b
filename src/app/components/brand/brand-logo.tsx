/**
 * PLAN B VISION EYEWEARS — the full brand lockup.
 *
 * Drawn in markup and SVG rather than shipped as an image, the same way the
 * POS draws it (`src/components/brand/BrandLogo.jsx` in helium33/visionary), so
 * both apps greet a person with the same mark: "PLAN" between two rules, the
 * glasses-B — two lens rings stacked on a spine — then "VISION" over a tracked
 * "EYEWEARS". White on the logo's own slate teal.
 *
 * The plate colour is fixed rather than themed. The theme's `--brand-600` is
 * within a shade of it and follows dark mode; the logo is a printed mark and
 * should look the same on every screen it appears on.
 *
 * `BrandLogo` is the lockup for full-screen moments — opening the app,
 * sign-in, sign-out. `BrandBadge` is the same mark cut down for a 32px bar:
 * the glasses-B on its plate, with "PLAN B" over "VISION" beside it.
 */
import { cn } from '@/app/components/ui/utils';

/** The logo's plate colour, exactly. */
export const BRAND_LOGO_COLOR = '#577A88';

/** The "B": two lens rings on a vertical spine, tangent where the spine ends. */
export function GlassesMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 56" className={className} fill="none" aria-hidden="true">
      <rect x="3" y="3" width="5" height="50" rx="2.5" fill="currentColor" />
      <circle cx="17" cy="15.5" r="12.5" stroke="currentColor" strokeWidth="4" />
      <circle cx="17" cy="40.5" r="12.5" stroke="currentColor" strokeWidth="4" />
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
        'inline-flex items-center gap-3 rounded-3xl px-6 py-4 text-white shadow-lg sm:gap-4 sm:px-8 sm:py-5',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-1.5">
        <span className="h-px w-10 bg-white/70 sm:w-12" aria-hidden="true" />
        <span className="text-xl font-extrabold tracking-wide sm:text-2xl">PLAN</span>
        <span className="h-px w-10 bg-white/70 sm:w-12" aria-hidden="true" />
      </div>

      <GlassesMark className="h-12 w-7 shrink-0 sm:h-14 sm:w-8" />

      <div className="flex flex-col items-start">
        <span className="text-xl font-extrabold tracking-wide sm:text-2xl">VISION</span>
        <span className="text-[0.6rem] font-semibold tracking-[0.3em] text-white/90">EYEWEARS</span>
      </div>
    </div>
  );
}

/**
 * The compact lockup for headers, the sidebar and the voucher letterhead.
 *
 * `tone="light"` is for use on the logo colour itself (the voucher's
 * letterhead), where the words go white and the plate goes translucent.
 */
export function BrandBadge({
  className,
  tone = 'default',
  markOnly = false,
}: {
  className?: string;
  tone?: 'default' | 'light';
  markOnly?: boolean;
}) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <span
        style={tone === 'default' ? { backgroundColor: BRAND_LOGO_COLOR } : undefined}
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-sm',
          tone === 'light' && 'bg-white/15',
        )}
      >
        <GlassesMark className="h-6 w-4" />
      </span>

      {markOnly ? null : (
        <span className="flex min-w-0 flex-col leading-none">
          <span
            className={cn(
              'truncate text-[0.95rem] font-extrabold tracking-wide',
              // The plate colour is too dark to read on the dark theme.
              tone === 'light' ? 'text-white' : 'text-[#577A88] dark:text-white',
            )}
          >
            PLAN B
          </span>
          <span
            className={cn(
              'mt-1 truncate text-[0.6rem] font-bold tracking-[0.28em]',
              tone === 'light' ? 'text-white/75' : 'text-muted-foreground',
            )}
          >
            VISION
          </span>
        </span>
      )}
    </span>
  );
}
