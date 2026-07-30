/**
 * The one way auth failures reach the screen.
 *
 * Takes a translation *key*, never a message, which is what stops a raw
 * `auth/invalid-credential` from ever being rendered — the type makes the
 * correct thing the easy thing.
 *
 * `role="alert"` means the message is announced when it appears, since a
 * customer using a screen reader would otherwise submit a form, hear nothing,
 * and have no idea why they are still on the same page.
 */
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/components/ui/utils';

export function AuthAlert({
  messageKey,
  tone = 'error',
  values,
}: {
  messageKey: string;
  tone?: 'error' | 'success';
  /** Interpolation values, e.g. `{ points: 50 }`. */
  values?: Record<string, string | number>;
}) {
  const { t } = useTranslation();
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-lg border p-3.5 text-sm',
        tone === 'error'
          ? 'border-destructive/30 bg-destructive/5 text-destructive'
          : 'border-emerald-600/30 bg-emerald-600/5 text-emerald-700 dark:text-emerald-400',
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
      {/* `t` is typed against the locale schema and so cannot verify a key
          resolved at runtime. Every key reaching here comes from `ERROR_KEYS` in
          `lib/auth.ts`, and an unmapped code falls back to
          `auth.errors.generic`, so the worst case is a generic sentence rather
          than a raw key on screen. `String` pins the result back to a string,
          which is what i18next returns for every key in these files. */}
      <p className="leading-relaxed">{String(t(messageKey as never, values as never))}</p>
    </div>
  );
}
