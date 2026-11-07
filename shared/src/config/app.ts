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
  /**
   * Where the source code of this instance is published. Required by the
   * AGPL-3.0 for anyone offering a (modified) version as an online service —
   * point it to your fork if you change the code.
   */
  sourceUrl: 'https://github.com/kosterra/klavio',
  license: 'AGPL-3.0',
} as const;

export type Locale = (typeof APP_CONFIG.supportedLocales)[number];
