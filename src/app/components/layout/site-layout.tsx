import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { HelpWidget } from '@/app/components/common/help-widget';
import { Footer } from '@/app/components/layout/footer';
import { Header } from '@/app/components/layout/header';

/**
 * The shell every page renders inside: skip link, header, routed content, footer.
 *
 * `flex-col` + `flex-1` on <main> keeps the footer at the bottom of short pages
 * without resorting to a fixed height.
 */
export function SiteLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
      >
        {t('nav.skipToContent')}
      </a>

      <Header />

      <main id="main-content" className="flex flex-1 flex-col">
        <Outlet />
      </main>

      <Footer />

      {/* Outside <main>, so the help bubble is not announced as page content and
          the skip link still jumps past the header to the actual page. */}
      <HelpWidget />
    </div>
  );
}
