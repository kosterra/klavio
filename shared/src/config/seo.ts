import { APP_CONFIG } from './app.ts';

/**
 * What search engines and link previews see of the public pages – also
 * without running JavaScript: the server writes title, description, canonical
 * address, language alternatives and a short text into the page
 * (server/src/plugins/web.ts). The app shows the same texts once it runs.
 */
export const PUBLIC_PAGES = ['/welcome', '/privacy', '/whats-new'] as const;
export type PublicPage = (typeof PUBLIC_PAGES)[number];

export const SEO_LANGS = ['de-CH', 'en'] as const;
export type SeoLang = (typeof SEO_LANGS)[number];

interface PageText {
  title: string;
  description: string;
  /** visible text for crawlers without JavaScript (replaced by the app) */
  heading: string;
  body: string[];
}

const name = APP_CONFIG.name;

export const SEO_TEXTS: Record<SeoLang, Record<PublicPage, PageText>> = {
  'de-CH': {
    '/welcome': {
      title: `${name} – Klavier lernen am echten Klavier, wie im Spiel`,
      description: `${name} hört dir beim Spielen zu und führt dich Schritt für Schritt durch bunte Welten – für Kinder und Erwachsene. Kostenlos, ohne Werbung, Audio bleibt auf dem Gerät.`,
      heading: 'Klavier lernen – am echten Klavier, wie im Spiel.',
      body: [
        `${name} hört dir über das Mikrofon beim Spielen zu (oder nimmt ein Digitalpiano per MIDI) und zeigt dir Schritt für Schritt, was als Nächstes kommt.`,
        'Für Kinder: bunte Welten vom Tasten-Tal bis zur Sternen-Nacht. Für Jugendliche und Erwachsene: «Die Reise» – hinunter in die Hölle, das schwerste Kapitel, und hinauf zu deinem Traumlied.',
        'Kostenlos und ohne Abo, ohne Werbung und ohne Tracking. Was du spielst, bleibt auf deinem Gerät. Freie Software – du kannst Klavio auch selbst betreiben.',
      ],
    },
    '/privacy': {
      title: `Datenschutz – ${name}`,
      description: `Welche Daten ${name} speichert, was dein Gerät nie verlässt und wie du alles selbst löschst – in einfachen Worten.`,
      heading: 'Datenschutz',
      body: [
        'Was das Mikrofon hört, wird nur auf deinem Gerät ausgewertet – nie aufgenommen, hochgeladen oder gespeichert. Keine Werbung, kein Tracking.',
      ],
    },
    '/whats-new': {
      title: `Was ist neu – ${name}`,
      description: `Die Versionen von ${name} und was sich jeweils geändert hat.`,
      heading: 'Was ist neu',
      body: [`Neue Funktionen und Korrekturen von ${name}, Version für Version.`],
    },
  },
  en: {
    '/welcome': {
      title: `${name} – learn the piano on a real piano, like a game`,
      description: `${name} listens while you play and leads you step by step through colourful worlds – for children and adults. Free, no ads, the sound stays on your device.`,
      heading: 'Learn the piano – on a real piano, like a game.',
      body: [
        `${name} listens through the microphone while you play (or takes a digital piano over MIDI) and shows you step by step what comes next.`,
        'For children: colourful worlds from Key Valley to Starry Night. For teens and adults: «The journey» – down into hell, the hardest chapter, and up to your dream song.',
        'Free, no subscription, no ads, no tracking. What you play stays on your device. Free software – you can also run Klavio yourself.',
      ],
    },
    '/privacy': {
      title: `Privacy – ${name}`,
      description: `Which data ${name} keeps, what never leaves your device and how you delete everything yourself – in plain words.`,
      heading: 'Privacy',
      body: [
        'What the microphone hears is only analysed on your device – never recorded, uploaded or stored. No ads, no tracking.',
      ],
    },
    '/whats-new': {
      title: `What’s new – ${name}`,
      description: `The versions of ${name} and what changed in each.`,
      heading: 'What’s new',
      body: [`New features and fixes of ${name}, version by version.`],
    },
  },
};

/** The address of a public page in a language (German is the default, without parameter). */
export function pageUrl(origin: string, page: PublicPage, lang: SeoLang): string {
  return `${origin}${page}${lang === 'en' ? '?lang=en' : ''}`;
}
