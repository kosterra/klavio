import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { APP_CONFIG } from '@klavio/shared';
import deCH from './de-CH.json';
import en from './en.json';
import { initialLanguage, languageFromUrl, readStoredLanguage, storeLanguage } from './language';

export const resources = { 'de-CH': { translation: deCH }, en: { translation: en } } as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage(
    (typeof location === 'undefined' ? null : languageFromUrl(location.search)) ??
      readStoredLanguage(),
    typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language]),
  ),
  fallbackLng: 'de-CH',
  supportedLngs: [...APP_CONFIG.supportedLocales],
  interpolation: { escapeValue: false, defaultVariables: { appName: APP_CONFIG.name } },
});

// keep <html lang> right (screen readers, hyphenation) and remember a change
const applyLang = (lng: string) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
};
applyLang(i18n.language);
if (typeof location !== 'undefined' && languageFromUrl(location.search))
  storeLanguage(i18n.language);
i18n.on('languageChanged', (lng) => {
  applyLang(lng);
  storeLanguage(lng);
});

export default i18n;
