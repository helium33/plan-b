/**
 * Attribute pickers for the upload form.
 *
 * The brief is explicit that these must be dropdown-only, with no manual typing —
 * and the reason is worth restating: a hand-typed "Tortoise Shell" against a
 * stored "Tortoiseshell" produces a shop filter that silently matches nothing,
 * and the bug is invisible until a customer notices an empty page. Every value
 * here comes from `lib/attributes.ts`, so a typo is impossible by construction.
 *
 * Single-value attributes use a real `<select>`; multi-value ones use toggle
 * chips, because a native multiple-select is close to unusable on a phone and the
 * shop will be uploading from one.
 */
import { useId } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/components/ui/utils';

/* ── Single select ─────────────────────────────────────────────────────────── */

export function SingleSelect<T extends string>({
  label,
  value,
  options,
  optionLabel,
  onChange,
  required,
  hint,
}: {
  label: string;
  value: T;
  options: readonly T[];
  /** Maps a stored value to its translated label. */
  optionLabel: (value: T) => string;
  onChange: (value: T) => void;
  required?: boolean;
  hint?: string;
}) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </label>

      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabel(option)}
          </option>
        ))}
      </select>

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/* ── Multi select ──────────────────────────────────────────────────────────── */

export function MultiSelect<T extends string>({
  label,
  values,
  options,
  optionLabel,
  onChange,
  required,
  hint,
  error,
}: {
  label: string;
  values: T[];
  options: readonly T[];
  optionLabel: (value: T) => string;
  onChange: (values: T[]) => void;
  required?: boolean;
  hint?: string;
  error?: string | null;
}) {
  const { t } = useTranslation();

  const toggle = (option: T) => {
    onChange(
      values.includes(option) ? values.filter((value) => value !== option) : [...values, option],
    );
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </legend>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option);

          return (
            <button
              key={option}
              type="button"
              // `aria-pressed` rather than a checkbox group: these are toggles,
              // and the pressed state is what a screen reader should announce.
              aria-pressed={selected}
              onClick={() => toggle(option)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-brand-300 hover:text-foreground dark:hover:border-brand-700',
              )}
            >
              {selected ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /> : null}
              {optionLabel(option)}
            </button>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}

      {values.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {t('admin.selectedCount', { count: values.length })}
        </p>
      ) : null}
    </fieldset>
  );
}
