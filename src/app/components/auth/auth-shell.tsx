/**
 * Two-column frame for the sign-in and sign-up pages.
 *
 * The left panel carries the brand and the reasons to bother creating an
 * account; the right holds the form. On mobile the panel collapses away
 * entirely rather than stacking above the form — a customer who tapped "Sign
 * in" wants the fields, not a sales pitch to scroll past.
 */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Gift, ShieldCheck, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Logo } from '@/app/components/common/logo';
import { useDocumentTitle } from '@/app/hooks/use-document-title';
import { LOYALTY } from '@/lib/membership';

export type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  /** Rendered under the form — the "no account yet?" cross-link. */
  footer?: ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  useDocumentTitle(title);

  return (
    <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <BrandPanel />

      <div className="flex items-center justify-center px-4 py-12 sm:px-8 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* `Logo` is already a link to the home page — wrapping it in another
              one nests <a> inside <a>, which React rejects and browsers repair
              by splitting the elements. */}
          <div className="lg:hidden">
            <Logo />
          </div>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:mt-0">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-8 text-sm text-muted-foreground">{footer}</div> : null}
        </motion.div>
      </div>
    </div>
  );
}

/** Desktop-only brand column. */
function BrandPanel() {
  const { t } = useTranslation();

  const benefits = [
    { icon: Gift, key: 'points' as const, values: { points: LOYALTY.signUpBonus } },
    { icon: Store, key: 'inStore' as const, values: {} },
    { icon: ShieldCheck, key: 'history' as const, values: {} },
  ];

  return (
    // `dark` is not a typo. This panel is deep navy in *both* themes, so the
    // shared `Logo` — which paints its wordmark with `text-foreground` — would
    // render near-black on near-black in light mode. Marking the subtree `dark`
    // rebinds the theme custom properties for everything inside it, so borrowed
    // components adapt on their own instead of each needing an `inverted` prop.
    <aside className="dark relative hidden overflow-hidden border-r border-border bg-brand-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_0%,var(--brand-700)_0%,transparent_60%),radial-gradient(50%_50%_at_100%_100%,var(--gold-600)_0%,transparent_55%)] opacity-40"
      />

      <Logo className="relative w-fit" />

      <div className="relative">
        <p className="text-2xl font-semibold leading-snug tracking-tight text-white">
          {t('auth.panelHeadline')}
        </p>

        <ul className="mt-8 space-y-5">
          {benefits.map(({ icon: Icon, key, values }) => (
            <li key={key} className="flex gap-3.5">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-gold-300">
                <Icon className="h-4.5 w-4.5" strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-sm font-medium text-white">
                  {t(`auth.benefits.${key}.title`, values)}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-white/65">
                  {t(`auth.benefits.${key}.body`, values)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-white/50">{t('auth.panelFootnote')}</p>
    </aside>
  );
}
