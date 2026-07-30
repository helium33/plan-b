import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Logo } from '@/app/components/common/logo';
import { cn } from '@/app/components/ui/utils';
import { FOOTER_COLUMNS, ROUTES } from '@/app/config/navigation';
import { env } from '@/lib/env';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand + newsletter */}
          <div className="lg:col-span-4">
            <Logo />

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t('brand.shortDescription')}
            </p>

            <NewsletterForm className="mt-6" />
          </div>

          {/* Link columns */}
          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-5">
            {FOOTER_COLUMNS.map((column) => (
              <nav key={column.titleKey} aria-labelledby={`footer-${column.titleKey}`}>
                <h3
                  id={`footer-${column.titleKey}`}
                  className="text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  {t(column.titleKey)}
                </h3>

                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={`${column.titleKey}-${link.to}`}>
                      <Link
                        to={link.to}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {t(link.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* Store details */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {t('footer.visitUs')}
            </h3>

            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.9} />
                <span>{t('footer.address')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.9} />
                <span>{t('footer.hours')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.9} />
                <a
                  href={`tel:${env.store.phone.replace(/\s+/g, '')}`}
                  className="transition-colors hover:text-foreground"
                  dir="ltr"
                >
                  {env.store.phone}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.9} />
                <a
                  href={`mailto:${env.store.email}`}
                  className="break-all transition-colors hover:text-foreground"
                  dir="ltr"
                >
                  {env.store.email}
                </a>
              </li>
            </ul>

            <Link
              to={ROUTES.booking}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {t('actions.bookAppointment')}
            </Link>
          </div>
        </div>
      </div>

      {/* Legal strip */}
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} {t('brand.name')}. {t('footer.rights')}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              to="/privacy"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('footer.privacy')}
            </Link>
            <Link
              to="/terms"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('footer.terms')}
            </Link>
            <p className="text-xs text-muted-foreground">{t('footer.madeWith')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Newsletter capture. Wiring it to Firestore belongs with the rest of the data
 * layer, so for now it validates and acknowledges locally.
 */
function NewsletterForm({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      className={cn('space-y-2.5', className)}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <label htmlFor="newsletter-email" className="block text-xs font-semibold uppercase tracking-wider text-foreground">
        {t('footer.newsletter')}
      </label>

      <p className="text-sm leading-relaxed text-muted-foreground">{t('footer.newsletterPitch')}</p>

      <div className="flex gap-2">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setSubmitted(false);
          }}
          placeholder={t('footer.emailPlaceholder')}
          className="h-10 min-w-0 flex-1 rounded-full border border-input bg-input-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          aria-label={t('actions.subscribe')}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          <Send className="h-4 w-4" strokeWidth={1.9} />
        </button>
      </div>

      {submitted && (
        <p role="status" className="text-sm text-success">
          {t('common.comingSoon')}
        </p>
      )}
    </form>
  );
}
