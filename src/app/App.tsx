import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { ScrollToTop } from '@/app/components/common/scroll-to-top';
import { AppShell } from '@/app/components/layout/app-shell';
import { ROUTES } from '@/app/config/navigation';
import { AuthProvider } from '@/app/providers/auth-provider';
import { LanguageProvider } from '@/app/providers/language-provider';
import { ThemeProvider } from '@/app/providers/theme-provider';

import { CatalogPage } from '@/app/pages/catalog';
import { FrameDetailPage } from '@/app/pages/frame-detail';
import { NotFoundPage } from '@/app/pages/not-found';
import { OrderPage } from '@/app/pages/order';

/**
 * Pinky Beauty, loaded on demand.
 *
 * A self-contained product with its own palette, fonts and data — none of which
 * the wholesale catalogue needs. Lazily loading it keeps all of that off the
 * first paint of the app most visitors actually open.
 */
const PinkyApp = lazy(() =>
  import('@/pinky/pages/pinky-app').then((m) => ({ default: m.PinkyApp })),
);

/**
 * The staff screens, loaded on demand.
 *
 * Everything behind these two imports — Firebase Auth, the upload form, the
 * image compressor, the video inspector — is code a wholesale buyer can never
 * reach and should never pay to download. Splitting it here is what keeps the
 * catalogue's first paint small on a phone.
 *
 * The `.then` unwrapping is because these modules use named exports like the
 * rest of the codebase, and `React.lazy` wants a default.
 */
const AdminSection = lazy(() =>
  import('@/app/pages/admin/section').then((m) => ({ default: m.AdminSection })),
);
const SignInPage = lazy(() =>
  import('@/app/pages/sign-in').then((m) => ({ default: m.SignInPage })),
);
const GoodbyeScreen = lazy(() =>
  import('@/app/components/auth/auth-screens').then((m) => ({ default: m.GoodbyeScreen })),
);

/**
 * The credit dashboard. Lazy for the same reason as the staff screens: it
 * carries the charting library, which a buyer browsing frames never needs.
 */
const CreditPage = lazy(() =>
  import('@/app/pages/credit').then((m) => ({ default: m.CreditPage })),
);

function RouteFallback() {
  return (
    <div className="grid min-h-dvh place-items-center" aria-busy="true">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
    </div>
  );
}

/**
 * Route table for Plan B Wholesale.
 *
 * Two buyer-facing routes and a staff section. The staff section sits outside
 * `AppShell` on purpose: the bottom tab bar is the buyer's ordering loop, and
 * putting the upload form inside it would suggest the two belong to one journey.
 *
 * All three providers wrap the router. `AuthProvider` is app-wide because order
 * history is tied to an account and lives on the voucher, which is a buyer
 * screen — but it loads the Firebase Auth SDK inside an effect, so a visitor who
 * never signs in still does not pay for it on first paint. See the note there.
 */
export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
          <ScrollToTop />

          <Routes>
            {/* ── Buyer ───────────────────────────────────────────────────── */}
            <Route element={<AppShell />}>
              <Route path={ROUTES.catalog} element={<CatalogPage />} />
              <Route path={ROUTES.frame} element={<FrameDetailPage />} />
              <Route path={ROUTES.order} element={<OrderPage />} />
              <Route
                path={ROUTES.credit}
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <CreditPage />
                  </Suspense>
                }
              />
            </Route>

            {/* ── Pinky Beauty ────────────────────────────────────────────── */}
            <Route
              path={ROUTES.pinky}
              element={
                <Suspense fallback={<RouteFallback />}>
                  <PinkyApp />
                </Suspense>
              }
            />

            {/* ── Signed-in area ──────────────────────────────────────────── */}
            <Route
              path={ROUTES.signIn}
              element={
                <Suspense fallback={<RouteFallback />}>
                  <SignInPage />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.goodbye}
              element={
                <Suspense fallback={<RouteFallback />}>
                  <GoodbyeScreen />
                </Suspense>
              }
            />
            {/* Splat: `AdminSection` owns the routing below `/admin`. */}
            <Route
              path={`${ROUTES.admin}/*`}
              element={
                <Suspense fallback={<RouteFallback />}>
                  <AdminSection />
                </Suspense>
              }
            />

            {/* Paths from the retail build, kept as redirects so a bookmarked
                or shared link lands somewhere useful instead of on a 404. */}
            {['/shop', '/home', '/products', '/lookbook', '/about', '/contact'].map((path) => (
              <Route key={path} path={path} element={<Navigate to={ROUTES.catalog} replace />} />
            ))}
            <Route path="/cart" element={<Navigate to={ROUTES.order} replace />} />
            <Route path="/checkout" element={<Navigate to={ROUTES.order} replace />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
