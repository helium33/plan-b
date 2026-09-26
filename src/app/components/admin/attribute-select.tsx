/**
 * The attribute picker for the upload form.
 *
 * Dropdown-only, with no manual typing. A hand-typed "Tit" against a stored
 * "Titanium" produces a catalogue filter that silently matches nothing, and the
 * bug is invisible until a buyer notices an empty grid. Every value here comes
 * from `lib/attributes.ts`, so a typo is impossible by construction.
 *
 * A native `<select>` rather than chips: both wholesale attributes are
 * single-valued, and a `<select>` gets the phone's own picker for free.
 */
import { useId } from 'react';

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
