/**
 * The Plan B Vision splash, shown once when the app opens.
 *
 * ── Once per tab, not once per navigation ──────────────────────────────────
 * Gated on `sessionStorage`, so the buyer sees it when they open the link and
 * never again while that tab lives. A splash on every mount would mean two and
 * a half seconds of logo between the catalogue and the voucher, on a screen
 * people bounce between constantly — which turns a brand moment into a tax.
 *
 * `sessionStorage` rather than `localStorage` on purpose: coming back tomorrow
 * should feel like opening the app, and coming back from the voucher should not.
 *
 * ── What it shows ──────────────────────────────────────────────────────────
 * The Plan B Vision logo and the family's welcome line, animated by
 * `BrandGreeting` — the same moment the sign-in and goodbye screens use, so
 * opening the app, signing in and leaving all greet a person the same way.
 */
import { useEffect, useRef, useState } from 'react';

import { WELCOME_MESSAGE } from '@/app/components/auth/auth-screens';
import { BrandGreeting } from '@/app/components/brand/brand-greeting';
import { BRAND_LOGO_COLOR } from '@/app/components/brand/brand-logo';
import { cn } from '@/app/components/ui/utils';
import { useOnboardingStore } from '@/app/stores/onboarding-store';

const SESSION_KEY = 'pbw-splash-shown';

/** Long enough for the greeting to finish arriving and be read once. */
const HOLD_MS = 2_600;

/** Must match the `duration-500` on the exit transition below. */
const FADE_MS = 500;

/**
 * Whether this tab has already had its splash.
 *
 * Wrapped because Safari in private mode throws on `sessionStorage` access
 * rather than returning null, and a brand animation is not worth a white screen.
 */
function alreadyShown(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markShown(): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* Nothing to do — worst case the splash plays again next navigation. */
  }
}

export function SplashScreen() {
  const finishSplash = useOnboardingStore((s) => s.finishSplash);

  // Read once, in the initialiser, so the value cannot change between the first
  // render and the effect below and leave the plate up with no timer behind it.
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>(() =>
    alreadyShown() ? 'gone' : 'in',
  );

  // The store setter is stable, but depending on it directly would still re-run
  // this effect if that ever stopped being true — and re-running it would
  // restart the timer mid-fade.
  const finish = useRef(finishSplash);
  finish.current = finishSplash;

  useEffect(() => {
    if (phase === 'gone') {
      // The already-shown path. The walkthrough is waiting on `splashDone`, so
      // releasing it here is what stops this component from deadlocking it.
      finish.current();
      return;
    }

    if (phase === 'out') {
      const done = window.setTimeout(() => {
        setPhase('gone');
        finish.current();
      }, FADE_MS);
      return () => window.clearTimeout(done);
    }

    markShown();
    const leave = window.setTimeout(() => setPhase('out'), HOLD_MS);
    return () => window.clearTimeout(leave);
  }, [phase]);

  if (phase === 'gone') return null;

  return (
    <div
      // `aria-hidden` and no live region: this announces nothing a screen-reader
      // user needs, and the page behind it is already being read.
      aria-hidden="true"
      style={{ backgroundColor: BRAND_LOGO_COLOR }}
      className={cn(
        'fixed inset-0 z-[100] grid place-items-center px-6 transition-opacity duration-500',
        phase === 'out' ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      <BrandGreeting message={WELCOME_MESSAGE} />
    </div>
  );
}
