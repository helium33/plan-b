import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import {
  RedirectIfSignedIn,
  RequireAuth,
  RequireMember,
} from '@/app/components/auth/require-auth';
import { ScrollToTop } from '@/app/components/common/scroll-to-top';
import { SiteLayout } from '@/app/components/layout/site-layout';
import { ROUTES } from '@/app/config/navigation';
import { AuthProvider } from '@/app/providers/auth-provider';
import { LanguageProvider } from '@/app/providers/language-provider';
import { ThemeProvider } from '@/app/providers/theme-provider';

import { AdminLayout } from '@/app/components/admin/admin-layout';
import { AboutPage } from '@/app/pages/about';
import { AccountPage } from '@/app/pages/account';
import { AdminFramesPage } from '@/app/pages/admin/frames';
import { AdminSeedPage } from '@/app/pages/admin/seed';
import { AdminUploadPage } from '@/app/pages/admin/upload';
import { BookingPage } from '@/app/pages/booking';
import { CartPage } from '@/app/pages/cart';
import { CheckoutPage } from '@/app/pages/checkout';
import { ComparePage } from '@/app/pages/compare';
import { ContactPage } from '@/app/pages/contact';
import { EyeCarePage } from '@/app/pages/eye-care';
import { HomePage } from '@/app/pages/home';
import { LookbookPage } from '@/app/pages/lookbook';
import { NotFoundPage } from '@/app/pages/not-found';
import { OnboardingPage } from '@/app/pages/onboarding';
import { ProductDetailPage } from '@/app/pages/product-detail';
import { RecommendationsPage } from '@/app/pages/recommendations';
import { ShopPage } from '@/app/pages/shop';
import { SignInPage } from '@/app/pages/sign-in';
import { SignUpPage } from '@/app/pages/sign-up';
import { WishlistPage } from '@/app/pages/wishlist';

/**
 * Route table for Plan B Vision.
 *
 * Providers wrap the router rather than the other way round: the header's theme,
 * language and account controls sit inside `SiteLayout`, so all three contexts
 * have to be available above it.
 *
 * `AuthProvider` is innermost of the three because it is the only one that
 * depends on the others — its error messages are translated — while nothing in
 * theme or language depends on the session.
 */
export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />

            <Routes>
              <Route element={<SiteLayout />}>
                <Route path={ROUTES.home} element={<HomePage />} />

                {/* Catalogue */}
                <Route path={ROUTES.shop} element={<ShopPage />} />
                <Route path={ROUTES.product} element={<ProductDetailPage />} />
                <Route path={ROUTES.lookbook} element={<LookbookPage />} />
                <Route path={ROUTES.wishlist} element={<WishlistPage />} />
                <Route path={ROUTES.compare} element={<ComparePage />} />

                {/* Content */}
                <Route path={ROUTES.eyeCare} element={<EyeCarePage />} />
                <Route path={ROUTES.booking} element={<BookingPage />} />
                <Route path={ROUTES.about} element={<AboutPage />} />
                <Route path={ROUTES.contact} element={<ContactPage />} />

                {/* Account */}
                <Route
                  path={ROUTES.signIn}
                  element={
                    <RedirectIfSignedIn>
                      <SignInPage />
                    </RedirectIfSignedIn>
                  }
                />
                <Route
                  path={ROUTES.signUp}
                  element={
                    <RedirectIfSignedIn>
                      <SignUpPage />
                    </RedirectIfSignedIn>
                  }
                />
                {/* Onboarding writes to the member record, so it needs a phone
                    number — `RequireMember`, not `RequireAuth`. */}
                <Route
                  path={ROUTES.onboarding}
                  element={
                    <RequireMember>
                      <OnboardingPage />
                    </RequireMember>
                  }
                />
                {/* Reads the saved profile, so it needs a member record too. */}
                <Route
                  path={ROUTES.recommendations}
                  element={
                    <RequireMember>
                      <RecommendationsPage />
                    </RequireMember>
                  }
                />
                {/* `RequireAuth` on purpose: this page hosts the phone-linking
                    form, so a customer without a phone number must be able to
                    reach it. `RequireMember` would redirect them here from here. */}
                <Route
                  path={ROUTES.account}
                  element={
                    <RequireAuth>
                      <AccountPage />
                    </RequireAuth>
                  }
                />

                {/* Purchase — cart stays open to guests; Module 8 decides whether
                    checkout requires an account. */}
                <Route path={ROUTES.cart} element={<CartPage />} />
                <Route path={ROUTES.checkout} element={<CheckoutPage />} />

                {/* Admin. `RequireAuth` establishes a session; `AdminLayout` then
                    checks `admins/{uid}` once for the whole section, so a new
                    admin page inherits the gate rather than having to remember it.
                    Firestore and Storage rules are what actually enforce it. */}
                <Route
                  path={ROUTES.admin}
                  element={
                    <RequireAuth>
                      <AdminLayout />
                    </RequireAuth>
                  }
                >
                  <Route index element={<AdminUploadPage />} />
                  <Route path="frames" element={<AdminFramesPage />} />
                  <Route path="seed" element={<AdminSeedPage />} />
                </Route>

                {/* Legacy paths from the original template. */}
                <Route path="/services" element={<Navigate to={ROUTES.eyeCare} replace />} />
                <Route path="/products" element={<Navigate to={ROUTES.shop} replace />} />

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
