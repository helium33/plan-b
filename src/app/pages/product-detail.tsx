/**
 * Product detail page.
 *
 * Assembles Module 7: gallery, C-number selector, lens wizard, virtual try-on,
 * reviews and the how-to-buy widget.
 *
 * ── The C-number is the axis everything turns on ───────────────────────────
 * One `activeIndex` drives the gallery, the try-on overlay, the price, the stock
 * state and the colour attached to a new review. That is the shop's own model —
 * each colourway is photographed and stocked separately — and keeping a single
 * source for it is what stops the page showing one colour's photos beside another
 * colour's availability.
 *
 * The lens wizard is collapsed behind a button rather than shown inline. It is a
 * four-step form roughly as long as the rest of the page, and a customer still
 * deciding whether they like the frame should not have to scroll past a
 * prescription form to see the reviews.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Download,
  GitCompare,
  Heart,
  Loader2,
  PackageX,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ProductGallery } from '@/app/components/product/gallery';
import { HowToBuy } from '@/app/components/product/how-to-buy';
import { LensWizard } from '@/app/components/product/lens-wizard';
import { ReviewsSection } from '@/app/components/product/reviews-section';
import { VirtualTryOn } from '@/app/components/product/try-on';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import { ROUTES } from '@/app/config/navigation';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { useWishlist } from '@/app/hooks/use-wishlist';
import { MAX_COMPARE, useCompareStore } from '@/app/stores/compare-store';
import { useCartStore } from '@/app/stores/cart-store';
import { getFrame } from '@/lib/firestore/frames';
import { downloadWatermarked, watermarkFileName } from '@/lib/watermark';
import { formatKyat } from '@/lib/format';
import { type FrameDoc, frameDisplayName, isInStock } from '@/lib/product';
import type { LensSelection } from '@/lib/prescription';

export function ProductDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const [frame, setFrame] = useState<FrameDoc | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [activeIndex, setActiveIndex] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [quoted, setQuoted] = useState<{ selection: LensSelection; totalKyat: number } | null>(null);
  const [addState, setAddState] = useState<'idle' | 'added' | 'full'>('idle');
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useDocumentTitle(frame ? frameDisplayName(frame) : t('pages.product.title'));

  useEffect(() => {
    if (!id) {
      setStatus('missing');
      return;
    }

    let active = true;
    setStatus('loading');

    getFrame(id)
      .then((result) => {
        if (!active) return;
        if (result) {
          setFrame(result);
          // Open on a colour that can actually be bought.
          const first = result.variants.findIndex((variant) => variant.inStock);
          setActiveIndex(first === -1 ? 0 : first);
          setStatus('ready');
        } else {
          setStatus('missing');
        }
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [id]);

  const wishlist = useWishlist();
  const compare = useCompareStore();
  const cart = useCartStore();

  const variant = frame?.variants[activeIndex];
  const saved = frame ? wishlist.has(frame.id) : false;
  const inCompare = frame ? compare.ids.includes(frame.id) : false;
  const compareDisabled = !inCompare && compare.ids.length >= MAX_COMPARE;

  const discounted = useMemo(
    () => Boolean(frame && frame.compareAtPrice !== null && frame.compareAtPrice > frame.price),
    [frame],
  );

  if (status === 'loading') {
    return (
      <div className="container-page grid flex-1 place-items-center py-24">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t('common.loading')}
        </p>
      </div>
    );
  }

  if (status === 'missing' || status === 'error') {
    return (
      <div className="container-page py-20 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground">
          <PackageX className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          {status === 'missing' ? t('product.notFound') : t('common.error')}
        </h1>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          {status === 'missing' ? t('product.notFoundBody') : t('common.errorBody')}
        </p>
        <Button asChild className="mt-5">
          <Link to={ROUTES.shop}>{t('product.backToShop')}</Link>
        </Button>
      </div>
    );
  }

  if (!frame) return null;

  const available = isInStock(frame);

  return (
    <div className="container-page py-8 sm:py-12">
      <Link
        to={ROUTES.shop}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
        {t('product.backToShop')}
      </Link>

      {/* ── Gallery + buying panel ────────────────────────────────────────── */}
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <ProductGallery variant={variant} frameName={frameDisplayName(frame)} />

          {/*
            Watermarking is a *download* action, not a display one — the gallery
            above stays clean and crisp for browsing, and the mark is applied to
            the file that gets saved and shared. See lib/watermark.ts for why a
            watermark cannot prevent theft, only attribute it.
          */}
          {variant?.images[0] ? (
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  setSaveFailed(false);
                  try {
                    await downloadWatermarked(
                      variant.images[0],
                      watermarkFileName(frame.brand, frame.frameCode, variant.cNumber),
                      { caption: `${frame.frameCode} · ${variant.cNumber}` },
                    );
                  } catch {
                    setSaveFailed(true);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
                )}
                {t('watermark.save')}
              </Button>

              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {saveFailed ? (
                  <span role="alert" className="text-destructive">
                    {t('watermark.failed')}
                  </span>
                ) : (
                  t('watermark.hint')
                )}
              </p>
            </div>
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {frame.brand}
          </p>

          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {frameDisplayName(frame)}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
            {t('product.frameCode', { code: frame.frameCode })}
          </p>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-semibold text-foreground">
              {formatKyat(frame.price, t('common.currency'))}
            </span>
            {discounted ? (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  {formatKyat(frame.compareAtPrice!, t('common.currency'))}
                </span>
                <span className="rounded-full bg-destructive px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-white">
                  {t('product.percentOff', {
                    percent: Math.round(
                      ((frame.compareAtPrice! - frame.price) / frame.compareAtPrice!) * 100,
                    ),
                  })}
                </span>
              </>
            ) : null}
          </div>

          <p className="mt-1 text-xs text-muted-foreground">{t('product.frameOnlyNote')}</p>

          {/* ── C-number selector ─────────────────────────────────────────── */}
          {frame.variants.length > 0 ? (
            <div className="mt-6">
              <p className="text-sm font-medium text-foreground">
                {t('product.colourLabel')}
                {variant ? (
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    {variant.colorName} · {variant.cNumber}
                  </span>
                ) : null}
              </p>

              <div
                role="radiogroup"
                aria-label={t('product.colours')}
                className="mt-2.5 flex flex-wrap gap-2"
              >
                {frame.variants.map((option, index) => (
                  <button
                    key={option.cNumber}
                    type="button"
                    role="radio"
                    aria-checked={index === activeIndex}
                    aria-label={`${option.colorName} (${option.cNumber})${
                      option.inStock ? '' : ` — ${t('product.outOfStock')}`
                    }`}
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      'relative grid h-11 w-11 place-items-center rounded-full border-2 transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      index === activeIndex
                        ? 'border-primary ring-2 ring-primary/25'
                        : 'border-border hover:border-muted-foreground',
                      // Out-of-stock colours stay selectable so the customer can
                      // see them — knowing a colour exists but is unavailable is
                      // more useful than it silently vanishing.
                      !option.inStock && 'opacity-45',
                    )}
                    style={{ backgroundColor: option.swatch }}
                  >
                    {index === activeIndex ? (
                      <Check className="h-4 w-4 text-white drop-shadow" strokeWidth={3} aria-hidden="true" />
                    ) : null}
                  </button>
                ))}
              </div>

              {variant && !variant.inStock ? (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                  {t('product.colourOutOfStock')}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="mt-7 space-y-2.5">
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={!available}
              onClick={() => setWizardOpen(true)}
            >
              <Ruler className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
              {available ? t('product.chooseLenses') : t('product.outOfStock')}
            </Button>

            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => wishlist.toggle(frame.id)}
                aria-pressed={saved}
              >
                <Heart
                  className={cn('h-4 w-4', saved && 'text-destructive')}
                  fill={saved ? 'currentColor' : 'none'}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
                {saved ? t('product.saved') : t('actions.wishlist')}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={compareDisabled}
                onClick={() => compare.toggle(frame.id)}
                aria-pressed={inCompare}
              >
                <GitCompare className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
                {inCompare ? t('product.inCompare') : t('actions.compare')}
              </Button>
            </div>
          </div>

          {/* Reassurance, and all of it true — free fitting and adjustment are
              stated on the booking page too. */}
          <ul className="mt-6 space-y-2 border-t border-border pt-5">
            {(['fitting', 'adjust', 'verify'] as const).map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldCheck
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {t(`product.assurances.${item}`)}
              </li>
            ))}
          </ul>

          {/* ── Attributes ────────────────────────────────────────────────── */}
          <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-border pt-5 sm:grid-cols-2">
            <Attribute label={t('shop.facets.frameSize')} value={t(`attributes.frameSize.${frame.frameSize}`)} />
            <Attribute label={t('shop.facets.material')} value={t(`attributes.material.${frame.material}`)} />
            <Attribute
              label={t('compare.faceShapes')}
              value={frame.faceShapes.map((shape) => t(`attributes.faceShape.${shape}`)).join(' · ') || '—'}
            />
            <Attribute
              label={t('shop.facets.comfort')}
              value={
                frame.comfortFeatures.map((feature) => t(`attributes.comfort.${feature}`)).join(' · ') || '—'
              }
            />
          </dl>

          {frame.description ? (
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{frame.description}</p>
          ) : null}
        </motion.div>
      </div>

      {/* ── Lens wizard ───────────────────────────────────────────────────── */}
      {wizardOpen ? (
        <div className="mt-10" id="lens-wizard">
          <LensWizard
            framePriceKyat={frame.price}
            onComplete={(selection, totalKyat) => {
              setQuoted({ selection, totalKyat });
              setWizardOpen(false);
            }}
          />
        </div>
      ) : null}

      {/* Quote summary. Checkout itself is Module 8, so this stops at a total and
          says so rather than offering a button that does nothing. */}
      {quoted ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          role="status"
          className="mt-8 rounded-2xl border border-emerald-600/30 bg-emerald-600/5 p-5"
        >
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} aria-hidden="true" />
            {t('product.quoteReady')}
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-foreground">
            {formatKyat(quoted.totalKyat, t('common.currency'))}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={addState === 'added'}
              onClick={() => {
                const outcome = cart.add({
                  frameId: frame.id,
                  frameName: frameDisplayName(frame),
                  brand: frame.brand,
                  frameCode: frame.frameCode,
                  cNumber: variant?.cNumber ?? '',
                  colorName: variant?.colorName ?? '',
                  framePriceKyat: frame.price,
                  image: variant?.images[0] ?? null,
                  lens: quoted.selection,
                  lineTotalKyat: quoted.totalKyat,
                });
                setAddState(outcome);
              }}
            >
              {addState === 'added' ? (
                <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
              ) : (
                <ShoppingBag className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
              )}
              {addState === 'added' ? t('product.addedToBag') : t('product.addToBag')}
            </Button>

            {addState === 'added' ? (
              <Button asChild variant="outline" size="sm">
                <Link to={ROUTES.cart}>{t('product.viewBag')}</Link>
              </Button>
            ) : null}

            <Button variant="ghost" size="sm" onClick={() => setWizardOpen(true)}>
              {t('product.editLenses')}
            </Button>
          </div>

          {addState === 'full' ? (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {t('product.bagFull')}
            </p>
          ) : null}
        </motion.div>
      ) : null}

      {/* ── Try-on, reviews, help ─────────────────────────────────────────── */}
      <div className="mt-12 space-y-8">
        <VirtualTryOn
          frameImage={variant?.images[0] ?? null}
          frameName={frameDisplayName(frame)}
        />

        <ReviewsSection frameId={frame.id} cNumber={variant?.cNumber ?? null} />

        <HowToBuy />
      </div>
    </div>
  );
}

function Attribute({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}
