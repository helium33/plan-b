/**
 * The Plan B Vision logo with a greeting under it, animated — the one moment
 * shared by the app opening, signing in and signing out.
 *
 * Hello: the logo drops in with a halo breathing out behind it, a band of
 * light sweeps across the plate, then the greeting arrives word by word.
 * Goodbye: the same, but the logo gives a small bow as the words arrive.
 *
 * Words, not letters: Burmese stacks vowel signs and medials on a consonant,
 * and splitting inside a syllable would draw them detached from their base.
 * Spaces are the only safe place to cut.
 */
import { Fragment } from 'react';

import { cn } from '@/app/components/ui/utils';

import { BrandLogo } from './brand-logo';

/** Delay before the first word, and between words. Seconds. */
const FIRST_WORD_AT = 0.55;
const WORD_STEP = 0.12;

export function BrandGreeting({
  message,
  mood = 'hello',
  as: Heading = 'p',
  className,
}: {
  message: string;
  mood?: 'hello' | 'goodbye';
  /** `h1` on the sign-in screen, where the greeting is the page's heading. */
  as?: 'h1' | 'p';
  className?: string;
}) {
  const words = message.split(/\s+/).filter(Boolean);

  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <div className="relative motion-safe:animate-[pbwSplashDrop_0.85s_cubic-bezier(0.34,1.3,0.64,1)_both]">
        {/* Halo: two rings, the second a beat behind the first. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-white/40 opacity-0 motion-safe:animate-[pbwHalo_1.8s_ease-out_0.5s_2]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl border border-white/30 opacity-0 motion-safe:animate-[pbwHalo_1.8s_ease-out_0.9s_2]"
        />

        <div
          className={cn(
            'relative overflow-hidden rounded-3xl',
            mood === 'goodbye' &&
              'motion-safe:animate-[pbwBow_0.9s_ease-in-out_0.9s_both] motion-safe:[transform-origin:50%_100%]',
          )}
        >
          <BrandLogo className="shadow-none ring-1 ring-white/25" />
          {/* The sweep of light across the plate. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/35 to-transparent motion-safe:animate-[pbwShine_1.1s_ease-in-out_0.75s_both]"
          />
        </div>
      </div>

      <Heading
        lang="my"
        aria-label={message}
        className="mt-6 max-w-sm font-myanmar text-[1.05rem] font-semibold leading-[1.9] text-white sm:text-lg"
      >
        {words.map((word, index) => (
          <Fragment key={index}>
            {/* A plain space between the spans, so the line can still wrap. */}
            {index > 0 ? ' ' : null}
            <span
              aria-hidden="true"
              className="inline-block motion-safe:animate-[pbwWordIn_0.45s_ease-out_both]"
              style={{ animationDelay: `${FIRST_WORD_AT + index * WORD_STEP}s` }}
            >
              {word}
            </span>
          </Fragment>
        ))}
      </Heading>
    </div>
  );
}
