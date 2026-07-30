/**
 * The loyalty summary: tier, balance, what it is worth, and progress upward.
 *
 * The redemption value is shown in kyat next to the point total on purpose. A
 * bare "1,250 points" is meaningless — customers discount loyalty schemes they
 * cannot price, and the whole reason the balance exists is to bring them back.
 */
import { motion } from 'motion/react';
import { Award, Store, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/components/ui/utils';
import { formatKyat, formatNumber } from '@/lib/format';
import {
  LOYALTY,
  type MemberDoc,
  type MemberTier,
  POS_MEMBERSHIP_DISCOUNT,
  nextTierProgress,
  pointsToKyat,
} from '@/lib/membership';

/**
 * Tier colours, kept out of the theme tokens on purpose — these are metal
 * colours with fixed cultural meaning, not semantic UI surfaces, so they should
 * not flip with light/dark mode.
 */
const TIER_STYLES: Record<MemberTier, { ring: string; text: string; glow: string }> = {
  Bronze: {
    ring: 'ring-amber-700/30',
    text: 'text-amber-700 dark:text-amber-500',
    glow: 'from-amber-700/15',
  },
  Silver: {
    ring: 'ring-slate-400/40',
    text: 'text-slate-500 dark:text-slate-300',
    glow: 'from-slate-400/20',
  },
  Gold: {
    ring: 'ring-gold-500/40',
    text: 'text-gold-600 dark:text-gold-300',
    glow: 'from-gold-500/20',
  },
};

export function MembershipCard({ member }: { member: MemberDoc }) {
  const { t } = useTranslation();

  const { points, lifetimePoints, tier } = member.loyalty;
  const progress = nextTierProgress(lifetimePoints);
  const style = TIER_STYLES[tier];

  const redeemable = points >= LOYALTY.minRedeemablePoints;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent',
          style.glow,
        )}
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('account.pointsBalance')}
          </p>

          <p className="mt-1.5 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight text-foreground">
              {formatNumber(points)}
            </span>
            <span className="text-sm text-muted-foreground">{t('common.points')}</span>
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {redeemable
              ? t('account.worthValue', {
                  // The currency label is translated ("MMK" / "ကျပ်"), so it has
                  // to come from the locale rather than `formatKyat`'s default.
                  value: formatKyat(pointsToKyat(points), t('common.currency')),
                })
              : t('account.minRedeem', { min: LOYALTY.minRedeemablePoints })}
          </p>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-sm font-medium ring-1',
            style.ring,
            style.text,
          )}
        >
          <Award className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          {t(`account.tiers.${tier}` as never)}
        </span>
      </div>

      {progress ? (
        <div className="relative mt-7">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t('account.nextTier', {
                points: formatNumber(progress.pointsNeeded),
                tier: t(`account.tiers.${progress.next}` as never),
              })}
            </span>
            <span>{formatNumber(lifetimePoints)}</span>
          </div>

          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={Math.round(progress.fractionComplete * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('account.tierProgressLabel')}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progress.fractionComplete * 100))}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
            />
          </div>
        </div>
      ) : (
        <p className="relative mt-7 flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-gold-500" strokeWidth={2} aria-hidden="true" />
          {t('account.topTier')}
        </p>
      )}

      {/* Only shown when the till will actually honour it. Advertising a
          discount the shop does not apply is worse than not mentioning it. */}
      {member.pos.customerType === 'Membership' ? (
        <div className="relative mt-6 flex items-start gap-2.5 rounded-xl border border-gold-500/25 bg-gold-500/5 p-3.5">
          <Store
            className="mt-0.5 h-4 w-4 shrink-0 text-gold-600 dark:text-gold-300"
            strokeWidth={2}
            aria-hidden="true"
          />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {t('account.inStoreMember', { percent: POS_MEMBERSHIP_DISCOUNT * 100 })}
            </p>
            {member.pos.customerNumber ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('account.customerNumber', { number: member.pos.customerNumber })}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
