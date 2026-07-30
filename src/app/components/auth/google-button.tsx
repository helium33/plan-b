/**
 * Google sign-in button.
 *
 * The mark is inlined as SVG rather than loaded from Google's CDN: one less
 * network dependency on the critical sign-in path, it renders offline, and it
 * cannot be blocked by a tracker blocker — a button with a missing logo reads
 * as a broken page precisely where trust matters most.
 *
 * Colours are Google's own and are exempt from theming; recolouring the mark
 * breaches their brand terms and makes it look counterfeit.
 */
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';

export function GoogleButton({
  onClick,
  loading,
  disabled,
  label,
}: {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Override the default "Continue with Google". */
  label?: string;
}) {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <GoogleMark />
      )}
      {label ?? t('auth.continueWithGoogle')}
    </Button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.86c2.26-2.08 3.6-5.15 3.6-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.87-3a7.2 7.2 0 0 1-10.72-3.78H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.35 14.3a7.2 7.2 0 0 1 0-4.6V6.62H1.4a12.01 12.01 0 0 0 0 10.76l3.95-3.08Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.6 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.4 6.62l3.95 3.08A7.2 7.2 0 0 1 12 4.75Z"
      />
    </svg>
  );
}
