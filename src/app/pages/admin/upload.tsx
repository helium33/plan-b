/**
 * The product upload form.
 *
 * Flow: fill in the frame, add one or more C-number variants with their photos,
 * submit. Compression already happened when the photos were picked, so submit is
 * upload-then-write and its progress bar reflects real network transfer.
 *
 * Order of operations matters. Media is uploaded **first**, and the Firestore
 * document is written only once every URL is known. The reverse — write the
 * document, then upload — would publish a frame whose images 404 for however long
 * the upload takes, and permanently if it fails.
 */
import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { TextField } from '@/app/components/auth/fields';
import { SingleSelect } from '@/app/components/admin/attribute-select';
import {
  ImagePicker,
  VideoPicker,
  type PickedImage,
  type PickedVideo,
} from '@/app/components/admin/media-picker';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import {
  FRAME_CATEGORIES,
  FRAME_MATERIALS,
  FRAME_SHAPES,
  STOCK_STATUSES,
  type FrameCategory,
  type FrameMaterial,
  type FrameShape,
  type StockStatus,
} from '@/lib/attributes';
import { saveFrame } from '@/lib/firestore/frame-writes';
import { uploadMedia, variantFolder } from '@/lib/media/upload';
import { type FrameVariant, frameSlug } from '@/lib/product';

/** At least two images per colour — one angle is not enough to judge a frame. */
const MIN_IMAGES_PER_VARIANT = 2;

/** Editing state for one colourway. */
type VariantDraft = {
  id: string;
  cNumber: string;
  colorName: string;
  swatch: string;
  images: PickedImage[];
  videos: PickedVideo[];
  inStock: boolean;
};

const newVariant = (index: number): VariantDraft => ({
  id: crypto.randomUUID(),
  // Pre-filled with the conventional next code, still editable.
  cNumber: `C${index + 1}`,
  colorName: '',
  swatch: '#1e293b',
  images: [],
  videos: [],
  inStock: true,
});

export function AdminUploadPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('admin.tabs.upload'));

  /* Frame-level fields */
  const [brand, setBrand] = useState('');
  const [frameCode, setFrameCode] = useState('');
  const [name, setName] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [description, setDescription] = useState('');

  const [category, setCategory] = useState<FrameCategory>('Unisex');
  const [material, setMaterial] = useState<FrameMaterial>('Metal');
  const [shape, setShape] = useState<FrameShape>('Rectangle');
  const [stockStatus, setStockStatus] = useState<StockStatus>('in-stock');

  // Kept as strings so the inputs can be empty rather than forced to 0 — a
  // frame nobody has measured is a real state, and `0` is not the same claim.
  const [lensWidth, setLensWidth] = useState('');
  const [bridge, setBridge] = useState('');
  const [templeLength, setTempleLength] = useState('');
  const [weightGrams, setWeightGrams] = useState('');

  const [published, setPublished] = useState(true);
  // A case in the box is the norm for this range, so the form starts by saying
  // so; "Best seller" is a shelf the shop curates, so it starts empty.
  const [includesCase, setIncludesCase] = useState(true);
  const [bestSeller, setBestSeller] = useState(false);

  const [variants, setVariants] = useState<VariantDraft[]>([newVariant(0)]);

  /* Submission state */
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<{ label: string; fraction: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState<{ id: string; images: number; videos: number } | null>(null);

  const slug = useMemo(
    () => (brand && frameCode ? frameSlug(brand, frameCode) : ''),
    [brand, frameCode],
  );

  const updateVariant = (id: string, patch: Partial<VariantDraft>) => {
    setVariants((current) =>
      current.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)),
    );
  };

  /**
   * Collects every problem rather than stopping at the first.
   *
   * A form this long is frustrating to fix one error at a time — especially when
   * the errors are spread across collapsed variant panels.
   */
  const validate = (): string[] => {
    const problems: string[] = [];

    if (!brand.trim()) problems.push(t('admin.errors.brandRequired'));
    if (!frameCode.trim()) problems.push(t('admin.errors.frameCodeRequired'));

    const priceValue = Number(wholesalePrice);
    if (!wholesalePrice.trim() || !Number.isFinite(priceValue) || priceValue <= 0) {
      problems.push(t('admin.errors.priceRequired'));
    }

    if (variants.length === 0) problems.push(t('admin.errors.variantRequired'));

    const seen = new Set<string>();
    for (const variant of variants) {
      const code = variant.cNumber.trim();
      const label = code || t('admin.untitledVariant');

      if (!code) {
        problems.push(t('admin.errors.cNumberRequired'));
      } else if (seen.has(code.toUpperCase())) {
        problems.push(t('admin.errors.cNumberDuplicate', { code }));
      } else {
        seen.add(code.toUpperCase());
      }

      if (variant.images.length < MIN_IMAGES_PER_VARIANT) {
        problems.push(
          t('admin.errors.needImages', { code: label, min: MIN_IMAGES_PER_VARIANT }),
        );
      }
    }

    return problems;
  };

  const submit = async () => {
    const problems = validate();
    setErrors(problems);
    setSaved(null);
    if (problems.length > 0) {
      // Bring the summary into view — on a long form the errors would otherwise
      // appear far above the button that was just pressed.
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);

    try {
      // Count the transfers up front so the progress readout can be honest about
      // how much is left rather than jumping around.
      const totalFiles = variants.reduce(
        (sum, variant) => sum + variant.images.length + variant.videos.length * 2,
        0,
      );
      let completed = 0;

      const uploadedVariants: FrameVariant[] = [];

      for (const variant of variants) {
        const folder = variantFolder(slug, variant.cNumber.trim());

        const imageUrls: string[] = [];
        for (const [index, image] of variant.images.entries()) {
          const path = `${folder}/image-${index + 1}.${image.compressed.extension}`;

          const handle = uploadMedia(path, image.compressed.blob, (p) =>
            setProgress({
              label: t('admin.uploadingFile', {
                current: completed + 1,
                total: totalFiles,
                name: image.originalName,
              }),
              fraction: (completed + p.fraction) / totalFiles,
            }),
          );

          imageUrls.push(await handle.done);
          completed += 1;
        }

        const videoUrls: string[] = [];
        for (const [index, video] of variant.videos.entries()) {
          // Poster first: it is small, and if the video upload then fails the
          // shop still has a still to show for this colour.
          if (video.inspected.poster) {
            const posterPath = `${folder}/poster-${index + 1}.${video.inspected.poster.extension}`;
            const posterHandle = uploadMedia(posterPath, video.inspected.poster.blob, (p) =>
              setProgress({
                label: t('admin.uploadingPoster', { current: completed + 1, total: totalFiles }),
                fraction: (completed + p.fraction) / totalFiles,
              }),
            );
            imageUrls.push(await posterHandle.done);
          }
          completed += 1;

          const extension = video.file.name.split('.').pop()?.toLowerCase() || 'mp4';
          const videoPath = `${folder}/video-${index + 1}.${extension}`;

          const videoHandle = uploadMedia(videoPath, video.file, (p) =>
            setProgress({
              label: t('admin.uploadingFile', {
                current: completed + 1,
                total: totalFiles,
                name: video.file.name,
              }),
              fraction: (completed + p.fraction) / totalFiles,
            }),
          );

          videoUrls.push(await videoHandle.done);
          completed += 1;
        }

        uploadedVariants.push({
          cNumber: variant.cNumber.trim(),
          colorName: variant.colorName.trim() || variant.cNumber.trim(),
          swatch: variant.swatch,
          images: imageUrls,
          videos: videoUrls,
          inStock: variant.inStock,
        });
      }

      setProgress({ label: t('admin.savingRecord'), fraction: 1 });

      const { id } = await saveFrame({
        brand: brand.trim(),
        frameCode: frameCode.trim(),
        name: name.trim(),
        wholesalePrice: Math.round(Number(wholesalePrice)),
        category,
        material,
        shape,
        stockStatus,
        dimensions: {
          lensWidth: Number(lensWidth) || 0,
          bridge: Number(bridge) || 0,
          templeLength: Number(templeLength) || 0,
        },
        weightGrams: Number(weightGrams) || null,
        includesCase,
        bestSeller,
        variants: uploadedVariants,
        description: description.trim(),
        published,
      });

      setSaved({
        id,
        images: uploadedVariants.reduce((sum, v) => sum + v.images.length, 0),
        videos: uploadedVariants.reduce((sum, v) => sum + v.videos.length, 0),
      });
      setProgress(null);
    } catch (error) {
      setErrors([
        t('admin.errors.uploadFailed', {
          detail:
            error && typeof error === 'object' && 'code' in error
              ? String((error as { code: unknown }).code)
              : t('common.error'),
        }),
      ]);
      setProgress(null);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setBrand('');
    setFrameCode('');
    setName('');
    setWholesalePrice('');
    setDescription('');
    setCategory('Unisex');
    setMaterial('Metal');
    setShape('Rectangle');
    setStockStatus('in-stock');
    setLensWidth('');
    setBridge('');
    setTempleLength('');
    setWeightGrams('');
    // Not reset: `published` and `includesCase`, which describe how this shop
    // works and hold true across a batch of uploads. `bestSeller` is a judgement
    // about one model, and leaving it on would quietly promote the next frame
    // typed in after it.
    setBestSeller(false);
    setVariants([newVariant(0)]);
    setSaved(null);
    setErrors([]);
  };

  if (saved) {
    return (
      <div
        role="status"
        // Tailwind's own entrance utility rather than an animation library —
        // this was the last import of `motion/react` in the app, and keeping a
        // 43 kB dependency alive for one fade-in on a staff-only success card
        // was not a trade worth making.
        className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 rounded-2xl border border-emerald-600/30 bg-emerald-600/5 p-6 duration-300"
      >
        <CheckCircle2
          className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <h2 className="mt-4 text-base font-semibold text-foreground">{t('admin.savedTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t('admin.savedBody', { id: saved.id, images: saved.images, videos: saved.videos })}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" onClick={resetForm}>
            {t('admin.addAnother')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      {errors.length > 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
        >
          <p className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertCircle className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {t('admin.errors.heading', { count: errors.length })}
          </p>
          {/* Keyed by index, not by message. Two variants can produce the exact
              same problem text — "C1 needs at least 2 photos" twice, when a
              duplicate C-number is also the error — and keying by content then
              collides. The list is static and never reordered, so the index is a
              stable key here. */}
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-destructive">
            {errors.map((problem, index) => (
              <li key={index}>{problem}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ── Frame details ─────────────────────────────────────────────────── */}
      <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">{t('admin.sectionFrame')}</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label={t('admin.brandLabel')}
            value={brand}
            onChange={setBrand}
            placeholder="Plan B"
            required
            disabled={saving}
          />
          <TextField
            label={t('admin.frameCodeLabel')}
            value={frameCode}
            onChange={setFrameCode}
            placeholder="PBV-2041"
            hint={slug ? t('admin.slugPreview', { slug }) : t('admin.frameCodeHint')}
            required
            disabled={saving}
          />
        </div>

        <TextField
          label={t('admin.nameLabel')}
          value={name}
          onChange={setName}
          placeholder="Yangon Round"
          hint={t('admin.nameHint')}
          disabled={saving}
        />

        <TextField
          label={t('admin.priceLabel')}
          value={wholesalePrice}
          onChange={(next) => setWholesalePrice(next.replace(/[^\d]/g, ''))}
          placeholder="18000"
          hint={t('admin.priceHint')}
          required
          disabled={saving}
        />

        <div className="space-y-1.5">
          <label htmlFor="frame-description" className="block text-sm font-medium text-foreground">
            {t('admin.descriptionLabel')}
          </label>
          <textarea
            id="frame-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={600}
            disabled={saving}
            className="w-full resize-y rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={t('admin.descriptionPlaceholder')}
          />
        </div>
      </section>

      {/* ── Attributes ────────────────────────────────────────────────────── */}
      <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{t('admin.sectionAttributes')}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t('admin.attributesNote')}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <SingleSelect
            label={t('admin.categoryLabel')}
            value={category}
            options={FRAME_CATEGORIES}
            optionLabel={(value) => t(`attributes.category.${value}`)}
            onChange={setCategory}
            required
            hint={t('admin.categoryHint')}
          />
          <SingleSelect
            label={t('admin.materialLabel')}
            value={material}
            options={FRAME_MATERIALS}
            optionLabel={(value) => t(`attributes.material.${value}`)}
            onChange={setMaterial}
            required
            hint={t('admin.materialHint')}
          />
          <SingleSelect
            label={t('admin.shapeLabel')}
            value={shape}
            options={FRAME_SHAPES}
            optionLabel={(value) => t(`attributes.shape.${value}`)}
            onChange={setShape}
            required
            hint={t('admin.shapeHint')}
          />
        </div>

        <SingleSelect
          label={t('admin.stockLabel')}
          value={stockStatus}
          options={STOCK_STATUSES}
          optionLabel={(value) => t(`attributes.stock.${value}`)}
          onChange={setStockStatus}
          required
          hint={t('admin.stockHint')}
        />
      </section>

      {/* ── Measurements ──────────────────────────────────────────────────── */}
      <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {t('admin.sectionMeasurements')}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{t('admin.measurementsNote')}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-4">
          <TextField
            label={t('admin.lensWidthLabel')}
            value={lensWidth}
            onChange={(next) => setLensWidth(next.replace(/[^\d]/g, ''))}
            placeholder="52"
            disabled={saving}
          />
          <TextField
            label={t('admin.bridgeLabel')}
            value={bridge}
            onChange={(next) => setBridge(next.replace(/[^\d]/g, ''))}
            placeholder="18"
            disabled={saving}
          />
          <TextField
            label={t('admin.templeLabel')}
            value={templeLength}
            onChange={(next) => setTempleLength(next.replace(/[^\d]/g, ''))}
            placeholder="142"
            disabled={saving}
          />
          <TextField
            label={t('admin.weightLabel')}
            // Decimal point allowed: titanium frames are quoted as 8.2g and
            // rounding that to 8 loses the number's whole selling point.
            value={weightGrams}
            onChange={(next) => setWeightGrams(next.replace(/[^\d.]/g, ''))}
            placeholder="19"
            disabled={saving}
          />
        </div>
      </section>

      {/* ── Variants ──────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t('admin.sectionVariants')}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('admin.variantsNote', { min: MIN_IMAGES_PER_VARIANT })}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => setVariants((current) => [...current, newVariant(current.length)])}
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {t('admin.addVariant')}
          </Button>
        </div>

        {variants.map((variant, index) => (
          <div key={variant.id} className="space-y-5 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-foreground">
                {t('admin.variantHeading', {
                  index: index + 1,
                  code: variant.cNumber || '—',
                })}
              </h3>

              {variants.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setVariants((current) => current.filter((v) => v.id !== variant.id))}
                  disabled={saving}
                  aria-label={t('admin.removeVariant', { code: variant.cNumber })}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
                </button>
              ) : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <TextField
                label={t('admin.cNumberLabel')}
                value={variant.cNumber}
                onChange={(next) => updateVariant(variant.id, { cNumber: next })}
                placeholder="C1"
                required
                disabled={saving}
              />
              <TextField
                label={t('admin.colorNameLabel')}
                value={variant.colorName}
                onChange={(next) => updateVariant(variant.id, { colorName: next })}
                placeholder="Tortoiseshell"
                disabled={saving}
              />

              <div className="space-y-1.5">
                <label
                  htmlFor={`swatch-${variant.id}`}
                  className="block text-sm font-medium text-foreground"
                >
                  {t('admin.swatchLabel')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`swatch-${variant.id}`}
                    type="color"
                    value={variant.swatch}
                    onChange={(event) => updateVariant(variant.id, { swatch: event.target.value })}
                    disabled={saving}
                    className="h-9 w-14 cursor-pointer rounded-lg border border-border bg-input-background"
                  />
                  <code className="text-xs text-muted-foreground" dir="ltr">
                    {variant.swatch}
                  </code>
                </div>
              </div>
            </div>

            <ImagePicker
              images={variant.images}
              onChange={(next) => updateVariant(variant.id, { images: next })}
              minimum={MIN_IMAGES_PER_VARIANT}
              label={t('admin.imagesLabel', { code: variant.cNumber || '—' })}
            />

            <VideoPicker
              videos={variant.videos}
              onChange={(next) => updateVariant(variant.id, { videos: next })}
              label={t('admin.videosLabel', { code: variant.cNumber || '—' })}
            />

            <label className="flex items-center gap-2.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={variant.inStock}
                onChange={(event) => updateVariant(variant.id, { inStock: event.target.checked })}
                disabled={saving}
                className="h-4 w-4 rounded border-border"
              />
              {t('admin.inStockLabel')}
            </label>
          </div>
        ))}
      </section>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <label className="flex items-center gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-border"
          />
          {t('admin.publishLabel')}
        </label>

        <label className="flex items-center gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={includesCase}
            onChange={(event) => setIncludesCase(event.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-border"
          />
          <span className="font-myanmar">{t('admin.includesCaseLabel')}</span>
        </label>

        <label className="flex items-center gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={bestSeller}
            onChange={(event) => setBestSeller(event.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-border"
          />
          <span className="font-myanmar">{t('admin.bestSellerLabel')}</span>
        </label>

        {progress ? (
          <div>
            <p className="text-xs text-muted-foreground">{progress.label}</p>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(progress.fraction * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('admin.uploadProgressLabel')}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-[width] duration-200"
                style={{ width: `${Math.min(100, Math.max(0, progress.fraction * 100))}%` }}
              />
            </div>
          </div>
        ) : null}

        <Button
          type="button"
          size="lg"
          className={cn('w-full')}
          disabled={saving}
          onClick={() => void submit()}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          )}
          {saving ? t('admin.uploading') : t('admin.saveFrame')}
        </Button>

        <p className="text-xs leading-relaxed text-muted-foreground">{t('admin.submitNote')}</p>
      </section>
    </div>
  );
}
