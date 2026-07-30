import { useEffect, type ReactNode } from 'react';

import { useLanguage } from '@/app/hooks/use-language';
import { LANGUAGE_META } from '@/app/i18n';

/**
 * Mirrors the active language onto <html lang>, which is what drives the
 * Burmese font stack and taller line-height in `fonts.css` — plus screen-reader
 * pronunciation and Chrome's "translate this page" prompt.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = LANGUAGE_META[language].htmlLang;
  }, [language]);

  return <>{children}</>;
}
