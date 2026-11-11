import { useTranslation } from 'react-i18next';
import type { Localized } from '@klavio/shared';

/** Picks the curriculum text for the current UI language. */
export function useLocalized() {
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith('en');
  return (text: Localized | string) =>
    typeof text === 'string' ? text : en ? text.en : text['de-CH'];
}

export function useNoteLang(): 'de' | 'en' {
  const { i18n } = useTranslation();
  return i18n.language.startsWith('en') ? 'en' : 'de';
}
