# Lektionen, Lieder und Abzeichen schreiben

Der Lehrplan ist reine Daten in `shared/src/curriculum/`. Neue Inhalte brauchen keinen Server- oder
UI-Code, solange sie die vorhandenen Übungstypen nutzen.

| Datei           | Inhalt                                                                         |
| --------------- | ------------------------------------------------------------------------------ |
| `types.ts`      | Typen: Kapitel, Lektion, Übungstypen                                           |
| `curriculum.ts` | Alle Kapitel und Lektionen in Lernreihenfolge                                  |
| `song.ts`       | Kurzschreibweise für Melodien (`song`) und Rhythmen (`rhythm`) mit Taktprüfung |
| `badges.ts`     | Abzeichen und ihre Bedingungen                                                 |
| `rewards.ts`    | Sterne, XP, Level, Streak (nur ändern, wenn sich die Regeln ändern sollen)     |

## Grundregeln

- **IDs sind stabil.** Der Fortschritt wird pro Lektions-ID gespeichert, Abzeichen pro Abzeichen-ID.
  Eine ID nie umbenennen oder wiederverwenden. Format: `kleinbuchstaben-mit-bindestrich`.
- **Reihenfolge = Freischaltung.** Eine Lektion öffnet sich, wenn die vorherige in `LESSONS` (alle
  Kapitel nacheinander) abgeschlossen ist. Eine neue Lektion dazwischen einzufügen ist unproblematisch:
  Bereits abgeschlossene bleiben offen, die neue wird zur nächsten.
- **Zwei Sprachen:** Jeder Text ist `{ 'de-CH': …, en: … }`. Schweizer Schreibweise, kein «ß».
- **Nur gemeinfreie Lieder** (traditionell oder Komponist und Textdichter seit über 70 Jahren tot) und
  nur selbst erstellte Inhalte. Herkunft im Kommentar oder in der Einleitung nennen.
- **Kindgerecht:** kurze Sätze, «du», ein neuer Gedanke pro Lektion, ermutigend statt prüfend.

## Aufbau einer Lektion

```ts
{
  id: 'keys-d-e',
  kind: 'keys',                      // Symbol auf dem Lernpfad: keys | play | read | song | rhythm
  title: { 'de-CH': 'D und E', en: 'D and E' },
  intro: {                           // wird vor dem Start gezeigt
    'de-CH': 'Das D liegt zwischen den zwei schwarzen Tasten …',
    en: 'D sits between the two black keys …',
  },
  xp: 10,                            // Erstabschluss; richtwert 10 (Tasten) bis 30 (Lieder)
  keyboard: { from: 48, to: 72 },    // sichtbare Bildschirm-Klaviatur, an beiden Enden weisse Tasten
  keyLabels: 'none',                 // Notennamen auf den Tasten: 'all' | 'c' (nur C) | 'none'
  exercises: [ … ],                  // meist eine Übung pro Lektion
}
```

Hilfsfunktionen in `curriculum.ts`: `seq('C4 D4 E4')` → MIDI-Nummern (deutsches «H» geht auch),
`pcs('C D E')` → Tonklassen für «jede Oktave»-Übungen. Bereiche `C3_C5` und `C4_C5` stehen bereit.

## Übungstypen

**Finde die Taste** – Notenname anzeigen, das Kind spielt die Taste:

```ts
{ type: 'find-key', notes: pcs('C D E'), rounds: 6, anyOctave: true }
{ type: 'find-key', notes: seq('C4'), rounds: 3, anyOctave: false } // genau das mittlere C
```

**Spiel nach** – Tonfolgen der Reihe nach; die App wartet auf jeden Ton:

```ts
{ type: 'play-along', sequences: [seq('C4 D4 E4'), seq('E4 D4 C4')] }
```

**Notenlesen** – eine Note auf den Notenlinien, genau diese Taste spielen:

```ts
{ type: 'read-note', clef: 'treble', notes: seq('C4 D4 E4 F4 G4'), rounds: 8 }
```

**Lied spielen** («Warte auf mich») – Melodie in Kurzschreibweise, Takte mit `|`:

```ts
song('C4/q D4/q E4/q F4/q | G4/h G4/h | A4/q A4/q A4/q A4/q | G4/w', {
  time: '4/4', // Standard
  tempo: 100, // Viertel pro Minute, für «Anhören»
  showNames: true, // Notennamen unter den Noten (vor dem Kapitel «Noten lesen»)
});
```

Notenwerte: `w` ganze, `hd` punktierte halbe, `h` halbe, `qd` punktierte Viertel, `q` Viertel,
`8` Achtel. Jeder Takt muss genau voll sein, sonst wirft `song()` beim Laden einen Fehler (und die
Tests schlagen fehl) – Tippfehler fallen so sofort auf.

**Rhythmus** – ein Takt pro Muster; nur das Timing zählt, Pausen mit `r`:

```ts
rhythm('q q q q | h h | q qr q qr', { tempo: 76 });
```

Werte wie oben plus Pausen `qr`, `hr`, `wr`. Toleranz: Kids ±150 ms, Classic ±100 ms.

## Entdecken (Theorie)

Die Theorie einer Lektion steht in `shared/src/curriculum/theory.ts` unter der Lektions-ID. Schritte:

| Typ        | Zweck                                                                    |
| ---------- | ------------------------------------------------------------------------ |
| `explain`  | Text der Figur, optional mit Bild (`picture`)                            |
| `tap-keys` | Tasten auf der Bildschirm-Klaviatur antippen (`targets` = Gruppen)       |
| `quiz`     | Antworten zur Auswahl, genau eine mit `correct: true`; `hint` bei Fehler |
| `listen`   | Töne anhören, zwischen zwei Antworten wählen (höher/tiefer …)            |
| `clap`     | einen Takt mitklatschen (`pattern` wie bei Rhythmus-Übungen)             |

Bilder: `keyboard` (mit `marks`, `groups`, `fingering`, `direction`), `hand`, `sticker`, `staff`
(mit `names` oder `highlight: 'lines' | 'spaces'`) und `note-values` (mit `pizza`). Quizfragen
erscheinen auch in «Weisst du's noch?» zu Beginn des nächsten Kapitels. `theory.test.ts` prüft
Übersetzungen, Schreibweise und dass jedes Spiel lösbar ist.

## Neues Kapitel

```ts
CURRICULUM.push({
  id: 'left-hand',
  title: { 'de-CH': 'Die linke Hand', en: 'The left hand' },
  lessons: [ … ],
});
```

Für jedes Kapitel entsteht automatisch das Abzeichen `chapter-<id>` («Kapitel n geschafft»). Kapitel
nur am Ende anhängen oder bewusst einfügen – die Nummer im Abzeichentitel folgt der Position.

## Abzeichen

In `badges.ts` ein Eintrag mit ID, Symbol (`star`, `trophy`, `music`, `metronome`, `flame`, `target`,
`book`, `sparkles`), Titel, Hinweis («wie bekomme ich es?») und Bedingung über `BadgeStats`
(beste Sterne je Lektion, Streak, Übungszeit heute, Tagesziel). Der Server vergibt Abzeichen nach
jeder Lektion; einmal vergeben, bleiben sie. Bitte keine Abzeichen mit Zeitdruck, Ablaufdatum oder
Vergleich mit anderen Kindern.

## Prüfen

```bash
npm test -w shared     # Lehrplan-Tests
npm test               # alles
```

Die Lehrplan-Tests in `curriculum.test.ts` prüfen automatisch:

- IDs eindeutig und im richtigen Format,
- Titel und Einleitungen in beiden Sprachen vorhanden, kein «ß»,
- jede verlangte Taste liegt auf der sichtbaren Klaviatur der Lektion,
- jede Lektion hat mindestens eine Zielnote,
- Melodien und Rhythmen haben volle Takte (beim Laden des Lehrplans),
- Abzeichen eindeutig und übersetzt.

Danach die Lektion im Browser durchspielen (`npm run dev`, Bildschirm-Klaviatur oder Klavier). Um
direkt zu einer späteren Lektion zu springen, setzt der E2E-Helfer `seedCompletedLessons` in
`e2e/helpers.ts` frühere Lektionen in der Entwicklungsdatenbank auf «abgeschlossen».

## Neuer Übungstyp

Seltener nötig, betrifft mehrere Stellen:

1. Typ in `types.ts` ergänzen und zur Union `Exercise` hinzufügen.
2. `lessonTargetCount()` in `curriculum.ts` erweitern (Anzahl Zielnoten = Grundlage der Sterne) und
   die Tasten-Prüfung in `curriculum.test.ts` anpassen.
3. Komponente in `client/src/lesson/` mit den `ExerciseProps` (`onCorrect`, `onMistake`, `onDone`)
   schreiben; Töne über `useNoteEvents` empfangen, nie direkt von einer Eingabequelle.
4. In `LessonPage.tsx` einhängen, Texte in beiden Sprachdateien ergänzen.
5. Unit-Test für die Bewertungslogik, E2E-Test mit der Bildschirm-Klaviatur.
