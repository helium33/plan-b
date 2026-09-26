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
 * ── Why it renders its own wordmark ────────────────────────────────────────
 * The shared `Logo` is built for a 32px bar: mark, name, and a muted tagline in
 * theme colours. This is a full-screen brand plate in one fixed colour, and the
 * B sits in a knocked-out pill the way it does on the shop's own signage. The
 * two have almost nothing in common beyond the letters, so this draws its own
 * rather than bending `Logo` with props that only one caller would ever pass.
 */
import { useEffect, useRef, useState } from 'react';

import { LogoMark } from '@/app/components/common/logo';
import { cn } from '@/app/components/ui/utils';
import { useOnboardingStore } from '@/app/stores/onboarding-store';

const SESSION_KEY = 'pbw-splash-shown';

/** How long the plate holds after the logo lands. */
const HOLD_MS = 1_600;

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
      className={cn(
        'fixed inset-0 z-[100] grid place-items-center bg-brand-600 transition-opacity duration-500',
        phase === 'out' ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      <div className="px-6 text-center motion-safe:animate-[pbwSplashDrop_0.85s_cubic-bezier(0.34,1.3,0.64,1)_both]">
        <LogoMark className="mx-auto h-10 w-20 text-white/90" />

        <p className="mt-5 flex items-center justify-center gap-2 text-3xl font-black tracking-[0.12em] text-white sm:text-4xl">
          PLAN
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-3xl leading-none text-brand-600 sm:h-12 sm:w-12 sm:text-4xl">
            B
          </span>
          VISION
        </p>

        <p className="mt-4 text-[0.7rem] font-medium tracking-[0.42em] text-white/75 motion-safe:animate-[pbwSplashRise_0.5s_ease-out_0.45s_both]">
          EYEWEARS
        </p>
      </div>
    </div>
  );
}
