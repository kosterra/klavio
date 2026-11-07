# Architektur

Überblick für Entwicklerinnen und Entwickler: Aufbau, Datenmodell und die wichtigsten Abläufe.
Details zur Tonerkennung stehen in [tonerkennung.md](tonerkennung.md), zum Lehrplan in
[inhalte.md](inhalte.md).

## Bausteine

```mermaid
flowchart LR
  subgraph browser [Browser / installierte PWA]
    ui[React-App<br/>Mantine, i18next]
    sw[Service Worker<br/>Workbox]
    worklet[AudioWorklet<br/>Tonerkennung]
    ls[(localStorage<br/>letzter Stand, Warteschlange)]
  end
  subgraph server [Server, Docker Compose]
    caddy[Caddy<br/>TLS, statische Dateien, Header]
    api[Fastify-API<br/>Node 24]
    db[(MongoDB)]
  end
  smtp[SMTP-Server]
  ui <--> sw
  ui --- worklet
  ui --- ls
  sw -- "/ und /assets" --> caddy
  ui -- "/api (Cookie)" --> caddy --> api --> db
  api -- E-Mail-Codes --> smtp
```

Ein npm-Workspace-Monorepo mit drei Paketen:

| Paket     | Inhalt                                                                                                                                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/` | Von Client und Server genutzt: App-Konfiguration, zod-Schemas der API, Musik-Hilfsfunktionen, `NoteEvent`, **Lehrplan**, Regeln für Sterne/XP/Streak, Abzeichen. TypeScript-Quellen werden direkt importiert (kein eigener Build). |
| `server/` | Fastify-API: Routen, Mongoose-Modelle, Sessions, E-Mail-Codes, WebAuthn. Build mit tsup.                                                                                                                                           |
| `client/` | React-PWA mit Vite: Seiten, Eingaben (Mikrofon, MIDI, Bildschirm), Lektionen, Notation (VexFlow), Offline-Speicher.                                                                                                                |

Weil der Lehrplan und die Belohnungsregeln in `shared/` liegen, rechnet der Server Sterne, XP,
Freischaltung und Abzeichen selbst nach – der Client schickt nur Fehlerzahl, Dauer und Datum.
Offline nutzt der Client dieselben Funktionen, damit die Anzeige mit dem späteren Serverergebnis
übereinstimmt.

## Datenmodell

```mermaid
erDiagram
  User ||--o{ Passkey : "meldet sich an mit"
  User ||--o{ Session : hat
  User ||--o{ Profile : "besitzt (max. 8)"
  Profile ||--o{ LessonProgress : "Bestes je Lektion"
  Profile ||--o{ DailyActivity : "Übungszeit je Tag"
  Session }o--o| Profile : "aktives Profil"

  User {
    string displayName
    string email "bestätigt, eindeutig"
    string webauthnUserId "zufällig, nicht die DB-ID"
    string role "user | admin"
  }
  Passkey {
    string credentialId
    binary publicKey
    number counter
    string name "z. B. iCloud-Schlüsselbund"
    date lastUsedAt
  }
  Session {
    string tokenHash "SHA-256 des Cookies"
    date expiresAt "TTL-Index"
  }
  Profile {
    string name
    string avatar
    string uiMode "kids | classic"
    number dailyGoalMinutes
    object calibration "a4Hz, noiseFloorDb"
    number xp
    number level
    object streak "current, longest, lastActiveDate"
    array badges "id, earnedAt"
  }
  LessonProgress {
    string lessonId
    number bestStars
    number completions
  }
  DailyActivity {
    string date "lokales Datum des Kindes"
    number seconds
    number xp
  }
```

Kurzlebig, mit TTL-Index: `AuthChallenge` (WebAuthn-Challenge, 5 Min., per Cookie referenziert),
`EmailCode` (HMAC des Codes, 10 Min.). Einzeldokument `AppSettings` (`registrationOpen`).
Was davon personenbezogen ist und wie lange es bleibt: [datenschutz.md](datenschutz.md).

## API

Alle Routen unter `/api`, JSON, Validierung mit zod (Schemas in `shared/src/schemas/`).

| Bereich       | Routen                                                                                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| öffentlich    | `GET /config`, `GET /health`                                                                                                                                                       |
| `/auth/email` | `POST /request` (Code senden), `POST /verify` (anmelden oder Konto anlegen)                                                                                                        |
| `/auth`       | `POST /login/options`, `POST /login/verify` (Passkey), `POST /logout`, `GET /me`                                                                                                   |
| `/passkeys`   | `GET /`, `POST /options`, `POST /verify` (hinzufügen), `PATCH /:id`, `DELETE /:id`                                                                                                 |
| `/account`    | `PATCH /` (Name), `POST /email/request`, `POST /email/verify` (Adresse ändern), `DELETE /` (Konto löschen), `PUT`/`DELETE /pin`, `POST /pin/verify`, `POST /pin/lock` (Eltern-PIN) |
| `/profiles`   | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /select`                                                                                                                     |
| `/progress`   | `GET /?date=` (Fortschritt des aktiven Profils), `POST /lessons/:lessonId` (Lektion beendet)                                                                                       |
| `/admin`      | `GET /settings`, `PUT /settings` (nur Rolle `admin`)                                                                                                                               |

Querschnitt (`server/src/app.ts`): Helmet mit strikter CSP für JSON, Cookies, Rate-Limits (global
300/min, strenger für Anmeldung und E-Mail-Codes), Origin-Prüfung für alle zustandsändernden Anfragen
(CSRF-Schutz zusätzlich zu `SameSite=Lax`), einheitliche Fehlerantworten `{ "error": "CODE" }`.
Im Log stehen Methode und Pfad, aber keine IP-Adressen.

## Anmeldung

**Registrierung und E-Mail-Login** sind derselbe Ablauf; der Server entscheidet, ob die Adresse schon
ein Konto hat:

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as API
  participant M as SMTP
  B->>A: POST /auth/email/request {email}
  A->>M: 6-stelliger Code (nur HMAC gespeichert)
  A-->>B: 204 – immer, verrät nicht, ob es das Konto gibt
  B->>A: POST /auth/email/verify {email, code}
  alt Konto existiert
    A-->>B: ok + Session-Cookie
  else neues Konto (Registrierung offen)
    A-->>B: needs-display-name
    B->>A: POST /auth/email/verify {email, code, displayName}
    A-->>B: created + Session-Cookie
  end
```

**Passkeys** werden danach unter «Konto» hinzugefügt (`/passkeys/options` → `navigator.credentials.create`
→ `/passkeys/verify`). Login mit Passkey ohne Benutzernamen (auffindbare Credentials):
`/auth/login/options` → `navigator.credentials.get` → `/auth/login/verify`. Die Challenge liegt
serverseitig und wird über ein kurzlebiges httpOnly-Cookie (`klavio_ch`) gefunden; sie gilt einmal.

**Session:** zufälliges Token im Cookie `klavio_sid` (httpOnly, `Secure`, `SameSite=Lax`,
`Path=/api`, 60 Tage), in der Datenbank nur als SHA-256. Jede Anmeldung erzeugt ein neues Token. Die
Session merkt sich das aktive Profil.

**Elternbereich:** Ist eine Eltern-PIN gesetzt, verlangen Konto, Passkeys, Verwaltung sowie Anlegen,
Ändern und Löschen von Profilen einen offenen Elternbereich (`requireParent`, Fehler
`PARENT_LOCKED`). Er öffnet sich durch die PIN oder eine frische Anmeldung (das ist der Erwachsene) für
15 Minuten und schliesst sich, sobald ein Profil gewählt wird – der Moment, in dem das Gerät an ein
Kind geht. Lernen, Profil wählen und die Mikrofon-Kalibrierung bleiben ohne PIN möglich.

## Eingaben

```mermaid
flowchart LR
  mic[Mikrofon<br/>usePitchDetection] --> pub
  midi[Web MIDI<br/>midi.ts] --> pub
  kb[Bildschirm-Klaviatur<br/>und Computertastatur] --> pub
  pub["publishNote()"] --> raw[rawNoteBus<br/>alle Töne]
  pub --> hub{Input-Hub}
  hub -- angenommen --> bus[noteBus<br/>Übungen]
  hub -- verworfen --> dropped[droppedNoteBus<br/>Seite «Eingabe»]
```

Alle Quellen liefern dieselbe Struktur `NoteEvent` (`shared/src/music/noteEvent.ts`): Typ, MIDI-Nummer,
Anschlagstärke, Zeit (`performance.now()`), Quelle, beim Mikrofon die Abweichung in Cent. Der
Input-Hub setzt die Priorität um: MIDI vor Mikrofon, Echo-Schutz nach Bildschirm-Tasten,
Stummschaltung des Mikrofons während die App selbst Musik abspielt. Übungen kennen die Quelle nicht.

## Lektionen

```mermaid
sequenceDiagram
  participant K as Kind
  participant L as LessonPage
  participant A as API
  L->>L: Lehrplan aus shared, Freischaltung aus Fortschritt
  K->>L: «Los geht's» (startet ggf. das Mikrofon)
  loop Übungen
    K->>L: Töne (noteBus)
    L->>L: richtig / falsch, Hilfen, Fortschrittsbalken
  end
  L->>A: POST /progress/lessons/:id {mistakes, durationSec, localDate}
  A->>A: prüft Freischaltung, rechnet Sterne, XP, Level, Streak, Abzeichen
  A-->>L: Ergebnis
  L->>K: Zusammenfassung
```

Übungstypen (`client/src/lesson/`): `FindKeyExercise`, `PlayAlongExercise`, `ReadNoteExercise`,
`SongExercise`, `RhythmExercise`. Rundenbasierte Übungen teilen sich `useRoundTask`. Notation zeichnet
`notation/Staff.tsx` mit VexFlow; die Bibliothek wird erst geladen, wenn Noten gebraucht werden.

## Offline

```mermaid
flowchart TB
  start[App-Start] --> fetch{Server erreichbar?}
  fetch -- ja --> live[Daten vom Server<br/>und im Gerät speichern]
  fetch -- nein --> cache[letzter Stand aus dem Gerät<br/>Kopf zeigt «Offline»]
  cache --> lesson[Lektion spielen]
  lesson --> queue[Ergebnis in Warteschlange<br/>Sterne/XP lokal berechnet]
  queue --> online{wieder online?}
  online -- ja --> sync[der Reihe nach senden<br/>Profil kurz umschalten falls nötig]
  sync --> live
```

- Der **Service Worker** (Workbox) speichert die gebaute App inklusive Notenschrift und Worklet vorab.
  `clientsClaim` sorgt dafür, dass er schon beim ersten Besuch übernimmt. Neue Versionen warten, bis
  der Nutzer im Banner «Neu laden» wählt. API-Anfragen beantwortet er nie aus dem Cache.
- **`offline/storage.ts`:** fehlertoleranter Zugriff auf `localStorage` (letzter Stand von Konto und
  Profilen, Fortschritt je Profil, Warteschlange). Beim Abmelden werden Stand und Fortschritt gelöscht.
- **`offline/queue.ts`, `offline/sync.ts`:** Warteschlange und Übertragung. Der Server nimmt Ergebnisse
  bis 14 Tage zurück an; ein später übertragener Tag ändert den Streak nicht mehr.

## Darstellung

- Mantine 9 mit CSS Modules; zwei Themes pro Profil: **Kids** (grosse Schrift, runde Formen,
  Maskottchen gross) und **Classic** (ruhiger, kompakter). Gleiche Inhalte.
- **Farbschema** hell, dunkel oder automatisch (pro Gerät gespeichert, Menü). Eigene Farben stehen als
  Variablen mit hellem und dunklem Wert in `client/src/theme/global.css` (`--klavio-…`); neue
  Komponenten bitte darüber statt mit festen Farben. VexFlow zeichnet die Noten in der passenden Tinte.
- **Figuren** (`components/Figure.tsx`): alle Profilfiguren mit Stimmungen (happy, cheer, think, listen)
  und Bewegung; `Buddy` zeigt die Figur des aktiven Profils als Begleiter, `ProfileAvatar` dieselbe
  Figur im runden Rahmen.
- Sprachen: de-CH (Schweizer Schreibweise, kein ß – ein Test prüft das) und en. Lehrplantexte stehen
  im Lehrplan selbst, UI-Texte in `client/src/i18n/`.
- Barrierefreiheit: axe-core prüft die Hauptseiten in beiden Themes auf WCAG 2.1 AA (E2E). Klaviatur,
  Notenlinien und Lernpfad haben Textalternativen; Animationen respektieren `prefers-reduced-motion`.
