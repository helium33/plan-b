/**
 * Route guard for the staff area.
 *
 * The subtlety is the `loading` state. Firebase restores a session from
 * IndexedDB asynchronously, so for the first few hundred milliseconds after a
 * hard refresh a signed-in admin looks signed out. A guard that treats that as
 * "unauthenticated" bounces them to the sign-in page every time they reload —
 * so it renders a spinner until the answer is known.
 */
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/app/config/navigation';
import { useAuth } from '@/app/hooks/use-auth';

/**
 * Requires a signed-in user.
 *
 * The attempted path is passed to the sign-in page in router state, so after
 * signing in the admin lands where they were going instead of on the catalogue
 * having forgotten why they signed in.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { isLoading, isSignedIn } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid flex-1 place-items-center py-24" aria-busy="true">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          <p className="text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to={ROUTES.signIn} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
