/**
 * Central app identity. The product name is not final yet ("Klavio" is a
 * placeholder) — change it here and it propagates to UI, manifest, WebAuthn
 * relying-party name and e-mails.
 */
export const APP_CONFIG = {
  name: 'Klavio',
  shortName: 'Klavio',
  description: 'Spielerisch Klavier lernen – am echten Klavier.',
  themeColor: '#3b5bdb',
  backgroundColor: '#fffaf2',
  defaultLocale: 'de-CH',
  supportedLocales: ['de-CH', 'en'],
} as const;

export type Locale = (typeof APP_CONFIG.supportedLocales)[number];
