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
    version: UPCOMING,
    changes: [
      L(
        'Vor jeder Lektion fragt Klavio: «Auf meinem Klavier» oder «Auf dem Bildschirm»? Mit einem Digitalpiano geht es mit der ersten Taste los. Während der Lektion zeigt «Ich höre: E», dass dein Ton angekommen ist.',
        'Before each lesson Klavio asks: «On my piano» or «On the screen»? With a digital piano the first key starts the lesson. During the lesson «I hear: E» shows that your note arrived.',
      ),
      L(
        'Traumlied: Bei jeder Fähigkeit steht, in welchem Kapitel du sie lernst. Mit «Die Reise» zeigt die Karte des Traumlieds auch das Höhenprofil – im Stil des Lernpfads.',
        'Dream song: every skill shows the chapter where you learn it. With «The journey» the dream song card also shows the elevation profile – in the style of the learning path.',
      ),
      L(
        'Neues Kapitel «Neue Rhythmen» (Stufe 3): Achtelnoten und der Dreivierteltakt.',
        'New chapter «New rhythms» (level 3): eighth notes and three-four time.',
      ),
      L(
        'Bonus-Lieder: «Bruder Jakob», «Jingle Bells» und «Old MacDonald» – sie öffnen sich mit den ersten Liedern und halten niemanden auf.',
        'Bonus songs: «Brother John», «Jingle Bells» and «Old MacDonald» – they open with the first songs and hold nobody up.',
      ),
      L(
        'Freies Spielen: ohne Aufgabe auf der Bildschirm-Klaviatur, mit Klavier, Spieluhr, Marimba oder Orgel.',
        'Free play: no task, just the screen keyboard, with piano, music box, marimba or organ.',
      ),
      L(
        'Kleiderschrank: Mit jedem Level gibt es ein neues Stück für deine Figur – Zipfelmütze, Schleife, Brille, Schal, Kopfhörer und Krone.',
        'Wardrobe: every level brings a new piece for your figure – pointy hat, bow, glasses, scarf, headphones and crown.',
      ),
      L(
        'Eine ganze Welt geschafft? Das wird jetzt gefeiert – und das Tor zur nächsten Welt geht auf.',
        'Finished a whole world? That is now celebrated – and the gate to the next world opens.',
      ),
      L(
        'Ein freier Tag pro Woche: Wer einen Tag auslässt, behält seine Serie trotzdem.',
        'One free day per week: skipping a day no longer ends your streak.',
      ),
      L(
        'Für Eltern: «Familie und Fortschritt» zeigt jedes Profil mit Lektionen, Sternen und Übungsminuten der letzten acht Wochen. Unter «Mein Profil» siehst du deinen eigenen Verlauf.',
        'For parents: «Family and progress» shows every profile with lessons, stars and minutes practised over the last eight weeks. «My profile» shows your own history.',
      ),
      L(
        'Für Erwachsene: «Ich kann schon …» – auf dem Lernpfad später einsteigen. Dazu ein Metronom mit Tempo tippen, und am Gipfel steht ehrlich, wie es mit dem Traumlied weitergeht.',
        'For adults: «I can already …» – join the learning path later. Plus a metronome with tap tempo, and the summit says honestly how to go on with your dream song.',
      ),
      L(
        'Deine Daten: Unter «Konto» lässt sich alles herunterladen, was über dein Konto gespeichert ist. Admins können lange unbenutzte Konten nach einer Warnung löschen lassen und die Instanz vor Suchmaschinen verbergen.',
        'Your data: under «Account» you can download everything stored about your account. Admins can have long-unused accounts deleted after a warning and hide the instance from search engines.',
      ),
      L(
        'Auf dem Handy: eine Leiste unten für Lernen, Spielen, Wissen und Profil; ein kürzeres Formular für neue Profile; Noten und Klaviatur nebeneinander, wenn das Handy quer liegt; ein kurzes Brummen bei richtig und falsch.',
        'On phones: a bar at the bottom for learn, play, knowledge and profile; a shorter form for new profiles; notes and keyboard side by side with the phone sideways; a short buzz for right and wrong.',
      ),
      L(
        'Die Startseite zeigt jetzt, wie Klavio aussieht, was es kostet (nichts) und wie Familien und Schulen es selbst betreiben.',
        'The start page now shows what Klavio looks like, what it costs (nothing) and how families and schools run it themselves.',
      ),
      L(
        'Neue Welt «Die Reise»: von der Alp hinunter durch Tobel, Schlucht und Stollen bis in die Hölle, das schwerste Kapitel, und dann hinauf über den Gipfelgrat zum Traumlied. Ein Höhenprofil zeigt, wo du gerade bist. Ab einem Alter, das Admins einstellen (Standard 12), wählt jedes Profil zwischen den bunten Welten und der Reise.',
        'New world «The journey»: from the alp down through ravine, gorge and mine into hell, the hardest chapter, and then up over the summit ridge to the dream song. An elevation profile shows where you are. From an age admins set (12 by default), every profile chooses between the colourful worlds and the journey.',
      ),
      L(
        'E-Mails im Klavio-Look: Die Codes kommen jetzt in einer gestalteten E-Mail mit Logo und Klavi, in der Sprache, in der du Klavio nutzt. Admins können die Texte auf Deutsch und Englisch anpassen, mit Vorschau und Test-E-Mail.',
        'E-mails in Klavio’s look: codes now arrive in a designed e-mail with the logo and Klavi, in the language you use Klavio in. Admins can change the texts in German and English, with a preview and a test e-mail.',
      ),
      L(
        'Datenschutz: Eine eigene Seite erklärt in einfachen Worten, welche Daten wo liegen und wie du sie löschst. Admins tragen ein, wer die Instanz betreibt und wie man sie erreicht.',
        'Privacy: a page of its own explains in plain words which data is kept where and how you delete it. Admins fill in who runs the instance and how to reach them.',
      ),
      L(
        'Profile fragen nach dem Geburtsjahr (nur das Jahr, kein Datum) – so bietet Klavio die passenden Welten an. Bestehende Profile behalten ihre Welt, bis das Jahr eingetragen ist.',
        'Profiles ask for the year of birth (just the year, no date) – so Klavio offers the right worlds. Existing profiles keep their world until the year is filled in.',
      ),
      L(
        'Neue Fusszeile mit Datenschutz, Was ist neu, Kontakt, Quellcode, Fehler melden und Lizenz – auf allen Seiten.',
        'New footer with privacy, what’s new, contact, source code, problem reports and licence – on every page.',
      ),
      L(
        'Korrektur: Auf dem Handy lässt sich die Seite über der Klaviatur wieder scrollen, ohne dass dabei Tasten gespielt werden. Eine Taste spielt beim Antippen; zum Wischen über die Tasten verschiebt sich die Klaviatur.',
        'Fix: on phones the page scrolls over the keyboard again without playing keys. A key plays when tapped; swiping across the keys moves the keyboard.',
      ),
      L(
        'Handy und Tablet zuerst: In Lektionen bleibt die Klaviatur unten am Bildschirm, mit Tasten in Fingergrösse – auch quer gehalten. Dialoge füllen auf dem Handy den Bildschirm, Knöpfe und Schalter werden nicht mehr abgeschnitten.',
        'Phone and tablet first: in lessons the keyboard stays at the bottom of the screen, with finger-sized keys – also held sideways. Dialogs fill the screen on phones; buttons and switches are no longer cut off.',
      ),
      L(
        'Auf dem Handy schlägt Klavio vor, sich als App zu installieren – auch in Browsern ohne eigenen Installieren-Knopf.',
        'On phones Klavio suggests installing it as an app – also in browsers without an install button of their own.',
      ),
    ],
  },
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
