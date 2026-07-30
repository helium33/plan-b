import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { normalizeLanguage, type Language } from '@/app/i18n';

/**
 * The one way components read or change the active language.
 *
 * Wraps `useTranslation` so callers get a narrowed `Language` (never a raw
 * `my-MM`) plus the toggle helper the header needs.
 */
export function useLanguage() {
  const { t, i18n } = useTranslation();

  // `resolvedLanguage` is what i18next actually served, which is the value that
  // matches the strings on screen — `language` can still hold `my-MM`.
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

  const setLanguage = useCallback(
    (next: Language) => {
      if (next !== language) void i18n.changeLanguage(next);
    },
    [i18n, language],
  );

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'my' : 'en');
  }, [language, setLanguage]);

  return {
    t,
    language,
    setLanguage,
    toggleLanguage,
    isMyanmar: language === 'my',
  };
}
