/**
 * Pupillary distance, measured against a bank card.
 *
 * ── Why a card and not a webcam ────────────────────────────────────────────
 * Automatic webcam PD measurement is genuinely hard: it needs face landmark
 * detection, a known-size reference in frame anyway, and good lighting, and it
 * still lands around ±3mm. That error is tolerable for single-vision lenses and
 * unacceptable for progressives, where the corridor is ground to the pupil — a
 * 3mm error there produces lenses the customer cannot read through, and they will
 * not know why.
 *
 * So this measures with a physical reference the customer already owns. Every bank
 * card on earth is 85.60mm wide by ISO/IEC 7810 ID-1, which makes it a free,
 * universally available ruler. Photograph it against the forehead, and the pixel
 * ratio converts pupil separation into millimetres.
 *
 * ── And it is always provisional ───────────────────────────────────────────
 * Whatever this produces, the shop measures again with a pupilometer before
 * glazing. That notice is shown at every step, not buried at the end — a customer
 * who thinks they have supplied a final number will not mention it in store.
 */
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Info, Minus, Plus, Ruler, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { cn } from '@/app/components/ui/utils';
import { PD_MAX, PD_MIN } from '@/lib/prescription';

/** ISO/IEC 7810 ID-1: the width of every bank, credit and debit card. */
const CARD_WIDTH_MM = 85.6;

/** Typical adult range, used to sanity-check a computed result. */
const TYPICAL_MIN = 54;
const TYPICAL_MAX = 74;

export function PdTool({
  value,
  onChange,
  onSourceChange,
}: {
  value: number | null;
  onChange: (pd: number | null) => void;
  onSourceChange: (source: 'card' | 'known' | 'in-store') => void;
}) {
  const { t } = useTranslation();

  const [mode, setMode] = useState<'measure' | 'known' | 'store'>('known');

  /** Measured in whatever unit the customer's ruler uses — only the ratio matters. */
  const [cardWidth, setCardWidth] = useState('');
  const [pupilGap, setPupilGap] = useState('');

  /**
   * PD from the two measurements.
   *
   * The unit cancels: (pupil gap ÷ card width) is a pure ratio, multiplied by the
   * card's known 85.6mm. So the customer can measure in pixels on a photo, or in
   * centimetres against a printed ruler, and either works.
   */
  const computed = useMemo(() => {
    const card = Number(cardWidth);
    const gap = Number(pupilGap);

    if (!Number.isFinite(card) || !Number.isFinite(gap) || card <= 0 || gap <= 0) return null;

    const mm = (gap / card) * CARD_WIDTH_MM;
    // Rounded to the nearest whole millimetre: the method is not precise enough to
    // justify a decimal, and a figure like "63.4mm" implies accuracy it lacks.
    return Math.round(mm);
  }, [cardWidth, pupilGap]);

  const outOfTypicalRange =
    computed !== null && (computed < TYPICAL_MIN || computed > TYPICAL_MAX);
  const impossible = computed !== null && (computed < PD_MIN || computed > PD_MAX);

  const apply = () => {
    if (computed === null || impossible) return;
    onChange(computed);
    onSourceChange('card');
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Ruler className="h-4 w-4 text-brand-600 dark:text-brand-300" strokeWidth={1.9} aria-hidden="true" />
        <h3 className="text-sm font-semibold text-foreground">{t('pd.title')}</h3>
      </div>

      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t('pd.intro')}</p>

      {/* Shown before anything is entered, not after. */}
      <p className="mt-4 flex items-start gap-2 rounded-xl border border-brand-200/70 bg-brand-50/50 p-3.5 text-xs leading-relaxed text-foreground dark:border-brand-800/70 dark:bg-brand-950/40">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300"
          strokeWidth={2}
          aria-hidden="true"
        />
        {t('pd.verifyNotice')}
      </p>

      {/* Mode picker */}
      <div
        role="radiogroup"
        aria-label={t('pd.modeLabel')}
        className="mt-5 grid gap-2 sm:grid-cols-3"
      >
        {(['known', 'measure', 'store'] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={mode === option}
            onClick={() => {
              setMode(option);
              if (option === 'store') {
                // Clearing the value is the honest thing: "measure in store" means
                // we do not have a number, not that we have this one.
                onChange(null);
                onSourceChange('in-store');
              }
            }}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              mode === option
                ? 'border-primary bg-primary/5 font-medium text-foreground'
                : 'border-border text-muted-foreground hover:border-brand-300 hover:text-foreground dark:hover:border-brand-700',
            )}
          >
            {t(`pd.modes.${option}`)}
          </button>
        ))}
      </div>

      {/* ── Known value ───────────────────────────────────────────────────── */}
      {mode === 'known' ? (
        <div className="mt-5">
          <label htmlFor="pd-known" className="block text-sm font-medium text-foreground">
            {t('pd.knownLabel')}
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t('pd.decrease')}
              onClick={() => {
                const next = (value ?? 62) - 1;
                if (next >= PD_MIN) { onChange(next); onSourceChange('known'); }
              }}
            >
              <Minus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </Button>

            <Input
              id="pd-known"
              type="text"
              inputMode="numeric"
              value={value === null ? '' : String(value)}
              onChange={(event) => {
                const digits = event.target.value.replace(/[^\d]/g, '').slice(0, 2);
                onChange(digits ? Number(digits) : null);
                onSourceChange('known');
              }}
              placeholder="63"
              dir="ltr"
              className="w-20 text-center"
            />

            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t('pd.increase')}
              onClick={() => {
                const next = (value ?? 62) + 1;
                if (next <= PD_MAX) { onChange(next); onSourceChange('known'); }
              }}
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </Button>

            <span className="text-sm text-muted-foreground">{t('pd.mm')}</span>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">{t('pd.knownHint')}</p>
        </div>
      ) : null}

      {/* ── Card measurement ──────────────────────────────────────────────── */}
      {mode === 'measure' ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="mt-5"
        >
          <CardDiagram />

          <ol className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {(['step1', 'step2', 'step3', 'step4'] as const).map((step, index) => (
              <li key={step} className="flex gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{t(`pd.steps.${step}`)}</span>
              </li>
            ))}
          </ol>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="pd-card" className="block text-sm font-medium text-foreground">
                {t('pd.cardWidthLabel')}
              </label>
              <Input
                id="pd-card"
                type="text"
                inputMode="decimal"
                value={cardWidth}
                onChange={(event) => setCardWidth(event.target.value.replace(/[^\d.]/g, ''))}
                placeholder="340"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pd-gap" className="block text-sm font-medium text-foreground">
                {t('pd.pupilGapLabel')}
              </label>
              <Input
                id="pd-gap"
                type="text"
                inputMode="decimal"
                value={pupilGap}
                onChange={(event) => setPupilGap(event.target.value.replace(/[^\d.]/g, ''))}
                placeholder="250"
                dir="ltr"
              />
            </div>
          </div>

          <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
            {t('pd.unitsNote')}
          </p>

          {computed !== null ? (
            <div
              className={cn(
                'mt-4 rounded-xl border p-4',
                impossible
                  ? 'border-destructive/30 bg-destructive/5'
                  : outOfTypicalRange
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-emerald-600/30 bg-emerald-600/5',
              )}
            >
              <p className="text-sm text-muted-foreground">{t('pd.result')}</p>
              <p className="mt-0.5 text-2xl font-semibold text-foreground" dir="ltr">
                {computed} <span className="text-base font-normal">{t('pd.mm')}</span>
              </p>

              {impossible ? (
                <p className="mt-2 text-xs leading-relaxed text-destructive">
                  {t('pd.impossible', { min: PD_MIN, max: PD_MAX })}
                </p>
              ) : outOfTypicalRange ? (
                // A warning, not a rejection — unusual PDs are real, and refusing
                // one would tell a customer their own face is wrong.
                <p className="mt-2 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                  {t('pd.unusual', { min: TYPICAL_MIN, max: TYPICAL_MAX })}
                </p>
              ) : null}

              <Button
                type="button"
                size="sm"
                className="mt-3"
                disabled={impossible}
                onClick={apply}
              >
                {t('pd.useThis')}
              </Button>
            </div>
          ) : null}
        </motion.div>
      ) : null}

      {/* ── Defer to the shop ─────────────────────────────────────────────── */}
      {mode === 'store' ? (
        <p className="mt-5 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
          {t('pd.storeChosen')}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Diagram of the method.
 *
 * Drawn as SVG rather than photographed: a line drawing shows the card position
 * and the two measurements unambiguously, works in both themes, and does not
 * require a model's face.
 */
function CardDiagram() {
  const { t } = useTranslation();

  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-muted/40 p-4">
      <svg viewBox="0 0 320 170" className="mx-auto h-auto w-full max-w-sm" role="img" aria-label={t('pd.diagramAlt')}>
        {/* Face outline */}
        <ellipse cx="160" cy="95" rx="62" ry="72" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground/50" />

        {/* Eyes */}
        <circle cx="136" cy="92" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-foreground/70" />
        <circle cx="184" cy="92" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-foreground/70" />
        {/* Pupils */}
        <circle cx="136" cy="92" r="2.4" className="fill-brand-500" />
        <circle cx="184" cy="92" r="2.4" className="fill-brand-500" />

        {/* Card held across the forehead */}
        <rect x="106" y="34" width="108" height="26" rx="4" className="fill-brand-500/15 stroke-brand-500" strokeWidth="2.5" />
        <text x="160" y="51" textAnchor="middle" fontSize="9" className="fill-brand-600 dark:fill-brand-300" fontFamily="system-ui, sans-serif">
          85.6 mm
        </text>

        {/* Card width measure */}
        <g className="stroke-brand-500" strokeWidth="1.6">
          <line x1="106" y1="26" x2="214" y2="26" />
          <line x1="106" y1="22" x2="106" y2="30" />
          <line x1="214" y1="22" x2="214" y2="30" />
        </g>

        {/* Pupil gap measure */}
        <g className="stroke-gold-500" strokeWidth="1.6">
          <line x1="136" y1="122" x2="184" y2="122" />
          <line x1="136" y1="118" x2="136" y2="126" />
          <line x1="184" y1="118" x2="184" y2="126" />
        </g>
        <text x="160" y="137" textAnchor="middle" fontSize="9" className="fill-gold-600 dark:fill-gold-300" fontFamily="system-ui, sans-serif">
          PD
        </text>

        {/* Dotted guides from pupil centres down to the measure line */}
        <g className="stroke-gold-500/45" strokeWidth="1.2" strokeDasharray="3 3">
          <line x1="136" y1="94" x2="136" y2="118" />
          <line x1="184" y1="94" x2="184" y2="118" />
        </g>
      </svg>

      <figcaption className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <CreditCard className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
        {t('pd.diagramCaption')}
      </figcaption>
    </figure>
  );
}
