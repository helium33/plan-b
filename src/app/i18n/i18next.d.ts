import type { TranslationSchema } from './locales/en';

/**
 * Teaches TypeScript the shape of our translation bundle, which is what makes
 * `t('nav.shop')` autocomplete and `t('nav.shp')` a compile error.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: TranslationSchema;
    };
  }
}
