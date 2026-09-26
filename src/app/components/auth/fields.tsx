/**
 * Form fields shared by the staff sign-in screen and the admin upload form.
 *
 * Each one owns its own label/description/error wiring via `aria-describedby`
 * and `aria-invalid`, because that is exactly the plumbing that gets forgotten
 * when a field is hand-rolled per page — and a validation message a screen
 * reader never announces is not a validation message.
 */
import { type ReactNode, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { cn } from '@/app/components/ui/utils';

type FieldShellProps = {
  label: string;
  error?: string | null;
  hint?: ReactNode;
  required?: boolean;
  children: (ids: { inputId: string; describedBy: string | undefined }) => ReactNode;
};

/**
 * Label + control + hint/error, with the id juggling done once.
 *
 * The error replaces the hint rather than stacking below it: two messages under
 * one input makes the customer decide which applies to them.
 */
function FieldShell({ label, error, hint, required, children }: FieldShellProps) {
  const inputId = useId();
  const messageId = `${inputId}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>

      {children({ inputId, describedBy: hasMessage ? messageId : undefined })}

      {hasMessage ? (
        <p
          id={messageId}
          // `role="alert"` only when there is an error, so a static hint is not
          // announced as an interruption every time the field mounts.
          role={error ? 'alert' : undefined}
          className={cn(
            'text-xs leading-relaxed',
            error ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {error || hint}
        </p>
      ) : null}
    </div>
  );
}

/* ── Text ──────────────────────────────────────────────────────────────────── */

export type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email';
  placeholder?: string;
  error?: string | null;
  hint?: ReactNode;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  autoFocus?: boolean;
};

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  hint,
  required,
  autoComplete,
  disabled,
  autoFocus,
}: TextFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={required}>
      {({ inputId, describedBy }) => (
        <Input
          id={inputId}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
      )}
    </FieldShell>
  );
}

/* ── Password ──────────────────────────────────────────────────────────────── */

export type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: ReactNode;
  autoComplete?: 'current-password' | 'new-password';
  disabled?: boolean;
};

/**
 * Password input with a reveal toggle.
 *
 * Worth the extra control: the alternative to letting someone check what they
 * typed is a failed sign-in they cannot explain, and on a phone keyboard with a
 * Burmese layout switch mid-entry that is common rather than rare.
 */
export function PasswordField({
  label,
  value,
  onChange,
  error,
  hint,
  autoComplete = 'current-password',
  disabled,
}: PasswordFieldProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <FieldShell label={label} error={error} hint={hint} required>
      {({ inputId, describedBy }) => (
        <div className="relative">
          <Input
            id={inputId}
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoComplete={autoComplete}
            disabled={disabled}
            className="pr-10"
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
          />

          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            // Excluded from the tab order deliberately — it sits between the
            // password and the submit button, and stopping every keyboard user
            // there on the way to signing in is a poor trade.
            tabIndex={-1}
            aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
            className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {visible ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.9} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.9} />
            )}
          </button>
        </div>
      )}
    </FieldShell>
  );
}
