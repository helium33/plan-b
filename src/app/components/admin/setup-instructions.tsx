/**
 * How to grant yourself staff access, with the uid ready to copy.
 *
 * Extracted from the admin page because it is shown in two places: to a
 * non-admin who reached `/admin`, and (in Module 3) on the seeding panel. The
 * person hitting this during setup *is* the shop owner, so what they need is the
 * exact value to paste into the Firebase console — not a redirect home.
 */
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { useAuth } from '@/app/hooks/use-auth';

export function AdminSetupInstructions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused on an insecure origin or by permission.
      // The uid is displayed in full beside the button, so it stays selectable by
      // hand and nothing is actually lost.
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6">
      <p className="text-sm leading-relaxed text-muted-foreground">{t('admin.notAdminBody')}</p>

      <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
        {(['step1', 'step2', 'step3'] as const).map((key, index) => (
          <li key={key} className="flex gap-2">
            <span className="font-medium text-foreground">{index + 1}.</span>
            {t(`admin.${key}`)}
          </li>
        ))}
      </ol>

      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('admin.yourUid')}
        </p>

        <div className="mt-1.5 flex items-center gap-2">
          <code
            className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground"
            dir="ltr"
          >
            {user?.uid ?? '—'}
          </code>

          <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
            {copied ? (
              <Check className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
            )}
            {copied ? t('admin.copied') : t('admin.copyUid')}
          </Button>
        </div>
      </div>

      {/* Both rulesets must be deployed, and they are separate commands — the one
          people miss is Storage, whose default lets any signed-in user write. */}
      <p className="mt-5 rounded-xl border border-border bg-muted/40 p-3.5 text-xs leading-relaxed text-muted-foreground">
        {t('admin.deployRulesNote')}
      </p>
    </section>
  );
}
