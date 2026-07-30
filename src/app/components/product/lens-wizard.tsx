/**
 * Prescription lens selection, in four steps.
 *
 * Steps: lens type → prescription numbers → coatings → review. Split because the
 * whole thing on one screen is about thirty controls, and a customer who has never
 * bought glasses online abandons that.
 *
 * ── Two deliberate design decisions ────────────────────────────────────────
 * **A keyed `motion.div`, not `AnimatePresence mode="wait"`.** Progress must never
 * be gated on an exit animation completing; anywhere animations do not run, the
 * state advances and the screen does not. Same reasoning as the onboarding form.
 *
 * **"Bring my prescription to the shop" is offered first, and prominently.** For
 * progressives it is often the better choice, and a customer who cannot find their
 * prescription would otherwise abandon rather than guess. Guessed numbers are the
 * worst outcome for everyone.
 */
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Eye,
  Store,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PdTool } from '@/app/components/product/pd-tool';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { cn } from '@/app/components/ui/utils';
import { formatKyat } from '@/lib/format';
import {
  ADD_MAX,
  ADD_MIN,
  AXIS_MAX,
  AXIS_MIN,
  COATING_PRICES,
  CYL_MAX,
  CYL_MIN,
  type EyePrescription,
  HIGH_INDEX_PRICE,
  HIGH_INDEX_THRESHOLD,
  LENS_COATINGS,
  LENS_PRICES,
  LENS_TYPES,
  LENS_TYPES_NEEDING_ADD,
  type LensCoating,
  type LensSelection,
  type LensType,
  type PrescriptionIssue,
  SPH_MAX,
  SPH_MIN,
  emptySelection,
  formatDioptre,
  isSelectionComplete,
  priceSelection,
  recommendsHighIndex,
  validateSelection,
} from '@/lib/prescription';

const STEPS = ['type', 'prescription', 'coatings', 'review'] as const;
type Step = (typeof STEPS)[number];

export function LensWizard({
  framePriceKyat,
  onComplete,
}: {
  framePriceKyat: number;
  /** Called on the final step with a validated selection. Module 8 consumes it. */
  onComplete: (selection: LensSelection, totalKyat: number) => void;
}) {
  const { t } = useTranslation();

  const [stepIndex, setStepIndex] = useState(0);
  const [selection, setSelection] = useState<LensSelection>(emptySelection);
  const [showErrors, setShowErrors] = useState(false);

  const step: Step = STEPS[stepIndex];
  const issues = useMemo(() => validateSelection(selection), [selection]);
  const breakdown = useMemo(() => priceSelection(framePriceKyat, selection), [framePriceKyat, selection]);

  const needsAdd = LENS_TYPES_NEEDING_ADD.includes(selection.lensType);
  const suggestHighIndex = recommendsHighIndex(selection.prescription);

  /** Issues affecting the fields on the prescription step. */
  const prescriptionIssues = issues.filter((issue) => issue.field !== 'lensType');
  const issueFor = (field: string) =>
    showErrors ? prescriptionIssues.find((issue) => issue.field === field) : undefined;

  const patchEye = (side: 'right' | 'left', patch: Partial<EyePrescription>) => {
    setSelection((current) => ({
      ...current,
      prescription: {
        ...current.prescription,
        [side]: { ...current.prescription[side], ...patch },
      },
    }));
  };

  const canAdvance = (): boolean => {
    if (step === 'prescription' && !selection.deferToStore) return prescriptionIssues.length === 0;
    return true;
  };

  const next = () => {
    if (!canAdvance()) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);

    if (stepIndex < STEPS.length - 1) {
      // Deferring means there is nothing to enter, so the prescription step is
      // skipped rather than shown empty and immediately passed.
      const skip = step === 'type' && selection.deferToStore ? 2 : 1;
      setStepIndex((value) => Math.min(STEPS.length - 1, value + skip));
      return;
    }

    onComplete(selection, breakdown.totalKyat);
  };

  const back = () => {
    setShowErrors(false);
    const skip = step === 'coatings' && selection.deferToStore ? 2 : 1;
    setStepIndex((value) => Math.max(0, value - skip));
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-brand-600 dark:text-brand-300" strokeWidth={1.9} aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">{t('lens.title')}</h2>
      </div>

      <StepIndicator stepIndex={stepIndex} />

      {/* Keyed div, no AnimatePresence — see the note at the top of the file. */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="mt-6"
      >
        <h3 className="text-base font-semibold text-foreground">{t(`lens.steps.${step}.title`)}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t(`lens.steps.${step}.help`)}
        </p>

        <div className="mt-5">
          {step === 'type' ? (
            <TypeStep
              selection={selection}
              onLensType={(lensType) => setSelection((c) => ({ ...c, lensType }))}
              onDefer={(deferToStore) => setSelection((c) => ({ ...c, deferToStore }))}
            />
          ) : null}

          {step === 'prescription' ? (
            <div className="space-y-6">
              <EyeFields
                side="right"
                eye={selection.prescription.right}
                needsAdd={needsAdd}
                onChange={(patch) => patchEye('right', patch)}
                issueFor={issueFor}
              />
              <EyeFields
                side="left"
                eye={selection.prescription.left}
                needsAdd={needsAdd}
                onChange={(patch) => patchEye('left', patch)}
                issueFor={issueFor}
              />

              <PdTool
                value={selection.prescription.pd}
                onChange={(pd) =>
                  setSelection((c) => ({ ...c, prescription: { ...c.prescription, pd } }))
                }
                onSourceChange={(pdSource) =>
                  setSelection((c) => ({ ...c, prescription: { ...c.prescription, pdSource } }))
                }
              />

              {issueFor('pd') ? (
                <p role="alert" className="text-xs text-destructive">
                  {t(`lens.issues.${issueFor('pd')!.code}`, issueFor('pd')!.values)}
                </p>
              ) : null}
            </div>
          ) : null}

          {step === 'coatings' ? (
            <CoatingsStep
              selection={selection}
              suggestHighIndex={suggestHighIndex}
              onToggleCoating={(coating) =>
                setSelection((c) => ({
                  ...c,
                  coatings: c.coatings.includes(coating)
                    ? c.coatings.filter((entry) => entry !== coating)
                    : [...c.coatings, coating],
                }))
              }
              onHighIndex={(highIndex) => setSelection((c) => ({ ...c, highIndex }))}
            />
          ) : null}

          {step === 'review' ? <ReviewStep selection={selection} breakdown={breakdown} /> : null}
        </div>
      </motion.div>

      {/* Running total, on every step. The price roughly triples between the frame
          and a finished pair of progressives, and hiding that until the end is how
          a customer feels ambushed. */}
      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">{t('lens.runningTotal')}</span>
        <span className="text-lg font-semibold text-foreground">
          {formatKyat(breakdown.totalKyat, t('common.currency'))}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={back}
          disabled={stepIndex === 0}
          className={stepIndex === 0 ? 'invisible' : undefined}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          {t('actions.back')}
        </Button>

        <Button type="button" size="lg" onClick={next}>
          {stepIndex === STEPS.length - 1 ? t('lens.finish') : t('actions.next')}
          {stepIndex < STEPS.length - 1 ? (
            <ArrowRight className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
          )}
        </Button>
      </div>

      {showErrors && prescriptionIssues.length > 0 && step === 'prescription' ? (
        <div role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5">
          <p className="text-xs font-medium text-destructive">
            {t('lens.fixIssues', { count: prescriptionIssues.length })}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ── Chrome ────────────────────────────────────────────────────────────────── */

function StepIndicator({ stepIndex }: { stepIndex: number }) {
  const { t } = useTranslation();

  return (
    <ol className="mt-5 flex items-center gap-1.5">
      {STEPS.map((step, index) => (
        <li key={step} className="flex flex-1 items-center gap-1.5">
          <span
            className={cn(
              'grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors',
              index < stepIndex
                ? 'bg-primary text-primary-foreground'
                : index === stepIndex
                  ? 'bg-primary/15 text-primary ring-2 ring-primary/40'
                  : 'bg-muted text-muted-foreground',
            )}
            aria-current={index === stepIndex ? 'step' : undefined}
          >
            {index < stepIndex ? (
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
            ) : (
              index + 1
            )}
          </span>

          <span className="sr-only">{t(`lens.steps.${step}.title`)}</span>

          {index < STEPS.length - 1 ? (
            <span
              aria-hidden="true"
              className={cn('h-0.5 flex-1 rounded-full', index < stepIndex ? 'bg-primary' : 'bg-muted')}
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/* ── Step 1: lens type ─────────────────────────────────────────────────────── */

function TypeStep({
  selection,
  onLensType,
  onDefer,
}: {
  selection: LensSelection;
  onLensType: (type: LensType) => void;
  onDefer: (defer: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label={t('lens.steps.type.title')} className="grid gap-2.5 sm:grid-cols-2">
        {LENS_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={selection.lensType === type}
            onClick={() => onLensType(type)}
            className={cn(
              'rounded-xl border p-4 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selection.lensType === type
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-brand-300 dark:hover:border-brand-700',
            )}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{t(`lens.types.${type}`)}</span>
              <span className="text-xs text-muted-foreground" dir="ltr">
                +{formatKyat(LENS_PRICES[type], t('common.currency'))}
              </span>
            </span>
            <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
              {t(`lens.typeHints.${type}`)}
            </span>
          </button>
        ))}
      </div>

      {/* Offered up front, not buried at the end. */}
      <label
        className={cn(
          'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
          selection.deferToStore
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-brand-300 dark:hover:border-brand-700',
        )}
      >
        <input
          type="checkbox"
          checked={selection.deferToStore}
          onChange={(event) => onDefer(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border"
        />
        <span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Store className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
            {t('lens.deferTitle')}
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
            {t('lens.deferBody')}
          </span>
        </span>
      </label>
    </div>
  );
}

/* ── Step 2: the numbers ───────────────────────────────────────────────────── */

function EyeFields({
  side,
  eye,
  needsAdd,
  onChange,
  issueFor,
}: {
  side: 'right' | 'left';
  eye: EyePrescription;
  needsAdd: boolean;
  onChange: (patch: Partial<EyePrescription>) => void;
  issueFor: (field: string) => PrescriptionIssue | undefined;
}) {
  const { t } = useTranslation();

  /** Accepts a signed decimal, or empties the field. */
  const numeric = (raw: string): number | null => {
    const cleaned = raw.replace(/[^\d.+-]/g, '');
    if (cleaned === '' || cleaned === '-' || cleaned === '+' || cleaned === '.') return null;
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : null;
  };

  const fields: Array<{ key: 'sph' | 'cyl' | 'axis' | 'add'; hint: string; show: boolean }> = [
    { key: 'sph', hint: `${SPH_MIN} … +${SPH_MAX}`, show: true },
    { key: 'cyl', hint: `${CYL_MIN} … +${CYL_MAX}`, show: true },
    { key: 'axis', hint: `${AXIS_MIN}–${AXIS_MAX}`, show: true },
    { key: 'add', hint: `+${ADD_MIN} … +${ADD_MAX}`, show: needsAdd },
  ];

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-foreground">
        {t(`lens.eyes.${side}`)}
        <span className="ml-1.5 font-normal text-muted-foreground">
          {t(`lens.eyeAbbr.${side}`)}
        </span>
      </legend>

      <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {fields.filter((field) => field.show).map((field) => {
          const issue = issueFor(`${side}.${field.key}`);
          const id = `${side}-${field.key}`;

          return (
            <div key={field.key} className="space-y-1">
              <label htmlFor={id} className="block text-xs font-medium text-foreground">
                {t(`lens.fields.${field.key}`)}
              </label>
              <Input
                id={id}
                type="text"
                inputMode="decimal"
                value={eye[field.key] === null ? '' : String(eye[field.key])}
                onChange={(event) => onChange({ [field.key]: numeric(event.target.value) })}
                placeholder={field.key === 'axis' ? '090' : '0.00'}
                dir="ltr"
                aria-invalid={issue ? true : undefined}
                aria-describedby={issue ? `${id}-error` : undefined}
                className={cn('h-9 text-center text-sm', issue && 'border-destructive')}
              />
              {issue ? (
                <p id={`${id}-error`} role="alert" className="text-[0.7rem] leading-tight text-destructive">
                  {t(`lens.issues.${issue.code}`, issue.values)}
                </p>
              ) : (
                <p className="text-[0.7rem] text-muted-foreground" dir="ltr">
                  {field.hint}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ── Step 3: coatings ──────────────────────────────────────────────────────── */

function CoatingsStep({
  selection,
  suggestHighIndex,
  onToggleCoating,
  onHighIndex,
}: {
  selection: LensSelection;
  suggestHighIndex: boolean;
  onToggleCoating: (coating: LensCoating) => void;
  onHighIndex: (value: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {LENS_COATINGS.map((coating) => {
          const checked = selection.coatings.includes(coating);

          return (
            <label
              key={coating}
              className={cn(
                'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
                checked ? 'border-primary bg-primary/5' : 'border-border hover:border-brand-300 dark:hover:border-brand-700',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleCoating(coating)}
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              <span className="min-w-0">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {t(`lens.coatings.${coating}`)}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground" dir="ltr">
                    +{formatKyat(COATING_PRICES[coating], t('common.currency'))}
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {t(`lens.coatingHints.${coating}`)}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {/*
        High index is recommended, not upsold. Past ±4.00 a standard lens is thick
        enough to stand outside the frame rim, so the reason is stated rather than
        left as a vague "premium" option.
      */}
      <label
        className={cn(
          'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
          selection.highIndex
            ? 'border-primary bg-primary/5'
            : suggestHighIndex
              ? 'border-amber-500/40 bg-amber-500/5'
              : 'border-border hover:border-brand-300 dark:hover:border-brand-700',
        )}
      >
        <input
          type="checkbox"
          checked={selection.highIndex}
          onChange={(event) => onHighIndex(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border"
        />
        <span className="min-w-0">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{t('lens.highIndex')}</span>
            <span className="shrink-0 text-xs text-muted-foreground" dir="ltr">
              +{formatKyat(HIGH_INDEX_PRICE, t('common.currency'))}
            </span>
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
            {suggestHighIndex
              ? t('lens.highIndexRecommended', { threshold: HIGH_INDEX_THRESHOLD })
              : t('lens.highIndexHint')}
          </span>
        </span>
      </label>
    </div>
  );
}

/* ── Step 4: review ────────────────────────────────────────────────────────── */

function ReviewStep({
  selection,
  breakdown,
}: {
  selection: LensSelection;
  breakdown: ReturnType<typeof priceSelection>;
}) {
  const { t } = useTranslation();
  const complete = isSelectionComplete(selection);

  return (
    <div className="space-y-5">
      {selection.deferToStore ? (
        <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
          <Store className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} aria-hidden="true" />
          {t('lens.deferSummary')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] border-collapse text-sm">
            <caption className="sr-only">{t('lens.summaryCaption')}</caption>
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="pb-2" />
                <th scope="col" className="pb-2 font-medium">{t('lens.fields.sph')}</th>
                <th scope="col" className="pb-2 font-medium">{t('lens.fields.cyl')}</th>
                <th scope="col" className="pb-2 font-medium">{t('lens.fields.axis')}</th>
                <th scope="col" className="pb-2 font-medium">{t('lens.fields.add')}</th>
              </tr>
            </thead>
            <tbody>
              {(['right', 'left'] as const).map((side) => {
                const eye = selection.prescription[side];
                return (
                  <tr key={side} className="border-t border-border">
                    <th scope="row" className="py-2 pr-3 text-left text-xs font-medium text-muted-foreground">
                      {t(`lens.eyeAbbr.${side}`)}
                    </th>
                    <td className="py-2 tabular-nums text-foreground" dir="ltr">{formatDioptre(eye.sph)}</td>
                    <td className="py-2 tabular-nums text-foreground" dir="ltr">{formatDioptre(eye.cyl)}</td>
                    <td className="py-2 tabular-nums text-foreground" dir="ltr">
                      {eye.axis === null ? '—' : eye.axis}
                    </td>
                    <td className="py-2 tabular-nums text-foreground" dir="ltr">{formatDioptre(eye.add)}</td>
                  </tr>
                );
              })}
              <tr className="border-t border-border">
                <th scope="row" className="py-2 pr-3 text-left text-xs font-medium text-muted-foreground">
                  {t('lens.fields.pd')}
                </th>
                <td colSpan={4} className="py-2 text-foreground" dir="ltr">
                  {selection.prescription.pd === null ? '—' : `${selection.prescription.pd} mm`}
                  {selection.prescription.pdSource ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {t(`pd.sources.${selection.prescription.pdSource}`)}
                    </span>
                  ) : null}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Itemised, because this is where the price stops being the frame price. */}
      <ul className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-4 text-sm">
        {breakdown.lines.map((line, index) => (
          <li key={`${line.labelKey}-${index}`} className="flex items-baseline justify-between gap-3">
            <span className="text-muted-foreground">{t(line.labelKey as never)}</span>
            <span className="tabular-nums text-foreground" dir="ltr">
              {formatKyat(line.kyat, t('common.currency'))}
            </span>
          </li>
        ))}
        <li className="flex items-baseline justify-between gap-3 border-t border-border pt-2 font-semibold">
          <span className="text-foreground">{t('lens.total')}</span>
          <span className="tabular-nums text-foreground" dir="ltr">
            {formatKyat(breakdown.totalKyat, t('common.currency'))}
          </span>
        </li>
      </ul>

      {!complete ? (
        <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          {t('lens.incompleteWarning')}
        </p>
      ) : null}

      <p className="text-xs leading-relaxed text-muted-foreground">{t('pd.verifyNotice')}</p>
    </div>
  );
}
