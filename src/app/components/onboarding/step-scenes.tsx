/**
 * The three animated scenes in the "How to order" walkthrough.
 *
 * ── Why hand-drawn SVG rather than a screen recording ──────────────────────
 * A recording of the real app would be heavier than the app itself, would need
 * re-shooting after every UI change, and would show English or Burmese but not
 * both. These scenes are a few kilobytes of markup that inherit the theme, read
 * correctly in either language because they contain almost no words, and cannot
 * drift out of date in the way a stale video silently does.
 *
 * Each scene animates on a loop with pure CSS keyframes — no animation library
 * and no JavaScript ticking per frame, so an old phone renders them on the
 * compositor. Everything is wrapped in `motion-safe:` so a viewer who has asked
 * their OS to cut motion gets the same diagram, still.
 */
import { cn } from '@/app/components/ui/utils';

/* Shared palette, driven by the theme's own tokens so the scenes restyle with it. */
const INK = 'stroke-foreground/25';
const CARD = 'fill-card';
const EDGE = 'stroke-border';

/**
 * Step 1 — picking C-colours and tapping the stepper.
 *
 * The "+" pulses and the counter ticks 0 → 1 → 2 → 3, which is the single
 * gesture the whole app is built around.
 */
export function SceneSelect({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-hidden="true" className="h-full w-full">
      {/* Frame thumbnail */}
      <rect x="16" y="24" width="96" height="72" rx="10" className={cn(CARD, EDGE)} strokeWidth={1.5} />
      <g className={INK} fill="none" strokeWidth={4} strokeLinecap="round">
        <rect x="28" y="50" width="30" height="22" rx="9" />
        <rect x="70" y="50" width="30" height="22" rx="9" />
        <path d="M58 58q6-5 12 0" />
        <path d="M28 55l-8-4" />
        <path d="M100 55l8-4" />
      </g>

      {/* Three colour rows */}
      {[0, 1, 2].map((row) => {
        const y = 28 + row * 34;
        const swatch = ['#8a5a2b', '#1e3a5f', '#9ca3af'][row];

        return (
          <g key={row} className={active ? 'motion-safe:animate-[pbwRow_3s_ease-in-out_infinite]' : ''} style={{ animationDelay: `${row * 0.35}s` }}>
            <rect x="128" y={y} width="176" height="26" rx="13" className={cn(CARD, EDGE)} strokeWidth={1.5} />
            <circle cx="144" cy={y + 13} r="7" fill={swatch} />
            <text x="160" y={y + 17} className="fill-muted-foreground text-[11px] font-semibold" style={{ fontFamily: 'system-ui' }}>
              C{row + 1}
            </text>

            {/* Stepper */}
            <circle cx="248" cy={y + 13} r="9" className={cn(CARD, EDGE)} strokeWidth={1.5} />
            <path d={`M243 ${y + 13}h10`} className="stroke-muted-foreground" strokeWidth={2} strokeLinecap="round" />

            <text x="272" y={y + 17} textAnchor="middle" className="fill-foreground text-[11px] font-bold" style={{ fontFamily: 'system-ui' }}>
              {active ? <animate attributeName="opacity" values="1;1" dur="3s" repeatCount="indefinite" /> : null}
              5
            </text>

            <circle
              cx="292"
              cy={y + 13}
              r="9"
              className="fill-primary"
            >
              {active ? (
                <animate
                  attributeName="r"
                  values="9;11;9"
                  dur="1.4s"
                  begin={`${row * 0.35}s`}
                  repeatCount="indefinite"
                />
              ) : null}
            </circle>
            <path
              d={`M287 ${y + 13}h10M292 ${y + 8}v10`}
              className="stroke-primary-foreground"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Step 1 of the sequence, though the second scene defined here — signing in.
 *
 * A product card with a padlock over its action button, and the padlock's shackle
 * lifting on a loop. It replaced a scene about the discount engine, which was
 * removed from the app: a walkthrough demonstrating arithmetic the voucher no
 * longer does would have been the most confidently wrong screen in the product.
 *
 * The scene carries no words on purpose, like the other two — the caption under
 * it is already translated, and baking "SIGN IN" into the artwork would leave
 * one English label stranded in the Burmese walkthrough.
 */
export function SceneSignIn({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-hidden="true" className="h-full w-full">
      <rect
        x="88"
        y="12"
        width="144"
        height="156"
        rx="14"
        className={cn(CARD, EDGE)}
        strokeWidth={1.5}
      />

      {/* The frame photo, standing in as a pair of lenses. */}
      <g className={INK} strokeWidth={4} fill="none" strokeLinecap="round">
        <circle cx="134" cy="58" r="17" />
        <circle cx="186" cy="58" r="17" />
        <path d="M151 55c3-2.5 5.5-3.5 9-3.5s6 1 9 3.5" />
      </g>

      {/* Two lines of specification. */}
      <rect x="106" y="92" width="76" height="7" rx="3.5" className="fill-muted" />
      <rect x="106" y="106" width="52" height="7" rx="3.5" className="fill-muted" />

      {/* The locked action button. */}
      <rect x="106" y="126" width="108" height="26" rx="13" className="fill-primary/15" />

      <g
        className={active ? 'motion-safe:animate-[pbwPop_3s_ease-out_infinite]' : ''}
        style={{ transformOrigin: '160px 139px' }}
      >
        {/* Shackle */}
        <path
          d="M154 136v-4a6 6 0 0 1 12 0v4"
          className="stroke-primary"
          strokeWidth={2.6}
          fill="none"
          strokeLinecap="round"
        />
        {/* Body */}
        <rect x="151" y="136" width="18" height="13" rx="3" className="fill-primary" />
      </g>
    </svg>
  );
}

/**
 * Step 3 — the order flying to Telegram.
 *
 * A paper plane on a dashed arc. The metaphor is doing real work here: it says
 * "this leaves your phone and arrives with us" without a sentence of copy that
 * would need translating.
 */
export function SceneSend({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-hidden="true" className="h-full w-full">
      {/* Phone */}
      <rect x="28" y="26" width="86" height="128" rx="12" className={cn(CARD, EDGE)} strokeWidth={1.5} />
      <rect x="42" y="46" width="58" height="6" rx="3" className="fill-muted" />
      <rect x="42" y="60" width="42" height="6" rx="3" className="fill-muted" />
      <rect x="42" y="120" width="58" height="18" rx="9" className="fill-primary" />

      {/* Flight path */}
      <path
        d="M120 108C160 108 190 62 250 56"
        className="stroke-primary/40"
        strokeWidth={2}
        strokeDasharray="5 6"
        fill="none"
      />

      {/* Paper plane, travelling the path */}
      <g className={active ? 'motion-safe:animate-[pbwFly_2.6s_ease-in-out_infinite]' : ''}>
        <path d="M0 0l22 9-9 3-3 9z" className="fill-primary" transform="translate(120 96)" />
      </g>

      {/* Telegram bubble */}
      <circle cx="266" cy="52" r="26" className="fill-primary/10" />
      <path
        d="M279.5 42.2l-4.4 20.8a1.6 1.6 0 0 1-2.4 1.1l-6.6-4.9-3.2 3.1a1 1 0 0 1-.7.3l.5-6.7 12.2-11a.4.4 0 0 0-.6-.5l-15.1 9.5-6.5-2a1 1 0 0 1 .1-2l25.5-9.8a1 1 0 0 1 1.2 2z"
        className="fill-primary"
      />

      {/* Delivered tick */}
      <g className={active ? 'motion-safe:animate-[pbwPop_2.6s_ease-out_infinite]' : ''}>
        <circle cx="286" cy="76" r="12" className="fill-emerald-600" />
        <path
          d="M280.5 76l4 4 7-8"
          className="stroke-white"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
