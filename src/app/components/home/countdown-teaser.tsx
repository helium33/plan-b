/**
 * The "New Arrivals" countdown.
 *
 * Ticks on `setInterval`, not `requestAnimationFrame`. A clock needs one update
 * per second, whereas rAF fires sixty times a second and is throttled to zero in
 * a background tab — which would leave the countdown visibly stale the moment
 * someone switched tabs and came back. `setInterval` keeps running (throttled to
 * roughly once a second at worst), and the value is recomputed from the target
 * timestamp on every tick rather than decremented, so drift cannot accumulate.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/app/config/navigation';
import { Button } from '@/app/components/ui/button';
import { LAUNCH, type CountdownParts, countdownTo } from '@/config/launch';
import { STORE_TIMEZONE } from '@/config/store';

export function CountdownTeaser() {
  const { t, i18n } = useTranslation();
  const [parts, setParts] = useState<CountdownParts>(() => countdownTo(LAUNCH.targetIso));

  useEffect(() => {
    if (!LAUNCH.enabled) return;

    const tick = () => setParts(countdownTo(LAUNCH.targetIso));

    // Recompute immediately as well as on the interval: mounting can happen
    // mid-second, and re-focusing a throttled tab should not wait a full second
    // to show the truth.
    tick();
    const id = window.setInterval(tick, 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (!LAUNCH.enabled) return null;

  const units: Array<{ key: 'days' | 'hours' | 'minutes' | 'seconds'; value: number }> = [
    { key: 'days', value: parts.days },
    { key: 'hours', value: parts.hours },
    { key: 'minutes', value: parts.minutes },
    { key: 'seconds', value: parts.seconds },
  ];

  const launchDate = new Intl.DateTimeFormat(i18n.resolvedLanguage === 'my' ? 'my-MM' : 'en-GB', {
    timeZone: STORE_TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn',
  }).format(new Date(LAUNCH.targetIso));

  return (
    <section className="relative overflow-hidden border-y border-border bg-brand-950 dark">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_15%_0%,var(--brand-700)_0%,transparent_60%),radial-gradient(50%_60%_at_95%_100%,var(--gold-600)_0%,transparent_55%)] opacity-45"
      />

      <div className="container-page relative grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-gold-300 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            {t('countdown.badge')}
          </span>

          <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            {parts.launched ? t('countdown.launchedTitle') : t('countdown.title')}
          </h2>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70">
            {parts.launched
              ? t('countdown.launchedBody')
              : t('countdown.body', { date: launchDate })}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={parts.launched ? ROUTES.shop : ROUTES.lookbook}>
                {parts.launched ? t('countdown.shopNewArrivals') : t('countdown.previewLookbook')}
                <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg">
              <Link to={ROUTES.booking}>{t('actions.bookAppointment')}</Link>
            </Button>
          </div>
        </motion.div>

        {!parts.launched ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
            /*
              One live region for the whole clock rather than four.
              `aria-live="off"` because a countdown announcing itself every second
              would make the page unusable with a screen reader; the full
              remaining time is exposed once, as a label, via `role="timer"`.
            */
            role="timer"
            aria-live="off"
            aria-label={t('countdown.remaining', {
              days: parts.days,
              hours: parts.hours,
              minutes: parts.minutes,
            })}
            className="grid grid-cols-4 gap-2 sm:gap-3"
          >
            {units.map(({ key, value }) => (
              <div
                key={key}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-2 py-5 text-center backdrop-blur sm:py-7"
              >
                <span className="block text-3xl font-semibold tabular-nums text-white sm:text-4xl">
                  {/* Padded so the box does not resize as digits change — an
                      unpadded seconds column jitters the whole row every 10s. */}
                  {String(value).padStart(2, '0')}
                </span>
                <span className="mt-1.5 block text-[0.7rem] font-medium uppercase tracking-wider text-white/50">
                  {t(`countdown.units.${key}`)}
                </span>
              </div>
            ))}
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
