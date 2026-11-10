import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG, SEO_TEXTS, type PublicPage } from '@klavio/shared';

/**
 * The browser tab's (and the history's) title: «Page – Klavio», or for the
 * public pages the same title the server gives search engines.
 */
export function usePageTitle(title: string | null, publicPage?: PublicPage) {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'de-CH';
  const text = publicPage
    ? SEO_TEXTS[lang][publicPage].title
    : title
      ? `${title} – ${APP_CONFIG.name}`
      : APP_CONFIG.name;
  useEffect(() => {
    document.title = text;
  }, [text]);
}
