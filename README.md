# Klavio

Progressive Web App, mit der Kinder (ab ca. 6 Jahren) und erwachsene Einsteiger am **echten Klavier**
spielerisch Klavier lernen. Die App hört über das Mikrofon zu oder liest ein Digitalpiano per MIDI und
wertet das Gespielte aus. **Audio wird ausschliesslich lokal im Browser verarbeitet.**

Der Produktname ist ein Platzhalter. Er steht zentral in
[`shared/src/config/app.ts`](shared/src/config/app.ts) (UI, Manifest, WebAuthn, E-Mails).

## Was die App kann

- **Lernpfad** in Stufen mit je eigener Karte: Stufe 1 (Tastatur entdecken, rechte Hand, Noten
  lesen, erste Lieder, Rhythmus) und Stufe 2 (linke Hand und Bassschlüssel, beide Hände im grossen
  Notensystem, schwarze Tasten mit Improvisieren) – 8 Welten, 30 Lektionen.
- **Mein Traumlied:** Erwachsene (und Kinder) nennen das Lied, das sie eines Tages spielen möchten;
  Klavio zeigt, welche Fähigkeiten es braucht, wie weit der Weg schon ist, und feiert Meilensteine.
- **Entdecken** vor jeder Lektion: kurze Erklärungen mit Bildern, Tipp-Spiele, Bilder-Quiz,
  Hör- und Klatschspiele; «Weisst du's noch?» zu Beginn jedes Kapitels; die Seite **Wissen** zum
  Nachschauen.
- **Startseite** für Besucher: was Klavio kann, alle Welten, Klaviatur zum Ausprobieren,
  Datenschutz und Fragen – mit ein paar versteckten Überraschungen.
- **Wiederholen** wie mit Lernkarten: gespielte Lektionen kommen nach 1, 3, 7, 14 und 30 Tagen
  wieder («Heute wiederholen», Markierung im Lernpfad, Bonus-XP); dazu die «Schnelle Runde» mit
  gemischten Fragen aus allen gespielten Lektionen. Fleissiges Wiederholen bringt eigene Medaillen
  (1, 10, 25 und 50 Wiederholungen; «Für immer gemerkt», wenn eine Lektion beim Monats-Takt ist).
- **Klavi liest vor:** Aufgaben und Erklärungen auf Knopfdruck oder automatisch (für Kids-Profile
  voreingestellt) – mit Stimmen, die auf dem Gerät installiert sind; das Mikrofon pausiert dabei.
- **Übungen:** Finde die Taste, Spiel nach, Notenlesen, Lied spielen mit «Warte auf mich»,
  Rhythmus mit Metronom.
- **Eingaben:** Tonerkennung über das Mikrofon (98,6 % der Töne C2–C6 korrekt und innert 100 ms
  erkannt), Digitalpiano per MIDI (hat Vorrang), Bildschirm-Klaviatur als Ausweichmöglichkeit.
- **Motivation ohne Druck:** Sterne, XP, Level, Tage in Folge, Tagesziel, Abzeichen, Maskottchen
  «Klavi». Nichts läuft ab, XP gehen nie verloren.
- **Familien:** ein Konto, mehrere Profile mit eigenem Fortschritt und eigener Mikrofon-Einrichtung;
  Darstellung «Kids» oder «Classic»; sieben Figuren (Klavi, Flo, Olli, Mimi, Brummi, Quaki, Walli) als
  lebendige Begleiter, unter «Mein Profil» jederzeit wechselbar; optionale Eltern-PIN schützt Konto und
  Profilverwaltung.
- **Anmeldung:** Registrierung per E-Mail-Code, danach Passkeys (Fingerabdruck, Gesicht, Geräte-PIN).
- **Offline:** installierbar, Lektionen funktionieren ohne Internet, Ergebnisse werden nachgereicht.
- **Was ist neu:** `/whats-new` zeigt die Versionen mit ihren Änderungen (auch im Menü).
- **Sprachen:** Deutsch (Schweiz) und Englisch. Helles und dunkles Farbschema (automatisch nach Gerät
  oder wählbar). Barrierefreiheit nach WCAG 2.1 AA geprüft, in beiden Farbschemata.

## Dokumentation

| Dokument                               | Für wen / worum es geht                                                  |
| -------------------------------------- | ------------------------------------------------------------------------ |
| [Architektur](docs/architektur.md)     | Aufbau, Datenmodell, API, Anmeldung, Eingaben, Lektionen, Offline        |
| [Lektionen schreiben](docs/inhalte.md) | Neue Lektionen, Lieder, Rhythmen, Kapitel und Abzeichen anlegen          |
| [Tonerkennung](docs/tonerkennung.md)   | Verfahren, Parameter, Einrichtung, gemessene Genauigkeit, Tests          |
| [Betrieb](docs/betrieb.md)             | Eigene Instanz mit Domain, Konfiguration, Sicherung, Updates, Sicherheit |
| [Datenschutz](docs/datenschutz.md)     | Welche Daten wo liegen, was nicht gespeichert wird, Löschung             |

## Versionen und Images

Versionen heissen `{Jahr}.{Monat}.{Folge}` (z. B. `2026.11.0`) und stehen in der `package.json` im
Hauptverzeichnis (`node scripts/version.mjs next` setzt die nächste). GitHub Actions:

- **checks** – Typen, Lint, Formatierung, Unit-Tests, Builds und die Browser-Tests (Playwright gegen
  Server, MongoDB und Mailpit); für Pull Requests nach `develop` und von den anderen Workflows.
- **develop** – jeder Push auf `develop`: Checks, dann das Image `kosterra/klavio:develop`.
- **release** – jeder Merge nach `main`: Git-Tag der Version, Image `kosterra/klavio:<version>` und
  `:latest`, signiert (cosign) mit Provenienz und SBOM.

Die Secrets `DOCKERHUB_USER` und `DOCKERHUB_PASSWORD` (Access Token) stehen in den
Repository-Einstellungen. Ablauf und Regeln: `.claude/skills/versioning`, «Was ist neu»:
`.claude/skills/whats-new`.

## Stack

| Bereich  | Technologie                                                                             |
| -------- | --------------------------------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite 8, Mantine 9 (CSS Modules), React Router, i18next, VexFlow 5 |
| Audio    | Web Audio API mit AudioWorklet (eigene Tonerkennung), Web MIDI                          |
| PWA      | vite-plugin-pwa (Workbox)                                                               |
| Backend  | Node 24, Fastify 5, zod 4, Mongoose 9 / MongoDB 9                                       |
| Auth     | Passkeys mit `@simplewebauthn` 14, E-Mail-Codes, httpOnly-Session-Cookies               |
| Betrieb  | Ein Image `kosterra/klavio` (App + API), davor Caddy für TLS; MongoDB; GitHub Actions   |
| Tests    | Vitest, `mongodb-memory-server`, Playwright, axe-core                                   |

Statt PrimeReact wird Mantine verwendet: PrimeReact 11 und PrimeIcons 8 stehen unter einer
kommerziellen Lizenz mit Lizenzschlüssel, PrimeReact 10 wird nicht weiterentwickelt. Mantine ist
MIT-lizenziert, aktiv gepflegt und passt mit seinem Theming gut zum Kids/Classic-Umschalter.

## Entwicklung

Voraussetzungen: Node.js ≥ 22 (empfohlen 24) mit **npm ≥ 11** (npm 10 stürzt beim Auflösen der
Abhängigkeiten ab; bei Node 22: `npx npm@11 install`) und Docker mit Compose v2.

```bash
cp .env.example .env                # AUTH_SECRET setzen: openssl rand -base64 48
npm install
docker compose up -d mongo mailpit  # MongoDB (localhost:27017) und Mailpit
npm run dev                         # API :3100, App http://localhost:5173
```

- `http://localhost` gilt als sicherer Kontext: Passkeys, Mikrofon und MIDI funktionieren ohne TLS.
- **E-Mails** (Codes für Registrierung und Anmeldung) landen in Mailpit: <http://localhost:8026>.
- **Admin ernennen** (Konto-ID oder E-Mail-Adresse, steht in der App unter «Konto»):
  `npm run admin:grant -- <konto-id|e-mail>` (mit `--revoke` wieder entziehen).

### Kompletter Stack mit HTTPS

```bash
docker compose up -d --build mongo mailpit app caddy   # https://localhost:8443
docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
```

Caddy stellt mit seiner lokalen CA ein Zertifikat aus. Browser verweigern Passkeys und Service Worker
bei Zertifikatsfehlern – darum `caddy-root.crt` einmalig als vertrauenswürdig importieren.

**Auf dem Tablet testen:** Passkeys brauchen einen Domainnamen (keine IP-Adresse). Einen Hostnamen auf
den Rechner zeigen lassen und in `.env` `SITE_ADDRESS` sowie `CADDY_TLS` setzen (Let's Encrypt mit
E-Mail-Adresse oder `internal` plus Root-CA auf dem Tablet). Für einen echten Betrieb:
[docs/betrieb.md](docs/betrieb.md).

## Tests und Qualität

```bash
npm test                 # Unit- und Integrationstests (shared, server, client)
npm run check            # Typecheck, ESLint, Prettier, Tests
npm run e2e              # Playwright gegen den laufenden Dev-Stack (npm run dev, Mailpit)
E2E_BASE_URL=https://localhost:8443 npm run e2e    # gegen den Docker-Stack
npm run samples:fetch    # echte Klavieraufnahmen für den Genauigkeitstest (einmalig, ~220 MB)
```

- **Server-Integrationstests** mit echter MongoDB im Speicher: Registrierung, Passkeys (nur die
  Kryptografie gemockt), Sessions, Origin-Prüfung, E-Mail-Codes und Rate-Limits, Profile, Fortschritt,
  Sterne/XP/Streak, Abzeichen, verspätet übertragene Ergebnisse, Konto- und Profillöschung.
- **Client-Tests:** Tonerkennung (synthetische Töne und, falls geladen, 147 echte Aufnahmen),
  Kalibrierung, Eingabe-Priorität, MIDI-Nachrichten, Rhythmus-Bewertung, Audio-Uhr, Offline-Warteschlange,
  Übersetzungen (vollständig, kein ß). **Shared-Tests:** Lehrplan, Liednotation, Belohnungen, Abzeichen.
- **E2E (Playwright):** Registrierung und Passkey-Login (virtueller WebAuthn-Authenticator von Chromium,
  echte Kryptografie), E-Mail-Codes über Mailpit, Mikrofon-Einrichtung mit virtuellem Mikrofon,
  simuliertes MIDI-Gerät, Lernpfad und alle Übungstypen, offline spielen und synchronisieren,
  Barrierefreiheit mit axe-core (WCAG 2.1 AA, Kids und Classic).

Die E2E-Tests laufen nacheinander (ein Test schliesst kurz die Registrierung) und setzen für spätere
Kapitel den Fortschritt direkt in der Dev-Datenbank. Gegen den Docker-Stack laufen sie stabiler als
gegen den Vite-Dev-Server, der Module erst bei Bedarf übersetzt; dort startet Chromium zudem mit
`--ignore-certificate-errors`, damit der Service Worker trotz lokaler CA registriert wird.

## Projektstruktur

```
shared/   Gemeinsam für Client und Server: App-Konfiguration, API-Schemas (zod),
          Musik-Hilfsfunktionen, NoteEvent, Lehrplan, Belohnungsregeln, Abzeichen
server/   Fastify-API
  src/routes/     auth, emailAuth, passkeys, account, profiles, progress, admin, publicConfig
  src/lib/        Sessions, Challenges, E-Mail-Codes, Rate-Limits, Mailer, WebAuthn
  src/models/     Mongoose-Modelle
  src/scripts/    grantAdmin
client/   React-PWA
  src/audio/      Mikrofon, AudioWorklet und Tonerkennung (pitch/), Kalibrierung, Klang, Metronom
  src/input/      Note-Bus und Input-Hub (Priorität), Web MIDI, Computertastatur
  src/lesson/     Lernpfad, Übungstypen, Fortschritt, Abzeichen
  src/notation/   Notenlinien mit VexFlow
  src/offline/    Gerätespeicher, Warteschlange, Synchronisation
  src/auth/       Session, Passkey-Abläufe
  src/pages/      Seiten (Willkommen, Registrierung, Profilwahl, Dashboard, Lektion, Eingabe,
                  Mikrofon-Test und -Einrichtung, Konto, Verwaltung)
  src/components/ Maskottchen «Klavi», Klaviatur, Layout, Datenschutzhinweis, Installationshinweis
  src/i18n/       de-CH (Schweizer Schreibweise) und en
e2e/      Playwright-Tests und Testhilfen (virtuelles Mikrofon, simuliertes MIDI)
scripts/  Klavieraufnahmen für den Genauigkeitstest laden
docs/     Dokumentation
```

## Lizenz

[GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only). Wer eine veränderte Version als
Online-Dienst anbietet, muss deren Quellcode den Nutzern zugänglich machen – dafür in
[`shared/src/config/app.ts`](shared/src/config/app.ts) `sourceUrl` auf das eigene Repository setzen;
die App verlinkt ihn auf der Startseite und unter «Konto». Alle verwendeten Bibliotheken stehen unter
mit der AGPL vereinbaren Lizenzen (MIT, ISC, BSD, Apache-2.0, 0BSD; die Schrift Nunito unter der SIL
Open Font License).

Musik: Die Lieder und Stücke des Lernpfads sind gemeinfrei (Volkslieder und Komponisten, die vor
mehr als 70 Jahren gestorben sind). Die «Klassik zum Üben» ist aus den Ausgaben des
[Mutopia Project](https://www.mutopiaproject.org) übernommen und vereinfacht;
[`shared/src/curriculum/classics.data.ts`](shared/src/curriculum/classics.data.ts) steht deshalb –
abweichend vom Code – unter der Creative-Commons-Lizenz des jeweiligen Stücks (CC BY-SA 2.5 / 3.0),
mit Quelle und Notensetzer bei jedem Stück. Neu erzeugen: `npx tsx scripts/import-mutopia.ts`.
Die «Schweizer Volkslieder»
([`shared/src/curriculum/folkSongs.ts`](shared/src/curriculum/folkSongs.ts)) sind von Hand aus der
gemeinfreien «Sammlung von Schweizer-Kühreihen und Volksliedern» (Bern 1826,
[e-rara](https://doi.org/10.3931/e-rara-150173)) abgeschrieben – Nummer und Seite stehen bei jedem Lied.
