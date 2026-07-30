/**
 * Virtual try-on — a working placeholder.
 *
 * ── What this does and does not do ─────────────────────────────────────────
 * It composites the frame image over the customer's photo, with manual controls
 * for position, size and rotation. It does **not** detect the face. Real AR try-on
 * needs landmark tracking (MediaPipe or similar) plus per-frame 3D assets, and the
 * shop has neither — the catalogue holds flat product photos.
 *
 * Manual placement is honest about that, and it is genuinely useful: the customer
 * still sees frame width against their own face, which is the question they are
 * actually asking. The alternative — a "coming soon" panel — answers nothing.
 *
 * ── The photo never leaves the browser ─────────────────────────────────────
 * The selfie is held in an object URL and drawn to a canvas. Nothing is uploaded,
 * so there is no Storage path to secure and no photo of a customer's face sitting
 * in a bucket. That is a deliberate privacy decision, and it is stated in the UI —
 * people are reasonably wary of uploading their face to a shop.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  ImagePlus,
  Lock,
  RotateCcw,
  ScanFace,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';

type Placement = { x: number; y: number; scale: number; rotation: number };

const DEFAULT_PLACEMENT: Placement = { x: 50, y: 42, scale: 60, rotation: 0 };

export function VirtualTryOn({
  frameImage,
  frameName,
}: {
  frameImage: string | null;
  frameName: string;
}) {
  const { t } = useTranslation();

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [cameraError, setCameraError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Revoke the object URL on unmount and on replacement, or each photo the
  // customer tries holds its full size in memory until the tab closes.
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const usePhoto = (file: File | undefined) => {
    if (!file) return;
    setCameraError(false);
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(file));
    setPlacement(DEFAULT_PLACEMENT);
  };

  const clearPhoto = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setPlacement(DEFAULT_PLACEMENT);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <ScanFace className="h-4 w-4 text-brand-600 dark:text-brand-300" strokeWidth={1.9} aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">{t('tryOn.title')}</h2>
      </div>

      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t('tryOn.intro')}</p>

      {/* Stated up front, because the ask is "give us a photo of your face". */}
      <p className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-600/25 bg-emerald-600/5 p-3.5 text-xs leading-relaxed text-foreground">
        <Lock
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
          strokeWidth={2}
          aria-hidden="true"
        />
        {t('tryOn.privacy')}
      </p>

      {!photoUrl ? (
        <div className="mt-5">
          <div className="grid aspect-[4/3] place-items-center rounded-xl border border-dashed border-border bg-muted/40">
            <div className="px-6 text-center">
              <ScanFace className="mx-auto h-10 w-10 text-muted-foreground/40" strokeWidth={1.2} aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-foreground">{t('tryOn.emptyTitle')}</p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                {t('tryOn.emptyBody')}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => usePhoto(event.target.files?.[0])}
              className="hidden"
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
              {t('tryOn.uploadPhoto')}
            </Button>

            {/*
              `capture="user"` asks the OS for the front camera directly. On a phone
              this opens the camera; on a desktop browser it degrades to a normal
              file picker, which is why there is no separate getUserMedia path —
              one input covers both without a permissions prompt we would have to
              explain.
            */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={(event) => usePhoto(event.target.files?.[0])}
              className="hidden"
            />
            <Button type="button" variant="outline" onClick={() => cameraInputRef.current?.click()}>
              <Camera className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
              {t('tryOn.useCamera')}
            </Button>
          </div>

          {cameraError ? (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {t('tryOn.cameraError')}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-5">
          <div className="relative overflow-hidden rounded-xl border border-border bg-slate-950">
            <div className="aspect-[4/3]">
              <img src={photoUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
            </div>

            {/* The frame, positioned over the photo. `pointer-events-none` so it
                never swallows a click meant for the controls beneath. */}
            {frameImage ? (
              <img
                src={frameImage}
                alt={t('tryOn.overlayAlt', { name: frameName })}
                className="pointer-events-none absolute select-none"
                style={{
                  left: `${placement.x}%`,
                  top: `${placement.y}%`,
                  width: `${placement.scale}%`,
                  transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
                  // The product shots are on a light backdrop, so `multiply` drops
                  // the white and leaves the frame — a crude key, but it beats a
                  // white rectangle across someone's face.
                  mixBlendMode: 'multiply',
                }}
              />
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            <Slider
              label={t('tryOn.controls.size')}
              value={placement.scale}
              min={25}
              max={110}
              onChange={(scale) => setPlacement((p) => ({ ...p, scale }))}
            />
            <Slider
              label={t('tryOn.controls.horizontal')}
              value={placement.x}
              min={10}
              max={90}
              onChange={(x) => setPlacement((p) => ({ ...p, x }))}
            />
            <Slider
              label={t('tryOn.controls.vertical')}
              value={placement.y}
              min={10}
              max={90}
              onChange={(y) => setPlacement((p) => ({ ...p, y }))}
            />
            <Slider
              label={t('tryOn.controls.rotation')}
              value={placement.rotation}
              min={-20}
              max={20}
              onChange={(rotation) => setPlacement((p) => ({ ...p, rotation }))}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPlacement(DEFAULT_PLACEMENT)}>
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
              {t('tryOn.reset')}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clearPhoto}>
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
              {t('tryOn.removePhoto')}
            </Button>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t('tryOn.caveat')}</p>
        </div>
      )}
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const id = `tryon-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-foreground">
          {label}
        </label>
        <span className="text-xs tabular-nums text-muted-foreground" dir="ltr">
          {Math.round(value)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          'mt-1 w-full accent-[var(--color-brand-500)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      />
    </div>
  );
}
