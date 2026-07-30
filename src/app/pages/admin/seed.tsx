/**
 * Sample-catalogue seeding.
 *
 * Moved here from the old single-page admin when Module 5 split the area into
 * tabs. Still useful after real uploads exist: it resets the mock frames to a
 * known state, which is what makes the recommendation engine testable against a
 * fixed catalogue.
 */
import { useEffect, useState } from 'react';
import { Database, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AuthAlert } from '@/app/components/auth/auth-alert';
import { Button } from '@/app/components/ui/button';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { resolveErrorKey } from '@/lib/auth';
import { listFrames } from '@/lib/firestore/frames';
import { clearSampleFrames, sampleFrameCount, seedSampleFrames } from '@/lib/firestore/seed';

export function AdminSeedPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('admin.tabs.seed'));

  const [busy, setBusy] = useState<'seed' | 'clear' | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [sampleCount, setSampleCount] = useState<number | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [noticeKey, setNoticeKey] = useState<string | null>(null);

  const refresh = () => {
    listFrames()
      .then((frames) => setCount(frames.length))
      .catch(() => setCount(null));
  };

  useEffect(() => {
    refresh();
    // Pulls in the sample chunk on this page only, not on a customer's first load.
    void sampleFrameCount().then(setSampleCount);
  }, []);

  const run = async (action: 'seed' | 'clear') => {
    setBusy(action);
    setErrorKey(null);
    setNoticeKey(null);

    try {
      if (action === 'seed') {
        await seedSampleFrames();
        setNoticeKey('admin.seedDone');
      } else {
        await clearSampleFrames();
        setNoticeKey('admin.clearDone');
      }
      refresh();
    } catch (error) {
      setErrorKey(resolveErrorKey(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="max-w-2xl rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Database
          className="h-4 w-4 text-brand-600 dark:text-brand-300"
          strokeWidth={1.9}
          aria-hidden="true"
        />
        <h2 className="text-sm font-medium text-foreground">{t('admin.seedTitle')}</h2>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {t('admin.seedBody', { count: sampleCount ?? '…' })}
      </p>

      <p className="mt-3 text-sm text-muted-foreground">
        {t('admin.currentCount')}{' '}
        <span className="font-medium text-foreground">
          {/* `published: false` frames are excluded by `listFrames`, so this reads
              lower than the number written — correct, and matches what a customer
              can actually see. */}
          {count === null ? '—' : count}
        </span>
      </p>

      {errorKey ? (
        <div className="mt-4">
          <AuthAlert messageKey={errorKey} />
        </div>
      ) : null}
      {noticeKey ? (
        <div className="mt-4">
          <AuthAlert messageKey={noticeKey} tone="success" />
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" onClick={() => void run('seed')} disabled={busy !== null}>
          {busy === 'seed' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Database className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          )}
          {t('admin.seedAction')}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => void run('clear')}
          disabled={busy !== null}
        >
          {busy === 'clear' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          )}
          {t('admin.clearAction')}
        </Button>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {t('admin.seedIdempotent')}
      </p>
    </section>
  );
}
