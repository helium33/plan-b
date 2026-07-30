/**
 * Segmented control for choosing an auth method, plus the "or" divider.
 *
 * Built on a `radiogroup` rather than Radix Tabs: the panels below are separate
 * forms with their own submit buttons and validation, and nesting a form inside
 * a tab panel breaks the browser's implicit-submission behaviour (Enter in a
 * field should submit *that* form). Arrow-key navigation and `aria-checked` come
 * for free with the radio semantics.
 */
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

import { cn } from '@/app/components/ui/utils';

export type MethodOption<T extends string> = {
  value: T;
  label: string;
  icon: LucideIcon;
};

export function MethodTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<MethodOption<T>>;
}) {
  return (
    <div
      role="radiogroup"
      className="grid gap-1 rounded-xl border border-border bg-muted/50 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const active = optionValue === value;

        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(optionValue)}
            className={cn(
              'relative flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active ? (
              // Shared layout id slides the pill between options instead of
              // cross-fading two separate backgrounds.
              <motion.span
                layoutId="auth-method-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                className="absolute inset-0 rounded-lg bg-card shadow-sm"
              />
            ) : null}

            <Icon className="relative h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Horizontal rule with a centred label, for "or continue with". */
export function Divider({ label }: { label: string }) {
  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-background px-3 text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
