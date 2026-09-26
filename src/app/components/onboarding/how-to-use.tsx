/**
 * The "How to order" walkthrough, shown on launch until dismissed for good.
 *
 * Three animated scenes standing in for an instructional video: pick colours,
 * watch the discounts apply, send to Telegram. It auto-advances so it plays like
 * a clip if you leave it alone, and stops auto-advancing the moment you touch a
 * control — a carousel that keeps moving under someone's finger is worse than
 * one that never moved.
 *
 * ── Why Skip is a large labelled button, not the corner X ──────────────────
 * This audience is shop owners on phones who were handed a link, not app users
 * who know that a grey ✕ in a corner is an escape hatch. The button says so in
 * both languages, and the "Don't show again" toggle beside it is what turns a
 * dismissal into a permanent one — see the note in `onboarding-store.ts` about
 * why those are deliberately separate.
 */
import { useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  SceneSelect,
  SceneSend,
  SceneSignIn,
} from '@/app/components/onboarding/step-scenes';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import { shouldShowWalkthrough, useOnboardingStore } from '@/app/stores/onboarding-store';

// Sign-in leads, because it is now a precondition rather than a nicety: a buyer
// who picks colours first only discovers at the order screen that none of it
// counted. See the auth gate on `FrameCard`.
const STEPS = [
  { key: 'signIn', Scene: SceneSignIn },
  { key: 'browse', Scene: SceneSelect },
  { key: 'send', Scene: SceneSend },
] as const;

/** How long each scene holds before advancing itself. */
const AUTOPLAY_MS = 5_000;

export function HowToUseModal() {
  const { t } = useTranslation();

  const state = useOnboardingStore();
  const dismiss = useOnboardingStore((s) => s.dismiss);

  const [step, setStep] = useState(0);
  const [forever, setForever] = useState(false);
  /** Cleared on the first interaction, so autoplay never fights the buyer. */
  const [autoplay, setAutoplay] = useState(true);

  const open = shouldShowWalkthrough(state);
  const isLast = step === STEPS.length - 1;

  useEffect(() => {
    if (!open || !autoplay) return;

    const timer = window.setTimeout(() => {
      // Stops on the last scene rather than looping back to the first: a
      // walkthrough that restarts itself reads as broken, and the buyer has
      // already been shown everything by then.
      setStep((current) => (current === STEPS.length - 1 ? current : current + 1));
    }, AUTOPLAY_MS);

    return () => window.clearTimeout(timer);
  }, [open, autoplay, step]);

  // Reset for the next viewing — a replay should start at step one.
  useEffect(() => {
    if (!open) {
      setStep(0);
      setAutoplay(true);
    }
  }, [open]);

  const goTo = (next: number) => {
    setAutoplay(false);
    setStep(next);
  };

  const { Scene } = STEPS[step];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && dismiss(forever)}>
      <DialogPrimitive.Portal>
        {/*
          ── No exit animation here, deliberately ──────────────────────────
          Radix keeps a closing node mounted until it sees an `animationend`
          for the exit animation. The scenes inside this dialog run *infinite*
          CSS animations, and those keep the node's animation state alive so the
          end event never resolves — leaving the dismissed walkthrough on screen,
          fully interactive, on top of the catalogue.

          Entering still animates. Closing is instant, which is what a dismissal
          should feel like anyway.
        */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          // The corner X is replaced by the Skip button below, which is bigger,
          // labelled and reachable with a thumb.
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">
            {t('onboarding.title')}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {t('onboarding.subtitle')}
          </DialogPrimitive.Description>

          {/* ── Scene ────────────────────────────────────────────────────── */}
          <div className="relative aspect-[16/9] w-full shrink-0 bg-gradient-to-br from-brand-500/10 via-transparent to-primary/10 p-3">
            <Scene active />
          </div>

          {/* ── Progress ─────────────────────────────────────────────────── */}
          <div className="flex justify-center gap-1.5 px-5">
            {STEPS.map((entry, index) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => goTo(index)}
                aria-label={t('onboarding.goToStep', { number: index + 1 })}
                aria-current={index === step}
                className="group grid h-6 place-items-center px-1 focus-visible:outline-none"
              >
                <span
                  className={cn(
                    'block h-1.5 rounded-full transition-all group-focus-visible:ring-2 group-focus-visible:ring-ring',
                    index === step ? 'w-7 bg-primary' : 'w-3 bg-border',
                  )}
                />
              </button>
            ))}
          </div>

          {/* ── Copy ─────────────────────────────────────────────────────── */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-1 pt-2 text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
              {t('onboarding.stepCounter', { current: step + 1, total: STEPS.length })}
            </p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">
              <span className="font-myanmar">{t(`onboarding.steps.${STEPS[step].key}.title`)}</span>
            </h2>
            <p className="mx-auto mt-1.5 max-w-xs text-[0.82rem] leading-relaxed text-muted-foreground">
              <span className="font-myanmar">{t(`onboarding.steps.${STEPS[step].key}.body`)}</span>
            </p>
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
                onClick={() => (isLast ? dismiss(forever) : goTo(step + 1))}
              >
                {isLast ? t('onboarding.start') : t('onboarding.next')}
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
