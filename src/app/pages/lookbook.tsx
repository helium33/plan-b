/**
 * Lookbook and styling guide.
 *
 * Two halves answering different questions. The gallery answers "what does this
 * look like on someone?"; the styling guide answers "what should I be looking
 * for?" — and the second is what a customer who has never bought glasses before
 * actually needs.
 *
 * Filters are toggle chips over occasion and face shape, combined with AND. The
 * face-shape filter seeds itself from the customer's Module 3 answer when they
 * have given one: a lookbook pre-filtered to your own face is considerably more
 * useful than one showing everybody's.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Play, Sparkles, Video, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FaceShapeOutline } from '@/app/components/onboarding/face-shape-guide';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { useLanguage } from '@/app/hooks/use-language';
import { LOOKS, OCCASIONS, STYLING_GUIDE, type Look, type Occasion } from '@/app/data/lookbook';
import { FACE_SHAPES, type FaceShape } from '@/lib/attributes';

export function LookbookPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { member } = useAuth();

  useDocumentTitle(t('pages.lookbook.title'));

  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [faceShape, setFaceShape] = useState<FaceShape | null>(null);
  const [openLook, setOpenLook] = useState<Look | null>(null);

  /**
   * Seed the face-shape filter from the saved profile, once.
   *
   * Not a `useState` initialiser: the member record arrives asynchronously, so at
   * first render it is usually still null. The ref stops this re-applying and
   * fighting the customer if they clear the filter themselves.
   */
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    const saved = member?.profile.faceShape;
    if (saved) {
      setFaceShape(saved);
      seeded.current = true;
    }
  }, [member]);

  const looks = useMemo(
    () =>
      LOOKS.filter(
        (look) =>
          (occasion === null || look.occasion === occasion) &&
          (faceShape === null || look.faceShapes.includes(faceShape)),
      ),
    [occasion, faceShape],
  );

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('pages.lookbook.title')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t('lookbook.intro')}
        </p>
      </header>

      <div className="mt-8 space-y-4">
        <FilterRow label={t('lookbook.occasionLabel')}>
          <Chip active={occasion === null} onClick={() => setOccasion(null)}>
            {t('lookbook.allOccasions')}
          </Chip>
          {OCCASIONS.map((value) => (
            <Chip
              key={value}
              active={occasion === value}
              onClick={() => setOccasion(occasion === value ? null : value)}
            >
              {t(`lookbook.occasions.${value}`)}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label={t('lookbook.faceShapeLabel')}>
          <Chip active={faceShape === null} onClick={() => setFaceShape(null)}>
            {t('lookbook.allFaceShapes')}
          </Chip>
          {FACE_SHAPES.map((value) => (
            <Chip
              key={value}
              active={faceShape === value}
              onClick={() => setFaceShape(faceShape === value ? null : value)}
            >
              {t(`attributes.faceShape.${value}`)}
            </Chip>
          ))}
        </FilterRow>

        {/* Shown only when the filter came from their own saved answer, so the
            page explains why it is not showing everything. */}
        {faceShape !== null && faceShape === member?.profile.faceShape ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-gold-500" strokeWidth={2} aria-hidden="true" />
            {t('lookbook.filteredToYou', { shape: t(`attributes.faceShape.${faceShape}`) })}
          </p>
        ) : null}
      </div>

      {looks.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="text-sm font-medium text-foreground">{t('lookbook.noResults')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('lookbook.noResultsBody')}</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {looks.map((look, index) => (
            <LookCard
              key={look.id}
              look={look}
              language={language}
              index={index}
              onOpen={() => setOpenLook(look)}
            />
          ))}
        </ul>
      )}

      <section className="mt-16">
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {t('lookbook.guideTitle')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t('lookbook.guideIntro')}
        </p>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STYLING_GUIDE.map((note) => {
            const copy = note[language];
            return (
              <li
                key={note.faceShape}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <FaceShapeOutline
                  shape={note.faceShape}
                  className="h-16 w-14 shrink-0 text-brand-500 dark:text-brand-300"
                />

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t(`attributes.faceShape.${note.faceShape}`)}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">{t('lookbook.lookFor')} </span>
                    {copy.look}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">{t('lookbook.avoid')} </span>
                    {copy.avoid}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          {t('lookbook.guideCaveat')}
        </p>
      </section>

      {openLook ? (
        <LookLightbox look={openLook} language={language} onClose={() => setOpenLook(null)} />
      ) : null}
    </div>
  );
}

/* ── Filters ───────────────────────────────────────────────────────────────── */

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      // `aria-pressed`, not a radiogroup: clicking the active chip clears it,
      // which is toggle behaviour rather than single-select.
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-brand-300 hover:text-foreground dark:hover:border-brand-700',
      )}
    >
      {children}
    </button>
  );
}

/* ── Gallery ───────────────────────────────────────────────────────────────── */

function LookCard({
  look,
  language,
  index,
  onOpen,
}: {
  look: Look;
  language: 'en' | 'my';
  index: number;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const copy = look[language];
  const isVideo = look.media.kind === 'video';
  const src = look.media.kind === 'video' ? look.media.poster : look.media.src;

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut', delay: Math.min(index, 6) * 0.04 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card"
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex h-full w-full flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span
          className={cn(
            'relative block w-full overflow-hidden bg-muted',
            look.featured ? 'aspect-[3/4]' : 'aspect-[4/3]',
          )}
        >
          <img
            src={src}
            alt=""
            /* Decorative: the title, outfit and reasoning are all rendered as
               text below, so describing the placeholder adds nothing. */
            aria-hidden="true"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />

          {isVideo ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-[0.7rem] font-medium text-foreground backdrop-blur">
              <Video className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
              {t('lookbook.videoBadge')}
            </span>
          ) : null}
        </span>

        <span className="flex flex-1 flex-col p-4">
          <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
            {t(`lookbook.occasions.${look.occasion}`)}
          </span>

          <span className="mt-1 text-sm font-semibold leading-snug text-foreground">
            {copy.title}
          </span>

          <span className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
            {copy.outfit}
          </span>

          <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            {isVideo ? <Play className="h-3 w-3" strokeWidth={2.4} aria-hidden="true" /> : null}
            {t('lookbook.seeDetail')}
          </span>
        </span>
      </button>
    </motion.li>
  );
}

/**
 * Detail lightbox.
 *
 * Hand-rolled rather than the Radix dialog: it needs to be dismissible three
 * ways (Escape, backdrop, close button) and to return focus to the card that
 * opened it, and wiring that through Radix's controlled API for a single modal
 * would be more code, not less.
 */
function LookLightbox({
  look,
  language,
  onClose,
}: {
  look: Look;
  language: 'en' | 'my';
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const copy = look[language];
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusTo = useRef<Element | null>(null);

  useEffect(() => {
    returnFocusTo.current = document.activeElement;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    // Stops the page scrolling behind the overlay on touch devices.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      // Focus goes back where it came from, or a keyboard user is dumped at the
      // top of the document every time they close a look.
      (returnFocusTo.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose]);

  const isVideo = look.media.kind === 'video';
  const src = look.media.kind === 'video' ? look.media.poster : look.media.src;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:flex-row"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t('actions.cancel')}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/85 text-muted-foreground backdrop-blur transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </button>

        <div className="relative w-full shrink-0 bg-muted sm:w-1/2">
          <img src={src} alt="" aria-hidden="true" className="h-full w-full object-cover" />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
            {t(`lookbook.occasions.${look.occasion}`)}
          </p>

          <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground">
            {copy.title}
          </h2>

          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-foreground">{t('lookbook.theOutfit')}</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">{copy.outfit}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">{t('lookbook.whyItWorks')}</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">{copy.why}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">{t('lookbook.suitsShapes')}</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">
                {look.faceShapes.map((shape) => t(`attributes.faceShape.${shape}`)).join(' · ')}
              </dd>
            </div>
          </dl>

          {/* Said plainly rather than shown as a dead play button. A control that
              does nothing is worse than an honest sentence. */}
          {isVideo ? (
            <p className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-muted/50 p-3.5 text-xs leading-relaxed text-muted-foreground">
              <Video className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
              {t('lookbook.videoPending')}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to={`${ROUTES.shop}?frameCode=${encodeURIComponent(look.frameCode)}`}>
                {t('lookbook.shopThisFrame', { code: look.frameCode })}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={ROUTES.booking}>{t('actions.bookAppointment')}</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
