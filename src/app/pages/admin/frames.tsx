/**
 * Manage uploaded frames: publish, unpublish, delete.
 *
 * Subscribed rather than fetched, so an upload made in another tab appears here
 * without a refresh — and so the publish toggle reflects the stored value rather
 * than optimistic local state that could disagree with the database.
 *
 * Deliberately shows unpublished frames, unlike every customer-facing query. This
 * is the only page in the app where a hidden frame needs to be visible, since
 * otherwise unpublishing something would make it unrecoverable through the UI.
 */
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Package,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PosLinkPanel } from '@/app/components/admin/pos-link-panel';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { subscribeToFrames } from '@/lib/firestore/frames';
import { deleteFrame, setFramePublished } from '@/lib/firestore/frame-writes';
import { formatKyat } from '@/lib/format';
import { type FrameDoc, frameDisplayName, primaryImage } from '@/lib/product';

export function AdminFramesPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('admin.tabs.frames'));

  const [frames, setFrames] = useState<FrameDoc[] | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Two-step delete: the id awaiting confirmation. */
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToFrames(
      (result) => {
        setFrames(result);
        setErrorKey(null);
      },
      () => setErrorKey('common.errorBody'),
    );
    return unsubscribe;
  }, []);

  const togglePublished = async (frame: FrameDoc) => {
    setBusyId(frame.id);
    try {
      await setFramePublished(frame.id, !frame.published);
    } catch {
      setErrorKey('common.errorBody');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (frame: FrameDoc) => {
    setBusyId(frame.id);
    try {
      await deleteFrame(frame.id);
      setConfirmingId(null);
    } catch {
      setErrorKey('common.errorBody');
    } finally {
      setBusyId(null);
    }
  };

  if (frames === null && !errorKey) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {t('common.loading')}
      </p>
    );
  }

  return (
    <div className="max-w-4xl">
      {errorKey ? (
        <p
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          {t('common.errorBody')}
        </p>
      ) : null}

      {frames && frames.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Package className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">{t('admin.noFrames')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('admin.noFramesBody')}</p>
        </div>
      ) : null}

      {frames && frames.length > 0 ? (
        <>
          <PosLinkPanel frames={frames} />

          <p className="mb-4 text-sm text-muted-foreground">
            {t('admin.frameCount', {
              total: frames.length,
              published: frames.filter((frame) => frame.published).length,
            })}
          </p>

          <ul className="space-y-3">
            {frames.map((frame) => {
              const image = primaryImage(frame);
              const busy = busyId === frame.id;

              return (
                <li
                  key={frame.id}
                  className={cn(
                    'flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-4',
                    frame.published ? 'border-border' : 'border-dashed border-border',
                  )}
                >
                  <span className="block h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {image ? (
                      <img src={image} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-muted-foreground/40">
                        <Package className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {frameDisplayName(frame)}
                      </p>
                      {!frame.published ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                          {t('admin.hidden')}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                      {frame.brand} · {frame.frameCode} ·{' '}
                      {formatKyat(frame.wholesalePrice, t('common.currency'))}
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t(`attributes.category.${frame.category}`)} ·{' '}
                      {t(`attributes.material.${frame.material}`)}
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t('admin.variantSummary', {
                        variants: frame.variants.length,
                        images: frame.variants.reduce((sum, v) => sum + v.images.length, 0),
                        videos: frame.variants.reduce((sum, v) => sum + v.videos.length, 0),
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => void togglePublished(frame)}
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : frame.published ? (
                        <EyeOff className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
                      )}
                      {frame.published ? t('admin.unpublish') : t('admin.publish')}
                    </Button>

                    {/* Two-step delete rather than a `confirm()` dialog: this
                        removes uploaded media as well as the record, and neither
                        comes back. */}
                    {confirmingId === frame.id ? (
                      <>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={busy}
                          onClick={() => void remove(frame)}
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          ) : null}
                          {t('admin.confirmDelete')}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => setConfirmingId(null)}
                        >
                          {t('actions.cancel')}
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => setConfirmingId(frame.id)}
                        aria-label={t('admin.deleteFrame', { name: frameDisplayName(frame) })}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
