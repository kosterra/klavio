import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { APP_CONFIG } from '@klavio/shared';
import deCH from './de-CH.json';
import en from './en.json';

export const resources = { 'de-CH': { translation: deCH }, en: { translation: en } } as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: APP_CONFIG.defaultLocale,
  fallbackLng: 'de-CH',
  supportedLngs: [...APP_CONFIG.supportedLocales],
  interpolation: { escapeValue: false, defaultVariables: { appName: APP_CONFIG.name } },
});

export default i18n;
