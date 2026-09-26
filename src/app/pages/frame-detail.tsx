/**
 * One frame, full screen — photos, specifications, and the C-colour order panel.
 *
 * This is where a wholesale order is actually entered. The grid is for finding a
 * model; this page is for deciding how many of each colour to take, which needs
 * room the grid does not have: a big photo that changes as colours are touched,
 * every C-number on one line each, and steppers big enough to hit repeatedly.
 *
 * The frame is read from the already-loaded catalogue rather than fetched on its
 * own. `useFrames` serves the whole range from one read, so navigating in from
 * the grid is instant and a hard refresh on this URL costs the same single read
 * the grid would have cost anyway.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  Download,
  Layers,
  Loader2,
  LogIn,
  Minus,
  Plus,
  ReceiptText,
  Trash2,
  ZoomIn,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { FrameImage } from '@/app/components/catalog/frame-image';
import { FavouriteButton, StockBadge } from '@/app/components/catalog/frame-chrome';
import { ImageZoom, type ZoomSubject } from '@/app/components/catalog/image-zoom';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { useFrames } from '@/app/hooks/use-frames';
import { MAX_QTY_PER_COLOR, useOrderStore } from '@/app/stores/order-store';
import { downloadAll } from '@/lib/media/download';
import { formatKyat, formatNumber } from '@/lib/format';
import {
  formatDimensions,
  frameDisplayName,
  orderableVariants,
  primaryImage,
  type FrameDoc,
} from '@/lib/product';
import { PIECES_PER_DOZEN, isFullSet, priceLine } from '@/lib/wholesale';

/* ── Stepper ───────────────────────────────────────────────────────────────── */

function Stepper({
  qty,
  label,
  onAdjust,
  onSet,
}: {
  qty: number;
  label: string;
  onAdjust: (delta: number) => void;
  onSet: (value: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-background p-1">
      <button
        type="button"
        onClick={() => onAdjust(-1)}
        disabled={qty === 0}
        aria-label={t('catalog.decrease', { color: label })}
        className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition-colors enabled:hover:bg-accent enabled:hover:text-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Minus className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
      </button>

      <input
        type="text"
        // `inputMode` rather than `type="number"`: a number input on Android
        // shows a spinner nobody taps and silently accepts `1e3`.
        inputMode="numeric"
        pattern="[0-9]*"
        value={qty === 0 ? '' : qty}
        placeholder="0"
        aria-label={t('catalog.quantityFor', { color: label })}
        onChange={(event) => onSet(Number(event.target.value.replace(/\D/g, '')) || 0)}
        onFocus={(event) => event.currentTarget.select()}
        maxLength={String(MAX_QTY_PER_COLOR).length}
        className="h-11 w-14 bg-transparent text-center text-base font-semibold tabular-nums text-foreground placeholder:font-normal placeholder:text-muted-foreground/60 focus-visible:outline-none"
      />

      <button
        type="button"
        onClick={() => onAdjust(1)}
        aria-label={t('catalog.increase', { color: label })}
        className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
      </button>
    </div>
  );
}

/* ── Spec row ──────────────────────────────────────────────────────────────── */

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-2 last:border-0">
      <dt className="text-[0.78rem] text-muted-foreground">
        <span className="font-myanmar">{label}</span>
      </dt>
      <dd className="text-[0.82rem] font-medium text-foreground">{value}</dd>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

export function FrameDetailPage() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const { frames, failed } = useFrames();
  const frame = useMemo(() => frames?.find((entry) => entry.id === id) ?? null, [frames, id]);

  useDocumentTitle(frame ? frameDisplayName(frame) : t('nav.catalog'));

  if (frames === null && !failed) {
    return (
      <div className="grid flex-1 place-items-center py-24" aria-busy="true">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  if (!frame) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-base font-semibold text-foreground">{t('frame.notFound')}</p>
        <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
          {t('frame.notFoundBody')}
        </p>
        <Button className="mt-6" onClick={() => navigate(ROUTES.catalog)}>
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          <span className="font-myanmar">{t('order.emptyAction')}</span>
        </Button>
      </div>
    );
  }

  return <FrameDetail frame={frame} />;
}

function FrameDetail({ frame }: { frame: FrameDoc }) {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();

  const quantities = useOrderStore((state) => state.quantities[frame.id]) ?? {};
  const setQty = useOrderStore((s) => s.setQty);
  const adjustQty = useOrderStore((s) => s.adjustQty);
  const setWholeSet = useOrderStore((s) => s.setWholeSet);
  const clearFrame = useOrderStore((s) => s.clearFrame);

  const variants = orderableVariants(frame);
  const line = priceLine(frame, quantities);
  const fullSet = isFullSet(frame, quantities);

  const [shownC, setShownC] = useState<string | null>(variants[0]?.cNumber ?? null);
  const [zoom, setZoom] = useState<ZoomSubject | null>(null);
  const [downloading, setDownloading] = useState(false);

  // A colour can disappear under the buyer if the shop withdraws it while the
  // page is open; falling back keeps the hero image from blanking.
  useEffect(() => {
    if (shownC && !variants.some((v) => v.cNumber === shownC)) {
      setShownC(variants[0]?.cNumber ?? null);
    }
  }, [variants, shownC]);

  const active = variants.find((v) => v.cNumber === shownC) ?? variants[0] ?? null;
  const heroImages = active?.images.length ? active.images : frame.variants.flatMap((v) => v.images);
  const hero = heroImages[0] ?? primaryImage(frame);

  const name = frameDisplayName(frame);
  const dimensions = formatDimensions(frame.dimensions);

  const takeFullSet = () => {
    const perColor = Math.max(1, ...Object.values(quantities));
    setWholeSet(
      frame.id,
      variants.map((v) => v.cNumber),
      perColor,
    );
  };

  /**
   * Saves every photo of this frame at full resolution.
   *
   * The whole model rather than the shown colour: a retailer promoting the frame
   * on their own page wants the set, and downloading them one colour at a time
   * is six taps to get what they meant by one.
   */
  const downloadAssets = async () => {
    const assets = frame.variants.flatMap((variant) =>
      [...variant.images, ...variant.videos].map((url, index) => ({
        url,
        name: `${frame.frameCode}-${variant.cNumber}-${index + 1}`,
      })),
    );

    if (assets.length === 0) {
      toast.error(t('frame.noAssets'));
      return;
    }

    setDownloading(true);
    const { saved, failed } = await downloadAll(assets);
    setDownloading(false);

    if (saved > 0) toast.success(t('frame.assetsSaved', { count: saved }));
    if (failed > 0) toast.error(t('frame.assetsFailed', { count: failed }));
  };

  return (
    <div className="pb-4">
      {/* ── Back ──────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3">
        <Link
          to={ROUTES.catalog}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          <span className="font-myanmar">{t('frame.back')}</span>
        </Link>
      </div>

      <div className="lg:flex lg:gap-6 lg:px-4">
        {/* ── Gallery ─────────────────────────────────────────────────────── */}
        <div className="lg:w-1/2 lg:shrink-0">
          {/* White, not `bg-muted`: the range is shot on white, and a grey plate
              behind a white-backed photo reads as an image that failed to load. */}
          <div className="relative mx-4 mt-2 overflow-hidden rounded-2xl bg-white lg:mx-0">
            <button
              type="button"
              onClick={() =>
                setZoom({
                  images: heroImages,
                  label: `${name} ${active?.colorName ?? ''}`.trim(),
                  caption: active ? `${active.cNumber} · ${active.colorName}` : name,
                })
              }
              aria-label={t('catalog.zoom', { name })}
              className="block aspect-[4/3] w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <FrameImage src={hero} alt={name} eager className="h-full w-full" />
            </button>

            <StockBadge status={frame.stockStatus} className="absolute left-3 top-3 shadow-sm" />

            {/* Over the photo rather than down in the specification list: it is
                the question buyers ask most about a frame they are already
                looking at, and the answer changes what they can charge for it. */}
            {frame.includesCase ? (
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[0.7rem] font-semibold text-primary-foreground shadow-sm">
                <BriefcaseBusiness className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                <span className="font-myanmar">{t('catalog.includesCase')}</span>
              </span>
            ) : null}

            <span className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur">
              <ZoomIn className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </span>

            <FavouriteButton frameId={frame.id} frameName={name} className="absolute right-3 top-3" />
          </div>

          {/* Colour thumbnails */}
          {variants.length > 1 ? (
            <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-4 lg:px-0">
              {variants.map((variant) => (
                <button
                  key={variant.cNumber}
                  type="button"
                  onClick={() => setShownC(variant.cNumber)}
                  aria-current={variant.cNumber === shownC}
                  aria-label={`${variant.cNumber} ${variant.colorName}`}
                  className={cn(
                    'h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    variant.cNumber === shownC ? 'border-primary' : 'border-transparent opacity-70',
                  )}
                >
                  <FrameImage
                    src={variant.images[0] ?? null}
                    alt=""
                    className="h-full w-full bg-muted"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* ── Detail ──────────────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1">
          <header className="px-4 pt-4 lg:px-0 lg:pt-2">
            <p className="text-[0.78rem] font-semibold uppercase tracking-wider text-primary">
              {frame.frameCode}
            </p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">{name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {frame.brand}
              {' · '}
              <span className="font-myanmar">{t(`attributes.category.${frame.category}`)}</span>
            </p>

            <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
              {formatKyat(frame.wholesalePrice)}
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                {t('catalog.perPiece')}
              </span>
            </p>
            <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
              {t('frame.perDozen', {
                amount: formatNumber(frame.wholesalePrice * PIECES_PER_DOZEN),
              })}
            </p>
          </header>

          {/* ── C-colour order panel ──────────────────────────────────────── */}
          <section className="mt-4">
            <h2 className="px-4 text-sm font-semibold text-foreground lg:px-0">
              <span className="font-myanmar">{t('frame.chooseColours')}</span>
            </h2>

            {variants.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground lg:px-0">
                {t('catalog.noColors')}
              </p>
            ) : !isSignedIn ? (
              /*
                The strict rule: no account, no quantities. The colours are still
                listed above in the gallery strip and the price is still on the
                page, so this hides the *entry*, not the frame — see the note on
                the auth gate in `product-row.tsx`.
              */
              <div className="mx-4 mt-2 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center lg:mx-0">
                <p className="text-[0.82rem] leading-relaxed text-foreground">
                  <span className="font-myanmar">{t('catalog.signInToOrder')}</span>
                </p>
                <Button asChild size="lg" className="mt-4 min-h-11 w-full sm:w-auto">
                  <Link to={ROUTES.signIn}>
                    <LogIn className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                    <span className="font-myanmar">{t('catalog.signInToShop')}</span>
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <ul className="mt-2 divide-y divide-border border-y border-border">
                  {variants.map((variant) => {
                    const qty = quantities[variant.cNumber] ?? 0;
                    const label = `${variant.cNumber} ${variant.colorName}`;

                    return (
                      <li
                        key={variant.cNumber}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2 transition-colors lg:px-0',
                          qty > 0 && 'bg-primary/5',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setShownC(variant.cNumber)}
                          aria-label={t('frame.showColour', { colour: label })}
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span
                            aria-hidden="true"
                            style={{ backgroundColor: variant.swatch }}
                            className={cn(
                              'h-7 w-7 rounded-full border shadow-inner',
                              variant.cNumber === shownC
                                ? 'border-primary ring-2 ring-primary/40'
                                : 'border-black/10 dark:border-white/15',
                            )}
                          />
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground" dir="ltr">
                            {variant.cNumber}
                          </p>
                          <p className="truncate text-[0.72rem] text-muted-foreground">
                            {variant.colorName}
                          </p>
                        </div>

                        <Stepper
                          qty={qty}
                          label={label}
                          onAdjust={(delta) => {
                            setShownC(variant.cNumber);
                            adjustQty(frame.id, variant.cNumber, delta);
                          }}
                          onSet={(value) => {
                            setShownC(variant.cNumber);
                            setQty(frame.id, variant.cNumber, value);
                          }}
                        />
                      </li>
                    );
                  })}
                </ul>

                <div className="flex flex-wrap items-center gap-2 px-4 py-3 lg:px-0">
                  <button
                    type="button"
                    onClick={takeFullSet}
                    disabled={fullSet}
                    className={cn(
                      'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-[0.78rem] font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      fullSet
                        ? 'border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-border bg-background text-foreground hover:border-primary',
                    )}
                  >
                    {fullSet ? (
                      <Check className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
                    ) : (
                      <Layers className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    )}
                    <span className="font-myanmar">
                      {t(fullSet ? 'catalog.fullSetApplied' : 'catalog.takeFullSet')}
                    </span>
                  </button>

                  {line.totalPieces > 0 ? (
                    <button
                      type="button"
                      onClick={() => clearFrame(frame.id)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[0.78rem] font-medium text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                      <span className="font-myanmar">{t('catalog.clearLine')}</span>
                    </button>
                  ) : null}
                </div>
              </>
            )}
          </section>

          {/* ── Specifications ───────────────────────────────────────────── */}
          <section className="mt-2 px-4 lg:px-0">
            <h2 className="text-sm font-semibold text-foreground">
              <span className="font-myanmar">{t('frame.specifications')}</span>
            </h2>

            <dl className="mt-1">
              <SpecRow
                label={t('catalog.filterMaterial')}
                value={t(`attributes.material.${frame.material}`)}
              />
              <SpecRow
                label={t('catalog.filterShape')}
                value={t(`attributes.shape.${frame.shape}`)}
              />
              {dimensions ? <SpecRow label={t('frame.dimensions')} value={dimensions} /> : null}
              {frame.weightGrams !== null ? (
                <SpecRow label={t('admin.weightLabel')} value={`${frame.weightGrams} g`} />
              ) : null}
              <SpecRow
                label={t('frame.colours')}
                value={String(variants.length)}
              />
            </dl>

            {frame.description.trim() ? (
              <p className="mt-3 text-[0.82rem] leading-relaxed text-muted-foreground">
                {frame.description}
              </p>
            ) : null}
          </section>

          {/* ── Media kit ────────────────────────────────────────────────── */}
          <section className="mt-4 px-4 lg:px-0">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="min-h-11 w-full"
              disabled={downloading}
              onClick={() => void downloadAssets()}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              )}
              <span className="font-myanmar">{t('frame.downloadAssets')}</span>
            </Button>
            <p className="mt-1.5 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
              {t('frame.downloadAssetsHint')}
            </p>
          </section>
        </div>
      </div>

      {/* ── Line total, docked ───────────────────────────────────────────── */}
      {line.totalPieces > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 px-4">
          <Link
            to={ROUTES.order}
            className="mx-auto flex min-h-14 w-full max-w-6xl items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ReceiptText className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.7rem] opacity-80">
                {t('catalog.pieces', { count: line.totalPieces })}
                {fullSet ? ` · ${t('catalog.fullSetApplied')}` : ''}
              </span>
              <span className="block truncate text-sm font-semibold tabular-nums">
                {formatKyat(line.subtotalKyat)}
              </span>
            </span>
            <span className="shrink-0 text-[0.8rem] font-semibold">
              <span className="font-myanmar">{t('catalog.viewVoucher')}</span>
            </span>
          </Link>
        </div>
      ) : null}

      <ImageZoom subject={zoom} onClose={() => setZoom(null)} />
    </div>
  );
}
