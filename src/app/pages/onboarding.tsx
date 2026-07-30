/**
 * The personalisation form.
 *
 * Four steps rather than one long page, because the alternative is a wall of
 * questions that a customer abandons — and an abandoned form earns nobody points
 * and recommends nobody a frame. One decision per screen also gives the face
 * shape step room for the drawings it needs.
 *
 * Answers are held in local state and written **once**, on the final step. A
 * per-step save would leave half-filled profiles behind whenever someone changed
 * their mind and closed the tab, and `saveMemberProfile` awards the onboarding
 * bonus on completion — so completion has to be a single, deliberate moment.
 *
 * Guarded by `RequireMember`, so `phoneKey` is always present here.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, HelpCircle, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AuthAlert } from '@/app/components/auth/auth-alert';
import { FaceShapeOutline } from '@/app/components/onboarding/face-shape-guide';
import { OptionCards, type Option } from '@/app/components/onboarding/option-card';
import { TextField } from '@/app/components/auth/fields';
import { Button } from '@/app/components/ui/button';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { resolveErrorKey } from '@/lib/auth';
import {
  FACE_SHAPES,
  FRAME_SIZES,
  GENDERS,
  type FaceShape,
  type FrameSize,
  type Gender,
} from '@/lib/attributes';
import { saveMemberProfile } from '@/lib/firestore/members';
import { LOYALTY } from '@/lib/membership';

/** Bounds sanity-check the age, not the customer. */
const MIN_AGE = 1;
const MAX_AGE = 120;

const STEPS = ['about', 'gender', 'faceShape', 'frameSize'] as const;
type Step = (typeof STEPS)[number];

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { member, phoneKey } = useAuth();

  useDocumentTitle(t('pages.onboarding.title'));

  const [stepIndex, setStepIndex] = useState(0);
  const step: Step = STEPS[stepIndex];

  // Pre-filled from whatever is already known, so a returning customer editing
  // their answers does not start from blank.
  const [name, setName] = useState(member?.profile.name ?? member?.displayName ?? '');
  const [age, setAge] = useState(member?.profile.age ? String(member.profile.age) : '');
  const [gender, setGender] = useState<Gender | null>(member?.profile.gender ?? null);
  const [faceShape, setFaceShape] = useState<FaceShape | null>(member?.profile.faceShape ?? null);
  const [frameSize, setFrameSize] = useState<FrameSize | null>(member?.profile.frameSize ?? null);

  const [saving, setSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const parsedAge = Number.parseInt(age, 10);
  const ageIsValid = Number.isFinite(parsedAge) && parsedAge >= MIN_AGE && parsedAge <= MAX_AGE;

  /**
   * Whether the current step has enough to continue.
   *
   * Name and age are required together on the first step; every other step is a
   * single choice. Nothing is optional — a skipped answer weakens every
   * recommendation, and there are only four.
   */
  const canAdvance = useMemo(() => {
    switch (step) {
      case 'about':
        return name.trim().length > 0 && ageIsValid;
      case 'gender':
        return gender !== null;
      case 'faceShape':
        return faceShape !== null;
      case 'frameSize':
        return frameSize !== null;
    }
  }, [step, name, ageIsValid, gender, faceShape, frameSize]);

  const goBack = () => {
    setFieldError(null);
    setStepIndex((current) => Math.max(0, current - 1));
  };

  const goNext = () => {
    setFieldError(null);

    if (!canAdvance) {
      if (step === 'about') {
        setFieldError(
          name.trim().length === 0
            ? t('onboarding.errors.nameRequired')
            : t('onboarding.errors.ageInvalid', { min: MIN_AGE, max: MAX_AGE }),
        );
      }
      return;
    }

    if (stepIndex < STEPS.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }

    void submit();
  };

  const submit = async () => {
    if (!phoneKey) {
      // Should be unreachable behind `RequireMember`, but writing to
      // `members/undefined` would be far worse than an honest error.
      setErrorKey('auth.errors.memberLoad');
      return;
    }

    setSaving(true);
    setErrorKey(null);

    try {
      const { bonusAwarded } = await saveMemberProfile(
        phoneKey,
        {
          name: name.trim(),
          age: parsedAge,
          gender,
          faceShape,
          frameSize,
        },
        { markComplete: true },
      );

      // Straight to the results. The bonus is passed in router state rather than
      // re-read, because `saveMemberProfile` is the only thing that knows whether
      // this particular submission was the one that earned it.
      navigate(ROUTES.recommendations, {
        replace: true,
        state: { justCompleted: true, bonusAwarded },
      });
    } catch (error) {
      setErrorKey(resolveErrorKey(error));
      setSaving(false);
    }
  };

  return (
    <div className="container-page max-w-2xl py-10 sm:py-16">
      {/*
        A real `h1` naming the page, with each step as an `h2` beneath it.
        Without this the document starts at `h2` and the page never says what it
        is — a screen-reader user landing here after signup would hear "Step 1 of
        4" with no indication of what they are one step into.
      */}
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {t('pages.onboarding.title')}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {t('pages.onboarding.description')}
      </p>

      <div className="mt-8">
        <ProgressHeader stepIndex={stepIndex} total={STEPS.length} />
      </div>

      <WhyWeAsk />

      {errorKey ? (
        <div className="mt-6">
          <AuthAlert messageKey={errorKey} />
        </div>
      ) : null}

      {/*
        A keyed `motion.div` with no `AnimatePresence`, deliberately.

        The obvious construction here is `<AnimatePresence mode="wait">`, so the
        outgoing step slides away before the next slides in. It is also wrong for
        a form: `mode="wait"` will not mount the incoming step until the outgoing
        one's exit animation *completes*, which makes progressing through the
        form conditional on an animation finishing. Anywhere animations do not
        run — a throttled background tab, a reduced-motion environment, an
        automated test — the state advances but the screen does not, and the form
        looks frozen. Caught exactly that way during verification.

        Changing the `key` remounts the panel instantly and animates it in. No
        exit animation, and nothing the customer needs is ever gated behind one.
      */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="mt-8"
      >
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t(`onboarding.steps.${step}.title`)}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t(`onboarding.steps.${step}.help`)}
          </p>

          <div className="mt-6">
            {step === 'about' ? (
              <div className="space-y-5">
                <TextField
                  label={t('onboarding.nameLabel')}
                  value={name}
                  onChange={setName}
                  placeholder={t('onboarding.namePlaceholder')}
                  autoComplete="name"
                  required
                  autoFocus
                  disabled={saving}
                />
                <TextField
                  label={t('onboarding.ageLabel')}
                  value={age}
                  onChange={(next) => setAge(next.replace(/[^\d]/g, '').slice(0, 3))}
                  placeholder={t('onboarding.agePlaceholder')}
                  hint={t('onboarding.ageHint')}
                  error={fieldError}
                  required
                  disabled={saving}
                />
              </div>
            ) : null}

            {step === 'gender' ? (
              <GenderStep value={gender} onChange={setGender} />
            ) : null}

            {step === 'faceShape' ? (
              <FaceShapeStep value={faceShape} onChange={setFaceShape} />
            ) : null}

            {step === 'frameSize' ? (
              <FrameSizeStep value={frameSize} onChange={setFrameSize} />
            ) : null}
        </div>
      </motion.div>

      <div className="mt-10 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={stepIndex === 0 || saving}
          className={stepIndex === 0 ? 'invisible' : undefined}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          {t('actions.back')}
        </Button>

        <Button type="button" size="lg" onClick={goNext} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {stepIndex === STEPS.length - 1 ? t('onboarding.finish') : t('actions.next')}
          {!saving && stepIndex < STEPS.length - 1 ? (
            <ArrowRight className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          ) : null}
        </Button>
      </div>
    </div>
  );
}

/* ── Chrome ────────────────────────────────────────────────────────────────── */

function ProgressHeader({ stepIndex, total }: { stepIndex: number; total: number }) {
  const { t } = useTranslation();
  const percent = ((stepIndex + 1) / total) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{t('onboarding.stepCounter', { current: stepIndex + 1, total })}</span>
        <span className="inline-flex items-center gap-1.5 text-gold-600 dark:text-gold-300">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          {t('onboarding.earnPoints', { points: LOYALTY.onboardingBonus })}
        </span>
      </div>

      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={stepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={t('onboarding.progressLabel')}
      >
        <motion.div
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
        />
      </div>
    </div>
  );
}

/**
 * The reassurance panel the brief asks for.
 *
 * Kept visible on every step rather than shown once and dismissed. Asking for
 * someone's age and gender needs a reason attached at the moment they are
 * answering, not four screens earlier.
 */
function WhyWeAsk() {
  const { t } = useTranslation();

  return (
    <div className="mt-8 flex gap-3 rounded-2xl border border-brand-200/70 bg-brand-50/50 p-4 dark:border-brand-800/70 dark:bg-brand-950/40">
      <HelpCircle
        className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-300"
        strokeWidth={1.9}
        aria-hidden="true"
      />
      <div>
        <p className="text-sm font-medium text-foreground">{t('onboarding.whyTitle')}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t('onboarding.whyBody')}
        </p>
      </div>
    </div>
  );
}

/* ── Steps ─────────────────────────────────────────────────────────────────── */

function GenderStep({
  value,
  onChange,
}: {
  value: Gender | null;
  onChange: (value: Gender) => void;
}) {
  const { t } = useTranslation();

  const options: Option<Gender>[] = GENDERS.map((genderValue) => ({
    value: genderValue,
    label: t(`attributes.gender.${genderValue}`),
  }));

  return (
    <OptionCards
      options={options}
      value={value}
      onChange={onChange}
      label={t('onboarding.steps.gender.title')}
      columns={3}
    />
  );
}

function FaceShapeStep({
  value,
  onChange,
}: {
  value: FaceShape | null;
  onChange: (value: FaceShape) => void;
}) {
  const { t } = useTranslation();

  const options: Option<FaceShape>[] = FACE_SHAPES.map((shape) => ({
    value: shape,
    label: t(`attributes.faceShape.${shape}`),
    description: t(`onboarding.faceShapeHints.${shape}`),
    visual: <FaceShapeOutline shape={shape} className="h-16 w-14" />,
  }));

  return (
    <OptionCards
      options={options}
      value={value}
      onChange={onChange}
      label={t('onboarding.steps.faceShape.title')}
      columns={3}
    />
  );
}

function FrameSizeStep({
  value,
  onChange,
}: {
  value: FrameSize | null;
  onChange: (value: FrameSize) => void;
}) {
  const { t } = useTranslation();

  const options: Option<FrameSize>[] = FRAME_SIZES.map((size) => ({
    value: size,
    label: t(`attributes.frameSize.${size}`),
    description: t(`onboarding.frameSizeHints.${size}`),
  }));

  return (
    <OptionCards
      options={options}
      value={value}
      onChange={onChange}
      label={t('onboarding.steps.frameSize.title')}
      columns={3}
    />
  );
}
