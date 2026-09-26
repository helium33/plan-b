/**
 * Link the catalogue to POS stock — one button, run after uploading frames.
 *
 * A shop cannot order a frame on credit until the frame knows which POS
 * product it is (see `lib/pos/catalog-link.ts` for why that link is stored
 * rather than looked up). Matching is by model number, so this is safe to run
 * as often as you like: it rewrites the same links and reports what it could
 * not match, which is the list to fix — a code typed differently in the two
 * systems, or a model the POS has not been given yet.
 *
 * Needs a POS `ADMIN` account, because matching reads the POS products and
 * the rules keep those to staff. A catalogue editor without one is told so.
 */
import { useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { useRole } from '@/app/hooks/use-role';
import { linkCatalogueToPos, type LinkReport } from '@/lib/pos/catalog-link';
import type { FrameDoc } from '@/lib/product';

export function PosLinkPanel({ frames }: { frames: readonly FrameDoc[] }) {
  const { t } = useTranslation();
  const { role, ready } = useRole();

  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<LinkReport | null>(null);
  const [failed, setFailed] = useState(false);

  const run = async () => {
    setBusy(true);
    setFailed(false);
    try {
      setReport(await linkCatalogueToPos(frames));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mb-5 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{t('admin.posLink.title')}</p>
          <p className="mt-0.5 text-[0.8rem] text-muted-foreground">{t('admin.posLink.body')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={busy || !ready || role !== 'admin'}
          onClick={() => void run()}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Link2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          )}
          {t('admin.posLink.action')}
        </Button>
      </div>

      {ready && role !== 'admin' ? (
        <p className="mt-3 text-[0.78rem] text-muted-foreground">{t('admin.posLink.needsPosAdmin')}</p>
      ) : null}

      {failed ? (
        <p role="alert" className="mt-3 text-[0.8rem] text-destructive">
          {t('admin.posLink.failed')}
        </p>
      ) : null}

      {report ? (
        <div role="status" className="mt-3 space-y-1 text-[0.8rem]">
          <p className="font-medium text-foreground">
            {t('admin.posLink.linked', { count: report.linked.length })}
          </p>
          {report.missing.length > 0 ? (
            <p className="text-muted-foreground" dir="ltr">
              {t('admin.posLink.missing', { codes: report.missing.join(', ') })}
            </p>
          ) : null}
          {report.ambiguous.length > 0 ? (
            <p className="text-destructive" dir="ltr">
              {t('admin.posLink.ambiguous', { codes: report.ambiguous.join(', ') })}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
