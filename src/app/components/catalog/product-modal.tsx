/**
 * One model, full screen: see it, pick colours, done.
 *
 * ── Why a modal and not the detail page ────────────────────────────────────
 * `/frame/:id` still exists and still works — it is what a shared link opens.
 * But navigating there from the feed cost a route change, a scroll to top, and
 * a back button to find the feed again, all to answer "what colours does this
 * come in?". A modal keeps the buyer's place in the feed, which is the thing
 * they lose most easily when every row is a screenful tall.
 *
 * ── No exit animation, deliberately ───────────────────────────────────────
 * Built on the Radix primitives rather than `components/ui/dialog`, and closing
 * is instant. Radix keeps a closing node mounted until it sees `animationend`,
 * and that event never arrives in a tab the browser is not compositing — which
 * would leave this full-screen panel over the catalogue with `pointer-events:
 * none` on the body and no way out but a reload. The same reasoning is written
 * up at length in `components/ui/sheet.tsx` and `onboarding/how-to-use.tsx`.
 *
 * ── Quantities, on a screen that is trying not to have any ────────────────
 * The reference adds exactly one of a colour per tap. That suits a retail cart
 * and not this shop: a wholesale line is dozens, and tapping forty times is not
 * "dead simple". So a tap adds one, the count sits where the prompt was, and a
 * minus appears only once there is something to subtract. Nothing is on screen
 * until it can do something.
 */
import { useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, Minus, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FrameImage } from '@/app/components/catalog/frame-image';
import { StockBadge } from '@/app/components/catalog/frame-chrome';
import { cn } from '@/app/components/ui/utils';
import { useCartUi } from '@/app/stores/cart-ui-store';
import { useOrderStore } from '@/app/stores/order-store';
import { formatKyat } from '@/lib/format';
import {
  formatDimensions,
  frameDisplayName,
  orderableVariants,
  primaryImage,
  type FrameDoc,
} from '@/lib/product';

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-2.5 last:border-0">
      <dt className="text-[0.82rem] text-muted-foreground">
        <span className="font-myanmar">{label}</span>
      </dt>
      <dd className="text-[0.88rem] font-semibold text-foreground">{value}</dd>
    </div>
  );
}

export function ProductModal({
  frame,
  initialColour = null,
  onClose,
}: {
  /** The model being shown, or `null` when the modal is closed. */
  frame: FrameDoc | null;
  /** The C-number to show first — the colour the buyer was looking at. */
  initialColour?: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  const quantities =
    useOrderStore((state) => (frame ? state.quantities[frame.id] : undefined)) ?? {};
  const adjustQty = useOrderStore((s) => s.adjustQty);
  const openCart = useCartUi((s) => s.setOpen);

  const [shownC, setShownC] = useState<string | null>(null);

  // Reset the shown colour whenever a different model is opened, or the next
  // model inherits the last one's selection and shows the wrong photo first.
  useEffect(() => setShownC(initialColour), [frame?.id, initialColour]);

  if (!frame) return null;

  const variants = orderableVariants(frame);
  const active = variants.find((v) => v.cNumber === shownC) ?? variants[0] ?? null;
  const hero = active?.images[0] ?? primaryImage(frame);

  const name = frameDisplayName(frame);
  const dimensions = formatDimensions(frame.dimensions);
  const totalPieces = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  return (
    <DialogPrimitive.Root open onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col bg-background data-[state=open]:animate-in data-[state=open]:fade-in-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[92dvh] sm:w-[calc(100%-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:border-border sm:shadow-2xl"
          aria-describedby={undefined}
        >
          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="flex shrink-0 items-center gap-3 border-b border-border px-3 py-3">
            <DialogPrimitive.Close
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t('catalog.closePreview')}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
            </DialogPrimitive.Close>

            <DialogPrimitive.Title
              className="min-w-0 flex-1 truncate text-center text-lg font-bold text-foreground"
              dir="ltr"
            >
              {t('catalog.modelLabel')}: {frame.frameCode}
            </DialogPrimitive.Title>

            {/* Balances the close button so the title sits optically centred. */}
            <span className="h-11 w-11 shrink-0" aria-hidden="true" />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* ── The picture ───────────────────────────────────────────── */}
            <div className="relative border-b border-border bg-white">
              <FrameImage
                src={hero}
                alt={name}
                eager
                className="max-h-[42vh] w-full object-contain"
              />
              <StockBadge status={frame.stockStatus} className="absolute left-3 top-3 shadow-sm" />
            </div>

            <div className="p-5">
              {/* ── Specifications ─────────────────────────────────────── */}
              <dl className="mb-6">
                <Spec
                  label={t('catalog.filterMaterial')}
                  value={t(`attributes.material.${frame.material}`)}
                />
                {dimensions ? <Spec label={t('frame.dimensions')} value={dimensions} /> : null}
                <Spec
                  label={t('catalog.unitPrice')}
                  value={`${formatKyat(frame.wholesalePrice)} ${t('catalog.perPiece')}`}
                />
                {frame.includesCase ? <Spec label={t('catalog.includesCase')} value="✓" /> : null}
              </dl>

              {/* ── Colours ────────────────────────────────────────────── */}
              <p className="mb-3 text-[0.82rem] font-bold text-muted-foreground">
                <span className="font-myanmar">{t('catalog.chooseColour')}</span>
              </p>

              {variants.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t('catalog.noColors')}
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {variants.map((variant) => {
                    const qty = quantities[variant.cNumber] ?? 0;
                    const label = `${variant.cNumber} ${variant.colorName}`;

                    return (
                      <li key={variant.cNumber} className="flex items-center gap-2">
                        {/* One big target that both previews the colour and
                            adds a piece — the two things a buyer wants from
                            this row, without making them choose a mode. */}
                        <button
                          type="button"
                          onClick={() => {
                            setShownC(variant.cNumber);
                            adjustQty(frame.id, variant.cNumber, 1);
                          }}
                          aria-label={t('catalog.increase', { color: label })}
                          className={cn(
                            'flex min-h-16 flex-1 items-center gap-3 rounded-2xl border-2 px-4 text-left transition-all active:scale-[0.99]',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            qty > 0
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/60',
                          )}
                        >
                          <span
                            aria-hidden="true"
                            style={{ backgroundColor: variant.swatch }}
                            className="h-8 w-8 shrink-0 rounded-full border border-black/10 shadow-inner dark:border-white/15"
                          />

                          <span className="min-w-0 flex-1">
                            <span className="block text-base font-bold text-foreground" dir="ltr">
                              {variant.cNumber}
                            </span>
                            <span className="block truncate text-[0.75rem] text-muted-foreground">
                              {variant.colorName}
                            </span>
                          </span>

                          {qty > 0 ? (
                            <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-sm font-bold tabular-nums text-primary-foreground">
                              {qty}
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-[0.78rem] font-bold text-muted-foreground">
                              <span className="font-myanmar">{t('catalog.selectColour')}</span>
                            </span>
                          )}
                        </button>

                        {/* Only once there is something to remove. */}
                        {qty > 0 ? (
                          <button
                            type="button"
                            onClick={() => adjustQty(frame.id, variant.cNumber, -1)}
                            aria-label={t('catalog.decrease', { color: label })}
                            className="grid h-16 w-12 shrink-0 place-items-center rounded-2xl border-2 border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Minus className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* ── Done ─────────────────────────────────────────────────────── */}
          {totalPieces > 0 ? (
            <div className="shrink-0 border-t border-border bg-card p-4">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openCart(true);
                }}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <ShoppingBag className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
                <span className="font-myanmar">{t('catalog.doneAdding')}</span>
                <span className="tabular-nums">({totalPieces})</span>
              </button>
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
