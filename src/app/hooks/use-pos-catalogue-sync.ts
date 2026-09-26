/**
 * Keeps the catalogue in step with the POS, without anyone pressing a button.
 *
 * When a POS admin (the owner, after `npm run set-role -- <email> ADMIN`)
 * opens the catalogue, their session copies any new or changed POS frames
 * into the website catalogue — see `lib/pos/catalog-sync.ts`. Nobody else
 * runs it: the rules let only POS staff read products, which carry cost.
 *
 * Once per account per browser tab. A sync reads every POS product; doing that
 * on every return to the catalogue would spend the database quota on a list
 * that changes a few times a week.
 */
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAuth } from '@/app/hooks/use-auth';
import { useRole } from '@/app/hooks/use-role';
import { syncCatalogueFromPos } from '@/lib/pos/catalog-sync';

const SESSION_KEY = 'pbw-pos-sync';

export function usePosCatalogueSync(onChanged: () => void): void {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { role, ready } = useRole();
  const isPosAdmin = ready && role === 'admin';

  const changed = useRef(onChanged);
  changed.current = onChanged;

  useEffect(() => {
    if (!isPosAdmin || !user) return;

    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === user.uid) return;
      window.sessionStorage.setItem(SESSION_KEY, user.uid);
    } catch {
      /* Private mode: sync anyway, just not remembered. */
    }

    // Not cancelled on unmount: the session flag above means this is the only
    // run, and its result must land even if the page re-mounted meanwhile.
    syncCatalogueFromPos()
      .then((report) => {
        const count = report.added.length + report.updated.length;
        if (count > 0 || report.linked.length > 0) changed.current();
        if (count > 0) toast.success(t('admin.posLink.synced', { count }));
      })
      .catch((error) => {
        // Offline, or the rules changed under us. The admin page's button
        // reports failures properly; a buyer-facing page stays quiet.
        if (import.meta.env.DEV) console.warn('[pos sync]', error);
      });
  }, [isPosAdmin, user, t]);
}
