/**
 * A circular meter: one value against one limit.
 *
 * Every ring on the credit dashboard answers a "how much of the allowance is
 * gone?" question — credit used of the limit, days used of the 14-day term,
 * bills paid on time of those decided — so each is a meter, not a pie: one
 * filled arc on a track, never two slices that merely split a whole.
 *
 * The fill carries severity (ok → warn → crit, from the `--meter-*` tokens in
 * theme.css) and the track is a lighter step of the same colour, so the state
 * reads around the whole circle. The figure is always printed in the middle
 * and the state is always named beside it by the caller: colour is never the
 * only way to tell a warning from a problem.
 */
import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';

export type MeterTone = 'ok' | 'warn' | 'crit';

const SIZE = 148;
const THICKNESS = 14;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function CreditRing({
  value,
  max,
  tone,
  figure,
  caption,
  label,
}: {
  value: number;
  /** The allowance. Zero or less means there is none to measure against. */
  max: number;
  tone: MeterTone;
  /** Printed in the middle — the number this ring is about. */
  figure: string;
  caption: string;
  /** The ring's full meaning, for screen readers: "62% of credit used". */
  label: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div role="img" aria-label={label} className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <RadialBarChart
        width={SIZE}
        height={SIZE}
        innerRadius={SIZE / 2 - THICKNESS}
        outerRadius={SIZE / 2}
        barSize={THICKNESS}
        data={[{ value: pct }]}
        // Twelve o'clock, clockwise — the way every clock and progress ring
        // a person has seen fills.
        startAngle={90}
        endAngle={-270}
        aria-hidden="true"
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
        <RadialBar
          dataKey="value"
          fill={`var(--meter-${tone})`}
          background={{ fill: `var(--meter-${tone}-track)` }}
          cornerRadius={THICKNESS / 2}
          isAnimationActive={!prefersReducedMotion()}
        />
      </RadialBarChart>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
        <span className="text-[1.6rem] font-bold leading-none tracking-tight text-foreground">
          {figure}
        </span>
        <span className="mt-1 font-myanmar text-[0.7rem] font-medium leading-snug text-muted-foreground">
          {caption}
        </span>
      </div>
    </div>
  );
}
