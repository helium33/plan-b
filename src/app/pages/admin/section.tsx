/**
 * Everything under `/admin`, as one lazily-loaded unit.
 *
 * The nested `<Routes>` resolves relative to the `/admin/*` splat in `App.tsx`,
 * so `index` is `/admin` and `frames` is `/admin/frames`.
 *
 * The session comes from `AuthGate`, the pathless route above this one, which is
 * shared with the sign-in page.
 *
 * `RequireAuth` establishes a session; `AdminLayout` then checks `admins/{uid}`
 * once for the whole section, so a new admin page inherits the gate rather than
 * having to remember it. Firestore rules are what actually enforce it — the gate
 * here is courtesy, not security.
 */
import { Route, Routes } from 'react-router-dom';

import { AdminLayout } from '@/app/components/admin/admin-layout';
import { RequireAuth } from '@/app/components/auth/require-auth';
import { AdminCreditPage } from '@/app/pages/admin/credit';
import { AdminFramesPage } from '@/app/pages/admin/frames';
import { AdminSeedPage } from '@/app/pages/admin/seed';
import { AdminUploadPage } from '@/app/pages/admin/upload';

export function AdminSection() {
  return (
    <Routes>
      <Route
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminUploadPage />} />
        <Route path="frames" element={<AdminFramesPage />} />
        <Route path="seed" element={<AdminSeedPage />} />
        <Route path="credit" element={<AdminCreditPage />} />
      </Route>
    </Routes>
  );
}
