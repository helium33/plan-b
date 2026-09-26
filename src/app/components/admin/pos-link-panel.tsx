/**
 * Sync the catalogue with the POS — the same sync that runs by itself when the
 * owner opens the catalogue (`usePosCatalogueSync`), on demand.
 *
 * POS frames with no catalogue entry get one; entries the sync made earlier
 * are refreshed; frames uploaded here are only linked to their POS product so
 * they can be ordered on credit. See `lib/pos/catalog-sync.ts`.
 *
 * Needs a POS ADMIN account (`npm run set-role -- <email> ADMIN` in the POS
 * repo): the rules keep POS products, which carry cost, to staff. Anyone else
 * is told so.
 */
import { useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { syncCatalogueFromPos, type SyncReport } from '@/lib/pos/catalog-sync';

export function PosLinkPanel() {
  const { t } = useTranslation();

  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<SyncReport | null>(null);
  const [failed, setFailed] = useState(false);

  const run = async () => {
    setBusy(true);
    setFailed(false);
    try {
      setReport(await syncCatalogueFromPos());
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
          disabled={busy}
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

      {failed ? (
        <p role="alert" className="mt-3 text-[0.8rem] text-destructive">
          {t('admin.posLink.needsPosAdmin')}
        </p>
      ) : null}

      {report ? (
        <div role="status" className="mt-3 space-y-1 text-[0.8rem]">
          <p className="font-medium text-foreground">
            {t('admin.posLink.result', {
              added: report.added.length,
              updated: report.updated.length,
              linked: report.linked.length,
            })}
          </p>
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
