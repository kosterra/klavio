import type { Localized } from '@klavio/shared';

/** The entry with the changes that are not released yet (shown as «Kommt bald»). */
export const UPCOMING = 'Next release';

export interface Release {
  /** {year}.{month}.{sequence}, or UPCOMING */
  version: string;
  /** a topic before the colon is shown in bold; a fix starts with «Korrektur: » / «Fix: » */
  changes: Localized[];
}

const L = (de: string, en: string): Localized => ({ 'de-CH': de, en });

/**
 * What changed for learners and parents, newest first. New changes go into the
 * «Next release» entry on top; right before the pull request the version is
 * set (scripts/version.mjs) and that entry gets its number. A numbered entry
 * is never changed again (see .claude/skills/whats-new).
 */
export const CHANGELOG: Release[] = [
  {
    version: '2026.11.0',
    changes: [
      L(
        'Klavi liest vor: Aufgaben und Erklärungen auf Knopfdruck oder ganz von selbst – für Kinder, die noch nicht lesen können. Die Stimme kommt von deinem Gerät; ein- und ausschalten unter «Mein Profil».',
        'Klavi reads aloud: tasks and explanations at the tap of a button or all by itself – for children who can’t read yet. The voice comes from your device; switch it on or off under “My profile”.',
      ),
      L(
        'Klavio spricht Englisch: Die Sprache lässt sich auf der Startseite und im Menü umschalten.',
        'Klavio speaks English: switch the language on the start page or in the menu.',
      ),
      L(
        'Was ist neu: Diese Seite zeigt, was sich in Klavio ändert – Version für Version.',
        'What’s new: this page shows what changes in Klavio – version by version.',
      ),
      L(
        'Elternbereich: Eltern öffnen ihn auf Wunsch auch mit einem Passkey statt mit der PIN – einschalten unter «Konto» → «Elternbereich». Die Einrichtung von Mikrofon und Digitalpiano gehört jetzt zum Elternbereich.',
        'Parent area: parents can also open it with a passkey instead of the PIN – switch it on under “Account” → “Parent area”. Setting up the microphone and digital piano now belongs to the parent area.',
      ),
      L(
        'Korrektur: «Zum Lernpfad» wird auf dem Ergebnis-Bildschirm nicht mehr abgeschnitten.',
        'Fix: “To the learning path” on the result screen is no longer cut off.',
      ),
      L(
        'Geteilte Links: Ein Link zu Klavio zeigt in Nachrichten-Apps jetzt Titel, Beschreibung und ein Bild der Welten.',
        'Shared links: a link to Klavio now shows a title, a description and a picture of the worlds in messaging apps.',
      ),
    ],
  },
  {
    version: '0.1.0',
    changes: [
      L(
        'Lernpfad: acht Welten in zwei Stufen – vom Tasten-Tal bis zur Sternen-Nacht, mit Bass-Höhle, Brücken-Stadt und Stücken für beide Hände.',
        'Learning path: eight worlds on two levels – from Key Valley to Starry Night, with Bass Cave, Bridge Town and pieces for both hands.',
      ),
      L(
        'Am echten Klavier: Klavio hört über das Mikrofon zu, nimmt ein Digitalpiano per MIDI oder lässt dich auf der Bildschirm-Klaviatur spielen. Audio bleibt auf dem Gerät.',
        'On a real piano: Klavio listens through the microphone, takes a digital piano over MIDI or lets you play on the screen keyboard. Audio stays on the device.',
      ),
      L(
        'Entdecken: vor jeder Lektion eine kurze Erklärung mit Bildern, Spielen und Quiz; alles Gelernte unter «Wissen».',
        'Discover: a short explanation with pictures, games and quizzes before each lesson; everything learned under “Knowledge”.',
      ),
      L(
        'Wiederholen wie mit Lernkarten: Gespielte Lektionen kommen nach 1, 3, 7, 14 und 30 Tagen wieder, mit Bonus-XP, der «Schnellen Runde» und eigenen Medaillen.',
        'Review like flash cards: lessons come back after 1, 3, 7, 14 and 30 days, with bonus XP, the “Quick round” and medals of their own.',
      ),
      L(
        'Mein Traumlied: Erwachsene wählen das Lied, das sie einmal spielen möchten – Klavio erkennt es, zeigt die nötigen Fähigkeiten und wie nah man ihm schon ist.',
        'My dream song: adults pick the song they’d like to play one day – Klavio recognises it, shows the skills it needs and how close you already are.',
      ),
      L(
        'Für die ganze Familie: mehrere Profile, Kids- und Classic-Darstellung, dunkles Farbschema, Eltern-PIN und Anmeldung mit Passkey oder E-Mail-Code.',
        'For the whole family: several profiles, Kids and Classic view, a dark colour scheme, a parent PIN and sign-in with a passkey or e-mail code.',
      ),
    ],
  },
];

/** The release build of main has no «Next release»: everything in it is out. */
export const RELEASES: Release[] = __APP_RELEASED__
  ? CHANGELOG.filter((r) => r.version !== UPCOMING)
  : CHANGELOG;

/** A fix starts with «Korrektur: » (German) or «Fix: » (English). */
export const FIX = /^(Korrektur|Fix):\s+/;

export function isFix(text: string) {
  return FIX.test(text);
}
