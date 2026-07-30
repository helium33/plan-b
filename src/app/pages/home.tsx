/**
 * The landing page.
 *
 * Ordered by what a first-time visitor needs, not by what the shop most wants to
 * say: what this is (hero) → what is coming (countdown) → what frames look like
 * on a person (lookbook rail) → why to trust us (eye care) → how to visit
 * (store). The trust strip that used to sit directly under the hero moved to the
 * end, because a row of links is a poor thing to meet before any content.
 */
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Clock, Eye, Glasses, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CountdownTeaser } from '@/app/components/home/countdown-teaser';
import { Button } from '@/app/components/ui/button';
import { ROUTES } from '@/app/config/navigation';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { useLanguage } from '@/app/hooks/use-language';
import { EYE_CARE_TIPS } from '@/app/data/eye-care-tips';
import { LOOKS } from '@/app/data/lookbook';
import { STORE, formatMinutes, openState, telHref } from '@/config/store';

export function HomePage() {
  useDocumentTitle();

  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <CountdownTeaser />
      <LookbookRail />
      <EyeCarePreview />
      <VisitStrip />
      <TrustStrip />
    </div>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────────────── */

function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Ambient brand wash — pure CSS, so it costs nothing to load and adapts to
          both themes without a second asset. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_15%_0%,var(--brand-100)_0%,transparent_60%),radial-gradient(50%_50%_at_100%_20%,var(--gold-300)_0%,transparent_55%)] opacity-60 dark:opacity-[0.14]"
      />

      <div className="container-page relative grid gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-gold-500" strokeWidth={2} aria-hidden="true" />
            {t('brand.name')}
          </span>

          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
            {t('brand.tagline')}
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('brand.shortDescription')}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link to={ROUTES.shop}>
                {t('actions.shopNow')}
                <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="rounded-full px-6">
              <Link to={ROUTES.booking}>{t('actions.bookAppointment')}</Link>
            </Button>
          </div>

          {/* Small proof points. The tip and look counts are read from the data
              rather than typed, so they cannot drift out of date. */}
          <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
            {[
              { value: String(EYE_CARE_TIPS.length), label: t('home.stats.tips') },
              { value: String(LOOKS.length), label: t('home.stats.looks') },
              { value: t('home.stats.fittingValue'), label: t('home.stats.fitting') },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block text-xl font-semibold text-foreground">{stat.value}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{stat.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>

        {/* Hero visual, built from the lookbook's first featured look so the page
            shows a frame on a face rather than an icon in a box. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-muted via-card to-muted shadow-sm"
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}

/** The first featured look, or a glasses glyph if the lookbook is ever emptied. */
function HeroVisual() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const look = LOOKS.find((entry) => entry.featured);
  const src = look ? (look.media.kind === 'video' ? look.media.poster : look.media.src) : null;

  if (!look || !src) {
    return (
      <div className="absolute inset-0 grid place-items-center">
        <Glasses
          className="h-28 w-28 text-muted-foreground/25 sm:h-36 sm:w-36"
          strokeWidth={1.1}
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <>
      <img src={src} alt="" aria-hidden="true" className="h-full w-full object-cover" />

      <Link
        to={ROUTES.lookbook}
        className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-background/85 px-4 py-3 backdrop-blur transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">
            {look[language].title}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {t('home.fromLookbook')}
          </span>
        </span>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-muted-foreground"
          strokeWidth={2}
          aria-hidden="true"
        />
      </Link>
    </>
  );
}

/* ── Lookbook rail ─────────────────────────────────────────────────────────── */

/**
 * Four looks, linking through to the full gallery.
 *
 * A native horizontal scroller on mobile, a grid above it — not a carousel with
 * arrows. On a phone the swipe is already the better interaction, and on desktop
 * there is room to show all four at once, so the arrows would control nothing.
 */
function LookbookRail() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const looks = LOOKS.slice(0, 4);

  return (
    <section className="container-page py-14 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t('home.lookbookTitle')}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {t('home.lookbookBody')}
          </p>
        </div>

        <Button asChild variant="ghost" size="sm">
          <Link to={ROUTES.lookbook}>
            {t('actions.viewAll')}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <ul className="no-scrollbar mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
        {looks.map((look, index) => {
          const src = look.media.kind === 'video' ? look.media.poster : look.media.src;

          return (
            <motion.li
              key={look.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
              className="w-[70%] shrink-0 snap-start sm:w-auto"
            >
              <Link
                to={ROUTES.lookbook}
                className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:border-brand-700"
              >
                <span className="block aspect-[4/5] overflow-hidden bg-muted">
                  <img
                    src={src}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </span>

                <span className="block p-4">
                  <span className="block text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`lookbook.occasions.${look.occasion}`)}
                  </span>
                  <span className="mt-1 block text-sm font-medium leading-snug text-foreground">
                    {look[language].title}
                  </span>
                </span>
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}

/* ── Eye care preview ──────────────────────────────────────────────────────── */

/**
 * Three tips, rotating daily.
 *
 * Chosen by day-of-year rather than at random. A random pick would change on
 * every render — including on every navigation back to the home page — which
 * reads as flicker rather than freshness. This gives something new each day and
 * stays stable within a visit.
 */
function EyeCarePreview() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const dayOfYear = Math.floor(
    (Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 0)) / 86_400_000,
  );

  const tips = [0, 1, 2].map(
    (offset) => EYE_CARE_TIPS[(dayOfYear * 3 + offset) % EYE_CARE_TIPS.length],
  );

  return (
    <section className="border-y border-border bg-muted/30">
      <div className="container-page py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {t('home.eyeCareTitle')}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t('home.eyeCareBody', { count: EYE_CARE_TIPS.length })}
            </p>
          </div>

          <Button asChild variant="ghost" size="sm">
            <Link to={ROUTES.eyeCare}>
              {t('actions.viewAll')}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <ul className="mt-7 grid gap-4 sm:grid-cols-3">
          {tips.map((tip, index) => (
            <motion.li
              key={tip.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.06 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                <Eye className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <h3 className="mt-3.5 text-sm font-semibold leading-snug text-foreground">
                {tip[language].title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {tip[language].body}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Visit strip ───────────────────────────────────────────────────────────── */

/** Address, today's hours and a booking CTA, read live from the store config. */
function VisitStrip() {
  const { t } = useTranslation();
  const state = openState();

  return (
    <section className="container-page py-14 sm:py-20">
      <div className="grid gap-8 rounded-3xl border border-border bg-card p-8 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t('home.visitTitle')}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {t('home.visitBody')}
          </p>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.9} aria-hidden="true" />
              {STORE.addressLines[0]}, {STORE.city}
            </p>

            <p className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" strokeWidth={1.9} aria-hidden="true" />
              <span dir="ltr">
                {state.open
                  ? t('booking.openUntil', { time: formatMinutes(state.closesAt) })
                  : t('booking.closedNow')}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button asChild size="lg" className="rounded-full px-6">
            <Link to={ROUTES.booking}>{t('actions.bookAppointment')}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-6">
            <a href={telHref()}>{t('booking.callShop')}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ── Trust strip ───────────────────────────────────────────────────────────── */

/** Three reasons to trust the shop, linking to the pages that back them up. */
function TrustStrip() {
  const { t } = useTranslation();

  const items = [
    { icon: Eye, key: 'eyeCare' as const, to: ROUTES.eyeCare },
    { icon: Glasses, key: 'shop' as const, to: ROUTES.shop },
    { icon: ShieldCheck, key: 'booking' as const, to: ROUTES.booking },
  ];

  return (
    <section className="container-page pb-16 sm:pb-24">
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map(({ icon: Icon, key, to }, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.06 }}
          >
            <Link
              to={to}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:border-brand-700"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300">
                <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
              </span>

              <h2 className="mt-4 text-base font-medium text-foreground">
                {t(`pages.${key}.title`)}
              </h2>

              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {t(`pages.${key}.description`)}
              </p>

              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                {t('actions.learnMore')}
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
