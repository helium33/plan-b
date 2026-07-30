/**
 * "Frames for you" — the payoff for filling in the personalisation form.
 *
 * Results are split into exact matches and close alternatives rather than shown
 * as one ranked list. A single list forces a choice between two bad options:
 * cut it short and show three frames, or pad it and quietly present a frame that
 * suits nobody as though it were a match. Two labelled groups let the page be
 * honest about which is which.
 *
 * Guarded by `RequireMember`, so the profile is available. A customer who somehow
 * arrives before completing the form is sent back to it rather than shown an
 * empty page.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2, PartyPopper, Pencil, SearchX, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ProductCard } from '@/app/components/product/product-card';
import { Button } from '@/app/components/ui/button';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { listFrames } from '@/lib/firestore/frames';
import { formatNumber } from '@/lib/format';
import { hasCompletedOnboarding } from '@/lib/membership';
import {
  type FrameDoc,
  type Recommendations,
  recommendFrames,
} from '@/lib/product';

export function RecommendationsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const { member } = useAuth();

  useDocumentTitle(t('recommendations.title'));

  const [frames, setFrames] = useState<FrameDoc[] | null>(null);
  const [failed, setFailed] = useState(false);

  /** Passed from the onboarding form on the redirect that follows completion. */
  const arrival = location.state as
    | { justCompleted?: boolean; bonusAwarded?: number }
    | null;

  useEffect(() => {
    let active = true;

    listFrames()
      .then((result) => {
        if (active) setFrames(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const results: Recommendations | null = useMemo(() => {
    if (!frames || !member) return null;

    return recommendFrames(frames, {
      faceShape: member.profile.faceShape,
      frameSize: member.profile.frameSize,
      gender: member.profile.gender,
      age: member.profile.age,
    });
  }, [frames, member]);

  // Nothing to recommend against. Better to send them to the form than to show a
  // page whose entire premise is answers they have not given.
  if (member && !hasCompletedOnboarding(member)) {
    return <Navigate to={ROUTES.onboarding} replace />;
  }

  const profile = member?.profile;

  return (
    <div className="container-page py-10 sm:py-14">
      {arrival?.justCompleted ? (
        <CompletionBanner bonusAwarded={arrival.bonusAwarded ?? 0} />
      ) : null}

      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t('recommendations.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t('recommendations.description')}
          </p>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.onboarding}>
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
            {t('recommendations.editAnswers')}
          </Link>
        </Button>
      </motion.header>

      {/* The answers driving the page, shown as chips. Recommendations that do
          not say what they are based on invite "why am I seeing this?" */}
      {profile ? (
        <ul className="mt-5 flex flex-wrap gap-2">
          {profile.faceShape ? (
            <ProfileChip label={t('recommendations.chips.faceShape')} value={t(`attributes.faceShape.${profile.faceShape}`)} />
          ) : null}
          {profile.frameSize ? (
            <ProfileChip label={t('recommendations.chips.frameSize')} value={t(`attributes.frameSize.${profile.frameSize}`)} />
          ) : null}
          {profile.gender ? (
            <ProfileChip label={t('recommendations.chips.gender')} value={t(`attributes.gender.${profile.gender}`)} />
          ) : null}
          {profile.age !== null ? (
            <ProfileChip label={t('recommendations.chips.age')} value={formatNumber(profile.age)} />
          ) : null}
        </ul>
      ) : null}

      {frames === null && !failed ? <LoadingState /> : null}
      {failed ? <ErrorState /> : null}

      {results ? (
        <div className="mt-10 space-y-14">
          {results.exact.length > 0 ? (
            <Section
              title={t('recommendations.exactTitle')}
              subtitle={t('recommendations.exactSubtitle', { count: results.exact.length })}
              icon={Sparkles}
            >
              {results.exact.map(({ frame, reasons }) => (
                <ProductCard key={frame.id} frame={frame} reasons={reasons} />
              ))}
            </Section>
          ) : (
            <NoExactMatches />
          )}

          {results.alternatives.length > 0 ? (
            <Section
              title={t('recommendations.alternativesTitle')}
              subtitle={t('recommendations.alternativesSubtitle')}
            >
              {results.alternatives.map(({ frame, reasons }) => (
                <ProductCard key={frame.id} frame={frame} reasons={reasons} />
              ))}
            </Section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ── Pieces ────────────────────────────────────────────────────────────────── */

function ProfileChip({ label, value }: { label: string; value: string }) {
  return (
    <li className="inline-flex items-baseline gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </li>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon?: typeof Sparkles;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2">
        {Icon ? (
          <Icon className="h-4 w-4 text-gold-500" strokeWidth={2} aria-hidden="true" />
        ) : null}
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

/**
 * Celebrates the points just earned.
 *
 * Only rendered when `saveMemberProfile` reported a non-zero bonus, so a
 * customer re-editing their answers is not congratulated for points they did not
 * receive the second time.
 */
function CompletionBanner({ bonusAwarded }: { bonusAwarded: number }) {
  const { t } = useTranslation();
  if (bonusAwarded <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      role="status"
      className="mb-8 flex items-start gap-3 rounded-2xl border border-gold-500/30 bg-gold-500/10 p-4"
    >
      <PartyPopper
        className="mt-0.5 h-5 w-5 shrink-0 text-gold-600 dark:text-gold-300"
        strokeWidth={1.9}
        aria-hidden="true"
      />
      <div>
        <p className="text-sm font-medium text-foreground">
          {t('recommendations.bonusTitle', { points: formatNumber(bonusAwarded) })}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t('recommendations.bonusBody')}
        </p>
      </div>
    </motion.div>
  );
}

function LoadingState() {
  const { t } = useTranslation();

  return (
    <p className="mt-12 flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {t('recommendations.loading')}
    </p>
  );
}

function ErrorState() {
  const { t } = useTranslation();

  return (
    <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-center">
      <p className="text-sm font-medium text-foreground">{t('common.error')}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t('common.errorBody')}</p>
    </div>
  );
}

/**
 * Shown when nothing matches every answer.
 *
 * Names the likely cause — an empty catalogue — because during setup that is
 * exactly what it is, and "no matches" would send someone hunting through the
 * scoring code for a bug that is really just unseeded data.
 */
function NoExactMatches() {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground">
        <SearchX className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-medium text-foreground">
        {t('recommendations.noExactTitle')}
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
        {t('recommendations.noExactBody')}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.onboarding}>{t('recommendations.editAnswers')}</Link>
        </Button>
        <Button asChild size="sm">
          <Link to={ROUTES.shop}>{t('actions.shopNow')}</Link>
        </Button>
      </div>
    </div>
  );
}
