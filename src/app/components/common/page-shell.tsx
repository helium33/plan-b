import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Hammer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/components/ui/utils';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import type { TranslationSchema } from '@/app/i18n/locales/en';

/** Keys under `pages.*` that carry a `title` + `description` pair. */
export type PageKey = Exclude<keyof TranslationSchema['pages'], 'notFound' | 'placeholder'>;

interface PageShellProps {
  pageKey: PageKey;
  children?: ReactNode;
  /** Hides the default heading block when a page brings its own hero. */
  bare?: boolean;
  className?: string;
}

/**
 * Standard page frame: sets the tab title, renders the translated heading and
 * fades the content in. Every route uses this so headings, gutters and vertical
 * rhythm stay identical across the site.
 */
export function PageShell({ pageKey, children, bare = false, className }: PageShellProps) {
  const { t } = useTranslation();

  const title = t(`pages.${pageKey}.title`);
  const description = t(`pages.${pageKey}.description`);

  useDocumentTitle(title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={cn('flex flex-1 flex-col', className)}
    >
      {!bare && (
        <div className="border-b border-border bg-gradient-to-b from-muted/50 to-background">
          <div className="container-page py-12 sm:py-16">
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      )}

      {children}
    </motion.div>
  );
}

/**
 * Marks a route as scaffolded-but-not-built. Keeps navigation honest while the
 * feature modules land one at a time — and disappears as each page is filled in.
 */
export function PagePlaceholder({ pageKey }: { pageKey: PageKey }) {
  const { t } = useTranslation();

  return (
    <PageShell pageKey={pageKey}>
      <div className="container-page flex flex-1 items-center justify-center py-16">
        <div className="w-full max-w-md rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground mx-auto">
            <Hammer className="h-5 w-5" strokeWidth={1.9} />
          </span>

          <p className="mt-4 inline-flex items-center rounded-full bg-gold-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-600">
            {t('pages.placeholder.badge')}
          </p>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t('pages.placeholder.body')}
          </p>
        </div>
      </div>
    </PageShell>
  );
}
