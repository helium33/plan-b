import { Link } from 'react-router-dom';

import { cn } from '@/app/components/ui/utils';

/**
 * Wordmark + monogram. The mark is two overlapping lenses joined by a bridge —
 * drawn in SVG rather than shipped as an asset so it inherits `currentColor`
 * and stays crisp in both themes.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 20"
      role="presentation"
      aria-hidden="true"
      className={cn('h-5 w-10', className)}
      fill="none"
      strokeWidth={2}
      stroke="currentColor"
      strokeLinecap="round"
    >
      <circle cx="9" cy="10" r="7.2" />
      <circle cx="31" cy="10" r="7.2" />
      {/* Bridge */}
      <path d="M16.2 9.2c1.3-1.1 2.4-1.6 3.8-1.6s2.5.5 3.8 1.6" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  /** Hides the wordmark, leaving only the monogram — for tight mobile bars. */
  markOnly?: boolean;
}

export function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <Link
      to="/"
      className={cn(
        'group flex items-center gap-2.5 rounded-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background',
        className,
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm transition-transform duration-300 group-hover:scale-[1.04]">
        <LogoMark className="h-4 w-7" />
      </span>

      {!markOnly && (
        <span className="flex flex-col leading-none">
          <span className="text-[0.95rem] font-semibold tracking-tight text-foreground">
            Plan B <span className="text-primary">Vision</span>
          </span>
          <span className="mt-0.5 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Optical
          </span>
        </span>
      )}
    </Link>
  );
}
