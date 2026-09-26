/**
 * The Pinky Beauty design primitives.
 *
 * ── Why this theme is self-contained ───────────────────────────────────────
 * The wholesale app runs on CSS variables that follow the OS light/dark
 * preference. Pinky Beauty is a fixed soft-pink identity — a "dark mode" version
 * of a blush-and-white aesthetic is a different brand, not the same one dimmed.
 * So these components use literal palette values rather than the shared tokens,
 * which keeps the two visual systems from bleeding into each other in either
 * direction.
 *
 * Palette, per the brief:
 *   Hot pink   #ff2a85   Soft pink bg  #fff5f8
 *   Card       #ffffff   Text          #2d1f2d   Muted  #8c7a8b
 */
import type { ReactNode } from 'react';

import { cn } from '@/app/components/ui/utils';

export const PINK = {
  hot: '#ff2a85',
  hotHover: '#e02072',
  soft: '#fff5f8',
  tint: '#fdf2f7',
  ink: '#2d1f2d',
  muted: '#8c7a8b',
} as const;

/** Serif for headings, per the brief. Falls back cleanly if Playfair is blocked. */
export const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";

/* ── Card ──────────────────────────────────────────────────────────────────── */

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-pink-100 bg-white shadow-sm shadow-pink-100/50',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── Headings ──────────────────────────────────────────────────────────────── */

export function Heading({
  as: Tag = 'h2',
  className,
  children,
}: {
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      style={{ fontFamily: SERIF }}
      className={cn('font-bold tracking-tight text-[#2d1f2d]', className)}
    >
      {children}
    </Tag>
  );
}

/* ── Button ────────────────────────────────────────────────────────────────── */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'soft' | 'outline' | 'ghost';
  block?: boolean;
};

export function PinkButton({
  variant = 'primary',
  block,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        // 44px floor throughout: this is a phone-first storefront and every one
        // of these is tapped with a thumb.
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85] focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'bg-[#ff2a85] text-white shadow-lg shadow-pink-300/60 hover:bg-[#e02072]',
        variant === 'soft' && 'bg-pink-100 text-[#ff2a85] hover:bg-pink-200',
        variant === 'outline' &&
          'border border-pink-200 bg-white text-[#2d1f2d] hover:border-[#ff2a85]',
        variant === 'ghost' && 'text-[#8c7a8b] hover:text-[#ff2a85]',
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ── Field ─────────────────────────────────────────────────────────────────── */

export function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (props: { id: string; describedBy?: string }) => ReactNode;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const messageId = `${id}-msg`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-[#2d1f2d]">
        {label}
        {required ? <span className="ml-0.5 text-[#ff2a85]">*</span> : null}
      </label>

      {children({ id, describedBy: hasMessage ? messageId : undefined })}

      {hasMessage ? (
        <p
          id={messageId}
          // `role="alert"` only when there is an error, so a static hint is not
          // announced as an interruption every time the field mounts.
          role={error ? 'alert' : undefined}
          className={cn('text-[0.7rem]', error ? 'text-rose-600' : 'text-[#8c7a8b]')}
        >
          {error || hint}
        </p>
      ) : null}
    </div>
  );
}

/** Shared input styling, exported so selects and textareas match exactly. */
export const inputClass =
  'w-full min-h-11 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 text-sm text-[#2d1f2d] placeholder:text-[#8c7a8b]/70 focus:border-[#ff2a85] focus:outline-none focus:ring-2 focus:ring-pink-200';

export const inputErrorClass = 'border-rose-300 bg-rose-50/50 focus:border-rose-400';

/* ── Badge ─────────────────────────────────────────────────────────────────── */

export type BadgeTone = 'pink' | 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';

const BADGE_TONES: Record<BadgeTone, string> = {
  pink: 'bg-pink-100 text-[#ff2a85]',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  blue: 'bg-blue-100 text-blue-700',
  slate: 'bg-slate-100 text-slate-600',
};

export function Badge({
  tone = 'pink',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** `13000` → `Ks 13,000`. */
export function ks(amount: number): string {
  return 'Ks ' + new Intl.NumberFormat('en-US').format(Math.round(amount));
}
