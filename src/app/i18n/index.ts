/**
 * i18next bootstrap. Import this once from `main.tsx` before React renders —
 * every other module should reach for `useTranslation()` / `useLanguage()`
 * instead of touching the instance directly.
 *
 * i18next owns the language state (and its own localStorage persistence), so
 * there is deliberately no Zustand mirror of it — two stores for one value is
 * how a UI ends up half-translated after a refresh.
 */
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { en } from './locales/en';
import { my } from './locales/my';

export const SUPPORTED_LANGUAGES = ['en', 'my'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';
export const LANGUAGE_STORAGE_KEY = 'pbv-language';

/** Metadata for rendering language switchers without hardcoding labels in JSX. */
export const LANGUAGE_META: Record<Language, { label: string; short: string; htmlLang: string }> = {
  en: { label: 'English', short: 'EN', htmlLang: 'en' },
  my: { label: 'မြန်မာ', short: 'MM', htmlLang: 'my' },
};

export const resources = {
  en: { translation: en },
  my: { translation: my },
} as const;

/** Narrows any detected tag (`my-MM`, `en-GB`, `null`) to a language we ship. */
export function normalizeLanguage(value: string | null | undefined): Language {
  const base = (value ?? '').toLowerCase().split('-')[0];
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(base)
    ? (base as Language)
    : DEFAULT_LANGUAGE;
}

void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    // Strip the region before anything is resolved or cached, so a browser
    // reporting `en-US` becomes `en` — otherwise the detector persists the
    // regional tag to localStorage and every later read has to re-normalise it.
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: {
      // React escapes for us; double-escaping mangles Burmese punctuation.
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    // Resources are bundled, so there is nothing to wait for at boot.
    react: { useSuspense: false },
  });

export default i18next;
