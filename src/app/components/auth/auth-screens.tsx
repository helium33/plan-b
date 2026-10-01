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

import { BrandGreeting } from '@/app/components/brand/brand-greeting';
import { BRAND_LOGO_COLOR } from '@/app/components/brand/brand-logo';
import { cn } from '@/app/components/ui/utils';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';

/** Shown under the logo on the sign-in screen. Exactly as specified. */
export const WELCOME_MESSAGE = 'Plan B မိသားစုမှ ဝင်ရောက်ကြည့်ရှုပေးတဲ့အတွက် ကျေးဇူးတင်ပါတယ်';

/** Shown under the logo as a session ends. Exactly as specified. */
export const GOODBYE_MESSAGE = 'Plan B မိသားစုမှ နှုတ်ဆက်လိုက်ပါသည်';

/** How long the goodbye holds before fading — long enough to read one line. */
const GOODBYE_HOLD_MS = 2_800;

/** Matches `duration-500` on the fade below. */
const GOODBYE_FADE_MS = 500;

/**
 * The sign-in screen: the whole screen in the logo's own slate teal, the logo on
 * it, the welcome line in white, and the form on a white card beneath — the
 * same colour the goodbye screen fades out on, so arriving and leaving read as
 * one pair.
 */
export function WelcomeScreen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div
      style={{ backgroundColor: BRAND_LOGO_COLOR }}
      className="flex min-h-dvh flex-col items-center justify-center px-5 py-10"
    >
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <BrandGreeting message={WELCOME_MESSAGE} as="h1" />

        <div className="mt-7 w-full rounded-3xl bg-card p-5 text-left text-card-foreground shadow-xl">
          {children}
          {footer ? <div className="flex justify-center">{footer}</div> : null}
        </div>
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
      <BrandGreeting message={GOODBYE_MESSAGE} mood="goodbye" />
    </div>
  );
}
