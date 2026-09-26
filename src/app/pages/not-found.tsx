import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/app/config/navigation';
import { useDocumentTitle } from '@/app/hooks/use-document-title';

export function NotFoundPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('pages.notFound.title'));

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-24">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Compass className="h-6 w-6" strokeWidth={1.8} />
        </span>

        <p className="mt-6 text-5xl font-semibold tracking-tight text-foreground">404</p>

        <h1 className="mt-3 text-xl font-medium text-foreground">{t('pages.notFound.title')}</h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t('pages.notFound.body')}
        </p>

        <Link
          to={ROUTES.catalog}
          className="mt-7 inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {t('pages.notFound.cta')}
        </Link>
      </div>
    </div>
  );
}
