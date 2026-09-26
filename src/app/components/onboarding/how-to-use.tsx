/**
 * The "How to order" video, shown on launch until dismissed for good.
 *
 * A narrated clip of the real app — a native Burmese woman's voice walking through
 * sign-in, swiping, choosing a colour, ordering, credit and the on-time
 * discount, with each step captioned on screen. It replaced three animated
 * cartoon scenes, which showed an app that did not quite look like this one.
 * The clip is `public/how-to.mp4`; `VITE_ONBOARDING_VIDEO_URL` swaps in
 * another without a code change.
 *
 * It does not autoplay: a browser only autoplays muted, and a spoken guide
 * with the sound off is no guide. The poster and the player's own big play
 * button make the first tap obvious.
 *
 * ── Why Skip is a large labelled button, not the corner X ──────────────────
 * This audience is shop owners on phones who were handed a link, not app users
 * who know that a grey ✕ in a corner is an escape hatch. The button says so in
 * both languages, and the "Don't show again" toggle beside it is what turns a
 * dismissal into a permanent one — see the note in `onboarding-store.ts` about
 * why those are deliberately separate.
 */
import { useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import { shouldShowWalkthrough, useOnboardingStore } from '@/app/stores/onboarding-store';
import { env } from '@/lib/env';

const VIDEO_URL = env.onboardingVideoUrl || '/how-to.mp4';
const POSTER_URL = env.onboardingPosterUrl || '/how-to-poster.jpg';

export function HowToUseModal() {
  const { t } = useTranslation();

  const state = useOnboardingStore();
  const dismissStore = useOnboardingStore((s) => s.dismiss);

  const [forever, setForever] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  const open = shouldShowWalkthrough(state);

  // The voice must stop with the dialog, not play on behind the catalogue.
  const dismiss = (permanently: boolean) => {
    video.current?.pause();
    dismissStore(permanently);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && dismiss(forever)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[94dvh] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          // The corner X is replaced by the Skip button below, which is bigger,
          // labelled and reachable with a thumb.
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="shrink-0 px-5 pb-2 pt-4 text-center">
            <DialogPrimitive.Title className="font-myanmar text-base font-semibold tracking-tight text-foreground">
              {t('onboarding.title')}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-0.5 font-myanmar text-[0.78rem] text-muted-foreground">
              {t('onboarding.subtitle')}
            </DialogPrimitive.Description>
          </div>

          {/* ── The video ────────────────────────────────────────────────── */}
          <div className="min-h-0 flex-1 bg-black">
            <video
              ref={video}
              src={VIDEO_URL}
              poster={POSTER_URL}
              controls
              playsInline
              preload="metadata"
              className="mx-auto block aspect-[9/16] h-full max-h-[62dvh] w-auto max-w-full bg-black"
            />
          </div>

          {/* ── Controls ─────────────────────────────────────────────────── */}
          <footer className="shrink-0 border-t border-border bg-card px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="min-h-11 flex-1 font-myanmar"
                onClick={() => dismiss(forever)}
              >
                {t('onboarding.skip')}
              </Button>

              <Button
                type="button"
                size="lg"
                className="min-h-11 flex-1"
                onClick={() => dismiss(forever)}
              >
                <span className="font-myanmar">{t('onboarding.start')}</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              </Button>
            </div>

            {/*
              A real checkbox, visually hidden and driven by the label, so the
              whole row is a 44px target and screen readers announce it as the
              checkbox it is.
            */}
            <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2.5 text-[0.78rem] text-muted-foreground">
              <input
                type="checkbox"
                checked={forever}
                onChange={(event) => setForever(event.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  'grid h-5 w-5 place-items-center rounded-md border transition-colors',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card',
                  forever ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                )}
              >
                {forever ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
              </span>
              <span className="font-myanmar">{t('onboarding.dontShowAgain')}</span>
            </label>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
