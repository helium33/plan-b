/**
 * Selectable option cards for the onboarding steps.
 *
 * A `radiogroup` of large tappable cards rather than a `<select>`. Three reasons:
 * the face-shape step needs to show a drawing, the whole form is used one-handed
 * on a phone far more often than on a laptop, and a native select on Android
 * hides the options behind a modal that makes comparing them impossible.
 *
 * Roving `tabIndex` keeps it a single tab stop, with arrow keys moving between
 * options — the behaviour a screen-reader user expects from a radio group, and
 * what a row of plain buttons would get wrong.
 */
import { type ReactNode, useRef } from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/app/components/ui/utils';

export type Option<T extends string> = {
  value: T;
  label: string;
  description?: string;
  /** Rendered above the label — the face-shape drawings use this. */
  visual?: ReactNode;
};

export function OptionCards<T extends string>({
  options,
  value,
  onChange,
  label,
  columns = 2,
}: {
  options: ReadonlyArray<Option<T>>;
  value: T | null;
  onChange: (value: T) => void;
  /** Accessible name for the group. */
  label: string;
  columns?: 2 | 3;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Arrow keys move the selection, matching native radio behaviour. Selection
   * follows focus here, which is correct for a group where every option is
   * cheap to preview and nothing is submitted until the customer presses Next.
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    const currentIndex = options.findIndex((option) => option.value === value);
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';

    let nextIndex: number;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = options.length - 1;
    else if (currentIndex === -1) nextIndex = 0;
    // Wraps, so holding an arrow key cannot dead-end at either edge.
    else nextIndex = (currentIndex + (forward ? 1 : -1) + options.length) % options.length;

    onChange(options[nextIndex].value);

    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons?.[nextIndex]?.focus();
  };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn(
        'grid gap-3',
        columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2',
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            // Roving tabIndex: one stop for the whole group. Falls back to the
            // first option when nothing is chosen yet, so the group is always
            // reachable.
            tabIndex={selected || (value === null && index === 0) ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              selected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-card hover:border-brand-300 hover:bg-accent/40 dark:hover:border-brand-700',
            )}
          >
            {selected ? (
              <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
              </span>
            ) : null}

            {option.visual ? (
              <span
                className={cn(
                  'transition-colors',
                  selected ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {option.visual}
              </span>
            ) : null}

            <span
              className={cn(
                'text-sm font-medium',
                selected ? 'text-foreground' : 'text-foreground/90',
              )}
            >
              {option.label}
            </span>

            {option.description ? (
              <span className="text-xs leading-relaxed text-muted-foreground">
                {option.description}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
