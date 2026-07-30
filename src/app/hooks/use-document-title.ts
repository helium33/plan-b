import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Sets `document.title` for the current page and restores nothing on unmount —
 * the next page sets its own, and a flash of the previous title looks worse.
 *
 * The brand name and tagline are read through `t()` rather than the English
 * bundle, so the tab title follows the language toggle along with the UI.
 *
 * @param title Already-translated page title. Omit on the home page to get the
 *              brand + tagline form.
 */
export function useDocumentTitle(title?: string) {
  const { t } = useTranslation();

  const brand = t('brand.name');
  const tagline = t('brand.tagline');

  useEffect(() => {
    document.title = title ? `${title} · ${brand}` : `${brand} — ${tagline}`;
  }, [title, brand, tagline]);
}
