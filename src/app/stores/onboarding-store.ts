/**
 * Whether the "How to order" walkthrough has been dismissed for good.
 *
 * ── Why "seen" and "suppressed" are different things ───────────────────────
 * Skipping the walkthrough is not the same as never wanting it again. A buyer
 * who taps Skip on a busy Tuesday is saying "not now"; a buyer who ticks
 * *Don't show again* is saying "never". Collapsing the two — which the first
 * version of this store did — means one impatient tap permanently hides the only
 * explanation of how the app works, and there is no obvious way back.
 *
 * So: `suppressed` is the persisted preference, and the modal is shown once per
 * session until it is set. `shownThisSession` lives in memory and dies with the
 * tab, which is exactly the lifetime "not now" should have.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'pbw-onboarding';

interface OnboardingState {
  /** The persisted "never again" preference. */
  suppressed: boolean;
  /** Dismissed already in this tab — not persisted. */
  dismissedThisSession: boolean;
  /** Set while the buyer has deliberately re-opened it from the top bar. */
  replaying: boolean;

  /**
   * Whether the splash screen has finished getting out of the way.
   *
   * The walkthrough waits on this so the two never overlap. Without it the
   * modal mounts underneath the splash and starts auto-advancing its scenes
   * while nobody can see them — a buyer would arrive on step two of three with
   * no idea a step one had happened.
   *
   * `SplashScreen` sets it in both of its paths, including the one where it
   * decides not to show at all, so nothing here can wait forever.
   */
  splashDone: boolean;

  /** @param forever The state of the "Don't show again" toggle at dismissal. */
  dismiss: (forever: boolean) => void;
  replay: () => void;
  finishSplash: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      suppressed: false,
      dismissedThisSession: false,
      replaying: false,
      splashDone: false,

      dismiss: (forever) =>
        set({ dismissedThisSession: true, replaying: false, suppressed: forever }),

      replay: () => set({ replaying: true }),

      finishSplash: () => set({ splashDone: true }),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      // Only the preference survives a reload. Persisting the session flags
      // would either suppress the walkthrough forever after one skip, or reopen
      // it on every launch for anyone who replayed it once.
      partialize: (state) => ({ suppressed: state.suppressed }),
      /**
       * v1 stored `{ seen: boolean }` and treated Skip as permanent. Anyone who
       * skipped under v1 chose "not now" but was recorded as "never" — so the
       * flag is deliberately *not* carried over. The cost is one more showing of
       * a one-minute walkthrough; the alternative is silently honouring consent
       * that was never given.
       */
      migrate: () => ({ suppressed: false }),
    },
  ),
);

/** Whether the walkthrough should be on screen right now. */
export function shouldShowWalkthrough(state: OnboardingState): boolean {
  // Nothing opens over the splash, including a deliberate replay — the button
  // that triggers one is behind the splash too, but a replay left over from a
  // previous tab state should still queue rather than fight it.
  if (!state.splashDone) return false;
  if (state.replaying) return true;
  return !state.suppressed && !state.dismissedThisSession;
}
