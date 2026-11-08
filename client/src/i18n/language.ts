import { APP_CONFIG, type Locale } from '@klavio/shared';

/** The language chosen on this device (not synced: a family may share an account). */
export const LANGUAGE_KEY = 'klavio-language';

const SUPPORTED = APP_CONFIG.supportedLocales as readonly string[];

/**
 * The language to start with: the one chosen on this device, else the first
 * browser language we offer (any German → de-CH, any English → en), else the default.
 */
export function initialLanguage(stored: string | null, browser: readonly string[]): Locale {
  if (stored && SUPPORTED.includes(stored)) return stored as Locale;
  for (const lang of browser) {
    const l = lang.toLowerCase();
    if (l.startsWith('de')) return 'de-CH';
    if (l.startsWith('en')) return 'en';
  }
  return APP_CONFIG.defaultLocale;
}

export function readStoredLanguage(): string | null {
  try {
    return localStorage.getItem(LANGUAGE_KEY);
  } catch {
    return null;
  }
}

export function storeLanguage(lang: string) {
  try {
    localStorage.setItem(LANGUAGE_KEY, lang);
  } catch {
    // private mode: the choice just isn't remembered
  }
}
