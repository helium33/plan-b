/**
 * Form fields shared by every auth screen.
 *
 * Each one owns its own label/description/error wiring via `aria-describedby`
 * and `aria-invalid`, because that is exactly the plumbing that gets forgotten
 * when a field is hand-rolled per page — and a validation message a screen
 * reader never announces is not a validation message.
 */
import { type ReactNode, useId, useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { cn } from '@/app/components/ui/utils';
import { parsePhone } from '@/lib/phone';

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

/* ── Phone ─────────────────────────────────────────────────────────────────── */

export type PhoneFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
};

/**
 * Myanmar phone entry.
 *
 * Accepts every spelling `parsePhone` understands and echoes back the canonical
 * form as the customer types. That echo is the point: the phone number is the
 * membership key, so the moment to confirm we read it the same way they meant it
 * is *before* an SMS is spent, not after it fails to arrive.
 */
export function PhoneField({ value, onChange, error, disabled, autoFocus }: PhoneFieldProps) {
  const { t } = useTranslation();

  const parsed = useMemo(() => parsePhone(value), [value]);

  // `parsePhone` only succeeds on a complete number (8–11 national digits), so
  // success alone is the right gate — the preview cannot flash mid-typing.
  //
  // An earlier version also required `value.replace(/\D/g, '').length >= 8`,
  // which looked like a harmless belt-and-braces check but silently broke the
  // Burmese path: `\D` treats ၀-၉ as non-digits, so a number typed in Myanmar
  // numerals parsed fine and then never showed its confirmation.
  const preview = parsed.ok ? parsed.phone : null;

  return (
    <FieldShell
      label={t('auth.phoneLabel')}
      error={error}
      required
      hint={
        preview ? (
          <span className="text-emerald-600 dark:text-emerald-400" dir="ltr">
            {t('auth.phonePreview', { phone: preview.e164 })}
          </span>
        ) : (
          t('auth.phoneHint')
        )
      }
    >
      {({ inputId, describedBy }) => (
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 grid w-12 place-items-center border-r border-border text-sm text-muted-foreground"
          >
            +95
          </span>

          <Input
            id={inputId}
            // `tel` rather than `number`: a number input strips leading zeros,
            // rejects the `+` and offers a spinner nobody wants on a phone field.
            type="tel"
            inputMode="tel"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={t('auth.phonePlaceholder')}
            autoComplete="tel"
            disabled={disabled}
            autoFocus={autoFocus}
            dir="ltr"
            className="pl-14"
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
          />
        </div>
      )}
    </FieldShell>
  );
}
