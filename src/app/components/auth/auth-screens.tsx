/**
 * The two brand moments around a session: the welcome at sign-in, and the
 * goodbye at sign-out.
 *
 * ── Why the two sentences are constants, not translations ──────────────────
 * They are the family's own words, specified exactly, and they are shown in
 * Burmese whichever language the rest of the app is in — the way a shop's
 * signage does not change with the customer. Putting them in the locale files
 * would invite a "translation" of the English bundle to replace them, so they
 * live here, once, and nothing else renders them.
 *
 * ── The goodbye is a route, not a dialog ───────────────────────────────────
 * Signing out *navigates* to `/goodbye`, and that screen does the signing out.
 * Doing it the other way round — sign out, then show an overlay — races the
 * route guards: the moment the session ends, a guarded page redirects to the
 * sign-in screen and the goodbye is unmounted before anyone sees it. As a route
 * it sits outside every guard, so it plays in full and then hands over to the
 * welcome screen itself.
 */
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BRAND_LOGO_COLOR, BrandLogo } from '@/app/components/brand/brand-logo';
import { cn } from '@/app/components/ui/utils';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';

/** Shown under the logo on the sign-in screen. Exactly as specified. */
export const WELCOME_MESSAGE = 'Plan B မိသားစုမှ ဝင်ရောက်ကြည့်ရှုပေးတဲ့အတွက် ကျေးဇူးတင်ပါတယ်';

/** Shown under the logo as a session ends. Exactly as specified. */
export const GOODBYE_MESSAGE = 'Plan B မိသားစုမှ နှုတ်ဆက်လိုက်ပါသည်';

/** How long the goodbye holds before fading — long enough to read one line. */
const GOODBYE_HOLD_MS = 2_200;

/** Matches `duration-500` on the fade below. */
const GOODBYE_FADE_MS = 500;

/**
 * The sign-in screen's frame: logo, welcome line, then whatever form or
 * account card the page puts inside it. Full height and centred, on the plain
 * background the rest of the app uses — the logo carries the colour.
 */
export function WelcomeScreen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 py-10">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <BrandLogo className="motion-safe:animate-[pbwSplashDrop_0.85s_cubic-bezier(0.34,1.3,0.64,1)_both]" />

        <h1
          lang="my"
          className="mt-7 font-myanmar text-[1.05rem] font-semibold leading-[1.9] text-foreground motion-safe:animate-[pbwSplashRise_0.5s_ease-out_0.35s_both]"
        >
          {WELCOME_MESSAGE}
        </h1>

        <div className="mt-8 w-full text-left">{children}</div>

        {footer}
      </div>
    </div>
  );
}

/**
 * `/goodbye` — ends the session, says goodbye, then shows the sign-in screen.
 *
 * The session ends on arrival, not after the animation: someone who closes the
 * tab halfway through the goodbye must still be signed out.
 */
export function GoodbyeScreen() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [leaving, setLeaving] = useState(false);

  // Held in a ref so the effect runs once per mount. `signOut` is stable, but
  // re-running this effect would restart the timers mid-fade.
  const endSession = useRef(signOut);

  useEffect(() => {
    // A failed sign-out is vanishingly rare (it is a local operation) and the
    // sign-in screen shows whoever is still signed in, so there is nothing
    // useful to say about it here.
    endSession.current().catch(() => undefined);

    const fade = window.setTimeout(() => setLeaving(true), GOODBYE_HOLD_MS);
    const leave = window.setTimeout(
      () => navigate(ROUTES.signIn, { replace: true }),
      GOODBYE_HOLD_MS + GOODBYE_FADE_MS,
    );

    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(leave);
    };
  }, [navigate]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ backgroundColor: BRAND_LOGO_COLOR }}
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 text-center transition-opacity duration-500',
        leaving ? 'opacity-0' : 'opacity-100',
      )}
    >
      {/* On its own colour the logo's plate disappears and the mark reads
          exactly as it does on the shop's signage. */}
      <BrandLogo className="shadow-none motion-safe:animate-[pbwSplashDrop_0.85s_cubic-bezier(0.34,1.3,0.64,1)_both]" />

      <p
        lang="my"
        className="mt-6 max-w-xs font-myanmar text-lg font-semibold leading-[1.9] text-white motion-safe:animate-[pbwSplashRise_0.5s_ease-out_0.4s_both]"
      >
        {GOODBYE_MESSAGE}
      </p>
    </div>
  );
}
