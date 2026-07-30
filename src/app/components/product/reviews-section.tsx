/**
 * Customer reviews, with the photos they sent in.
 *
 * Photos are the point. "Comfortable and light" is worth something; a picture of
 * the frame on a face shaped like yours is worth considerably more, and it is the
 * one thing a product photograph on a white background cannot show.
 *
 * Reviews arrive as `pending` and appear only once staff publish them — see the
 * note in `lib/firestore/reviews.ts`. The UI says so on submission, because a
 * customer who writes a review and cannot find it assumes it was lost.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MessageSquarePlus, Star, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { cn } from '@/app/components/ui/utils';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useLanguage } from '@/app/hooks/use-language';
import { formatDate } from '@/lib/format';
import {
  type ReviewDoc,
  listReviews,
  ratingDistribution,
  submitReview,
  summariseRatings,
} from '@/lib/firestore/reviews';

export function ReviewsSection({
  frameId,
  cNumber,
}: {
  frameId: string;
  /** The colour currently selected, attached to a new review. */
  cNumber: string | null;
}) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { isSignedIn, member, phoneKey, user } = useAuth();

  const [reviews, setReviews] = useState<ReviewDoc[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [writing, setWriting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setReviews(null);
    setFailed(false);

    listReviews(frameId)
      .then((result) => {
        if (active) setReviews(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [frameId]);

  const summary = reviews ? summariseRatings(reviews) : null;
  const distribution = reviews ? ratingDistribution(reviews) : null;

  /** Every published photo across all reviews, for the strip at the top. */
  const allPhotos = (reviews ?? []).flatMap((review) => review.photos);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{t('reviews.title')}</h2>
          {summary ? (
            <div className="mt-2 flex items-center gap-2">
              <Stars value={summary.average} />
              <span className="text-sm font-medium text-foreground" dir="ltr">
                {summary.average.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                {t('reviews.count', { count: summary.count })}
              </span>
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-muted-foreground">{t('reviews.none')}</p>
          )}
        </div>

        {!writing && !submitted ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setWriting(true)}>
            <MessageSquarePlus className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
            {t('reviews.write')}
          </Button>
        ) : null}
      </div>

      {/* Rating distribution — only worth showing once there is more than one. */}
      {distribution && summary && summary.count > 1 ? (
        <ul className="mt-5 space-y-1.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars - 1];
            const percent = summary.count > 0 ? (count / summary.count) * 100 : 0;

            return (
              <li key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-8 shrink-0 tabular-nums text-muted-foreground" dir="ltr">
                  {stars}★
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-gold-500"
                    style={{ width: `${percent}%` }}
                  />
                </span>
                <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
                  {count}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* Photo strip. Placed above the written reviews because it is what people
          scan first, and scrolling past ten paragraphs to find it defeats it. */}
      {allPhotos.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('reviews.customerPhotos', { count: allPhotos.length })}
          </p>
          <ul className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1">
            {allPhotos.map((photo, index) => (
              <li key={`${photo}-${index}`} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setLightbox(photo)}
                  aria-label={t('reviews.viewPhoto', { number: index + 1 })}
                  className="block h-20 w-20 overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <img src={photo} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {writing ? (
        <ReviewForm
          frameId={frameId}
          cNumber={cNumber}
          canSubmit={isSignedIn && Boolean(phoneKey)}
          authorName={member?.profile.name ?? member?.displayName ?? user?.displayName ?? ''}
          uid={user?.uid ?? ''}
          phoneKey={phoneKey ?? ''}
          onCancel={() => setWriting(false)}
          onSubmitted={() => {
            setWriting(false);
            setSubmitted(true);
          }}
        />
      ) : null}

      {submitted ? (
        <p role="status" className="mt-5 rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-4 text-sm leading-relaxed text-foreground">
          {t('reviews.submitted')}
        </p>
      ) : null}

      {/* Written reviews */}
      {reviews === null && !failed ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t('common.loading')}
        </p>
      ) : null}

      {failed ? (
        <p className="mt-6 text-sm text-muted-foreground">{t('common.errorBody')}</p>
      ) : null}

      {reviews && reviews.length > 0 ? (
        <ul className="mt-6 space-y-5 border-t border-border pt-5">
          {reviews.map((review, index) => (
            <li key={`${review.uid}-${index}`}>
              <div className="flex flex-wrap items-center gap-2">
                <Stars value={review.rating} />
                <span className="text-sm font-medium text-foreground">{review.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(review.createdAt, language)}
                </span>
                {review.cNumber ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] text-muted-foreground">
                    {review.cNumber}
                  </span>
                ) : null}
              </div>

              {review.title ? (
                <p className="mt-1.5 text-sm font-medium text-foreground">{review.title}</p>
              ) : null}
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{review.body}</p>

              {review.photos.length > 0 ? (
                <ul className="mt-2.5 flex gap-2">
                  {review.photos.map((photo, photoIndex) => (
                    <li key={photo}>
                      <button
                        type="button"
                        onClick={() => setLightbox(photo)}
                        aria-label={t('reviews.viewPhoto', { number: photoIndex + 1 })}
                        className="block h-16 w-16 overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <img src={photo} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {lightbox ? <PhotoLightbox src={lightbox} onClose={() => setLightbox(null)} /> : null}
    </section>
  );
}

/* ── Stars ─────────────────────────────────────────────────────────────────── */

/**
 * Five stars, filled to `value`.
 *
 * The numeric value is also rendered as text by the caller, and this carries an
 * `aria-label`, so a screen reader gets the rating once as a number rather than
 * five times as "star".
 */
function Stars({ value }: { value: number }) {
  const { t } = useTranslation();

  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={t('reviews.stars', { rating: value })}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn('h-3.5 w-3.5', star <= Math.round(value) ? 'text-gold-500' : 'text-muted-foreground/30')}
          fill={star <= Math.round(value) ? 'currentColor' : 'none'}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/* ── Write a review ────────────────────────────────────────────────────────── */

function ReviewForm({
  frameId,
  cNumber,
  canSubmit,
  authorName,
  uid,
  phoneKey,
  onCancel,
  onSubmitted,
}: {
  frameId: string;
  cNumber: string | null;
  canSubmit: boolean;
  authorName: string;
  uid: string;
  phoneKey: string;
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const { t } = useTranslation();

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  if (!canSubmit) {
    return (
      <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{t('reviews.signInRequired')}</p>
        <Button asChild size="sm" className="mt-3">
          <Link to={ROUTES.signIn}>{t('actions.signIn')}</Link>
        </Button>
      </div>
    );
  }

  const submit = async () => {
    if (!body.trim()) return;

    setSaving(true);
    setError(false);

    try {
      await submitReview({
        frameId,
        cNumber,
        uid,
        phoneKey,
        authorName: authorName || t('reviews.anonymous'),
        rating,
        title,
        body,
        // Photo upload deliberately omitted for now: it needs the compression and
        // Storage pipeline wired to a per-user path, and shipping the written
        // review first is more useful than shipping neither.
        photos: [],
      });
      onSubmitted();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-5 space-y-4 rounded-xl border border-border bg-muted/30 p-4">
      <fieldset>
        <legend className="text-sm font-medium text-foreground">{t('reviews.ratingLabel')}</legend>
        <div role="radiogroup" aria-label={t('reviews.ratingLabel')} className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={t('reviews.stars', { rating: star })}
              onClick={() => setRating(star)}
              className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star
                className={cn('h-6 w-6', star <= rating ? 'text-gold-500' : 'text-muted-foreground/30')}
                fill={star <= rating ? 'currentColor' : 'none'}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="review-title" className="block text-sm font-medium text-foreground">
          {t('reviews.titleLabel')}
        </label>
        <Input
          id="review-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          placeholder={t('reviews.titlePlaceholder')}
          disabled={saving}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="review-body" className="block text-sm font-medium text-foreground">
          {t('reviews.bodyLabel')}
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          maxLength={1500}
          placeholder={t('reviews.bodyPlaceholder')}
          disabled={saving}
          className="w-full resize-y rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {t('common.errorBody')}
        </p>
      ) : null}

      <p className="text-xs leading-relaxed text-muted-foreground">{t('reviews.moderationNote')}</p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={saving || !body.trim()} onClick={() => void submit()}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
          {t('reviews.submit')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          {t('actions.cancel')}
        </Button>
      </div>
    </div>
  );
}

/* ── Photo lightbox ────────────────────────────────────────────────────────── */

function PhotoLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const { t } = useTranslation();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <div role="dialog" aria-modal="true" aria-label={t('reviews.photoDialog')} className="relative max-h-[90vh] max-w-3xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('actions.cancel')}
          className="absolute -top-11 right-0 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </button>

        <img src={src} alt="" aria-hidden="true" className="max-h-[85vh] rounded-xl object-contain" />
      </div>
    </div>
  );
}
