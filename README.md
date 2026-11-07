# Klavio

Progressive Web App, mit der Kinder (ab ca. 6 Jahren) und erwachsene Einsteiger am **echten Klavier**
spielerisch Klavier lernen. Die App hört über das Mikrofon zu (oder liest ein Digitalpiano per MIDI)
und wertet das Gespielte aus. Audio wird ausschliesslich lokal im Browser verarbeitet.

> **Stand:** Schritt 3 des Plans – Projektgerüst, Registrierung per E-Mail-Code, Passkeys,
> Kinderprofile, leeres Dashboard. Tonerkennung, MIDI und Lektionen folgen.

Der Produktname ist ein Platzhalter. Er steht zentral in
[`shared/src/config/app.ts`](shared/src/config/app.ts) und wird von UI, Manifest, WebAuthn und E-Mails verwendet.

## Stack

| Bereich  | Technologie                                                                              |
| -------- | ---------------------------------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite 8, **Mantine 9** (CSS Modules), React Router, i18next         |
| PWA      | vite-plugin-pwa (Workbox), Icons via `@vite-pwa/assets-generator`                        |
| Backend  | Node 24, **Fastify 5**, zod 4 (`fastify-type-provider-zod`), Mongoose 9                  |
| Auth     | Passkeys mit `@simplewebauthn/server` / `browser` 14, httpOnly-Session-Cookies           |
| Betrieb  | Docker Compose: Caddy (TLS, statische Dateien, Reverse Proxy), Server, MongoDB, Mailpit  |
| Tests    | Vitest (Unit/Integration mit `mongodb-memory-server`), Playwright + axe-core (E2E, a11y) |

**Abweichung vom Wunschstack:** Statt PrimeReact wird Mantine verwendet. Grund: PrimeReact 11 und
PrimeIcons 8 stehen nicht mehr unter MIT, sondern unter einer kommerziellen Lizenz mit Lizenzschlüssel.
PrimeReact 10 wird nicht weiterentwickelt. Mantine ist MIT-lizenziert und aktiv gepflegt; das
Theming über CSS-Variablen passt gut zum Kids/Classic-Umschalter.

## Voraussetzungen

- Node.js ≥ 22 (empfohlen 24) und **npm ≥ 11** (npm 10 stürzt beim Auflösen der Vitest-Peer-Dependencies ab;
  bei Node 22: `npx npm@11 install`)
- Docker mit Compose v2

## Schnellstart (Entwicklung)

```bash
cp .env.example .env                       # AUTH_SECRET setzen: openssl rand -base64 48
npm install
docker compose up -d mongo mailpit         # MongoDB (localhost:27017) + Mailpit
npm run dev                                # Server :3100, Client http://localhost:5173
```

`http://localhost` gilt als sicherer Kontext, Passkeys funktionieren dort ohne TLS.
Mails (E-Mail-Codes) landen in Mailpit: <http://localhost:8026>.

### Admin ernennen

Globale Einstellungen (z. B. Registrierung offen/geschlossen) sind nur für Admins sichtbar. Die Konto-ID steht
in der App unter **Konto**.

```bash
npm run admin:grant -- <konto-id|e-mail>            # lokal
npm run admin:grant -- <konto-id|e-mail> --revoke
docker compose exec server node server/dist/scripts/grantAdmin.js <konto-id|e-mail>   # im Container
```

## Kompletter Stack mit Docker (HTTPS)

```bash
docker compose up -d --build               # https://localhost:8443
```

Caddy stellt mit seiner lokalen CA ein Zertifikat aus. **Browser verweigern Passkeys bei
Zertifikatsfehlern**, darum die Caddy-Root-CA einmalig als vertrauenswürdig importieren:

```bash
docker compose cp web:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
```

### Auf dem Tablet testen

Die WebAuthn-RP-ID muss ein Domainname sein (keine IP-Adresse). Für ein Tablet auf dem Notenpult:

1. Einen Hostnamen auf die LAN-IP des Rechners zeigen lassen (z. B. eigene Domain mit DNS-Eintrag
   oder ein Tunnel mit gültigem Zertifikat).
2. In `.env`: `SITE_ADDRESS=klavio.example.ch` und `CADDY_TLS=du@example.ch` (Let's Encrypt) bzw.
   `internal` plus CA auf dem Tablet installieren.

## Tests und Qualität

```bash
npm test             # Unit + Integration (shared, server, client)
npm run e2e          # Playwright gegen den laufenden Dev-Stack (npm run dev, Mailpit)
E2E_BASE_URL=https://localhost:8443 npm run e2e      # gegen den Docker-Stack
npm run check        # Typecheck + ESLint + Prettier + Unit-Tests
```

- **Server-Integrationstests** decken Registrierung per E-Mail-Code, Passkey-Login, Challenge-Replay,
  Origin-Prüfung, Passkey-Verwaltung, E-Mail-Codes (Drosselung, Fehlversuche), Rate-Limits,
  Admin-Schalter, E-Mail-Änderung, Profile und Kontolöschung ab. Nur die WebAuthn-Kryptografie wird
  dort gemockt.
- **E2E-Tests** nutzen den virtuellen WebAuthn-Authenticator von Chromium, also echte Passkey-Kryptografie,
  sowie Mailpit für den E-Mail-Code. Sie laufen nacheinander, weil ein Test die Registrierung kurz
  schliesst. Pro Lauf werden rund zehn Codes angefordert; nach etwa drei Läufen innert zehn Minuten
  greift das Rate-Limit pro IP (Server neu starten setzt es zurück).
- **Barrierefreiheit:** axe-core prüft die Hauptseiten in Kids- und Classic-Darstellung auf WCAG 2.1 AA.

## Projektstruktur

```
shared/   Gemeinsamer Code: App-Konfiguration, zod-Schemas, Musik-Hilfsfunktionen (MIDI ↔ Frequenz)
server/   Fastify-API
  src/routes/     auth, emailAuth, passkeys, account, profiles, admin, publicConfig
  src/lib/        Sessions, Challenges, E-Mail-Codes, Rate-Limits, WebAuthn-Wrapper
  src/models/     Mongoose-Modelle (User, Passkey, Session, Profile, AuthChallenge, EmailCode, AppSettings)
client/   React-PWA
  src/auth/       Session-Kontext, Passkey-Abläufe
  src/pages/      Willkommen, Registrierung/E-Mail-Login, Profilwahl, Dashboard, Konto, Verwaltung
  src/components/ Maskottchen «Klavi», Profilfiguren, Layout, Datenschutzhinweis
  src/i18n/       de-CH (Schweizer Schreibweise, kein ß) und en
e2e/      Playwright-Tests
```

## Authentifizierung

- **Registrierung per E-Mail-Code:** E-Mail-Adresse eingeben, 6-stelligen Code aus der Mail eintippen,
  Namen wählen. Damit ist die Adresse bestätigt; sie dient als Anmeldung, wenn kein Passkey zur Hand ist,
  und als Wiederherstellung. Ein Code statt eines Magic Links, weil ein Link auf iOS in Safari statt in
  der installierten PWA aufgeht.
- **Passkeys** werden nach der Registrierung unter «Konto» eingerichtet (die Profilwahl weist darauf hin,
  solange keiner existiert). Auffindbare Credentials, Login ohne Benutzernamen, mehrere Passkeys pro
  Konto, umbenennen und löschen. Auch der letzte Passkey darf gelöscht werden, der E-Mail-Code bleibt.
- **E-Mail-Codes:** 10 Minuten gültig, max. 5 Fehlversuche, max. 3 aktive Codes pro Adresse, als HMAC
  gespeichert. Die Antwort auf eine Code-Anfrage verrät nicht, ob ein Konto existiert. Die Adresse lässt
  sich unter «Konto» ändern (Bestätigung per Code an die neue Adresse), aber nicht entfernen.
- **Admin-Schalter «Registrierung»** (Standard per `REGISTRATION_OPEN_DEFAULT`): geschlossen können keine
  neuen Konten entstehen; bestehende Konten melden sich weiterhin mit Passkey oder E-Mail-Code an.
- **Sessions:** zufälliges Token im httpOnly-Cookie (`Secure`, `SameSite=Lax`, `Path=/api`), in der DB nur
  als SHA-256. Neuer Token bei jedem Login.

## Sicherheit

- Eingaben werden mit zod validiert, die Body-Grösse ist begrenzt.
- Rate-Limiting: global sowie strenger auf Auth- und E-Mail-Endpunkten. Code-Anfragen und -Prüfungen
  sind pro Adresse und zusätzlich pro IP begrenzt (locker genug für eine Familie oder Schulklasse
  hinter einer IP).
- CSRF-Schutz zusätzlich zu SameSite: Zustandsändernde Requests müssen von `APP_ORIGIN` kommen.
- CSP, HSTS, `Permissions-Policy` (nur Mikrofon/MIDI für die eigene Origin) via Caddy, strikte CSP auf der API.
  `style-src` erlaubt `'unsafe-inline'`, weil Mantine Styles zur Laufzeit einfügt; Skripte bleiben auf `'self'`.
- Keine Secrets im Repo: `.env` ist ignoriert, `AUTH_SECRET` ist Pflicht.
- **Datenschutz:** die E-Mail-Adresse wird nur für Anmeldung und Wiederherstellung verwendet (keine
  Newsletter), keine Geburtsdaten, kein Tracking, keine externen Requests
  (Schriften selbst gehostet). Audio verlässt nie das Gerät; das kommuniziert die App sichtbar.

## Bekannte Plattform-Einschränkungen

- **iOS/iPadOS:** kein Web MIDI (nur Mikrofon); AudioContext startet erst nach einer Nutzergeste;
  im Standalone-Modus fragt iOS die Mikrofonfreigabe teils bei jedem Start erneut; Website-Daten können
  nach längerer Inaktivität gelöscht werden (der Server bleibt die Quelle der Wahrheit); Installation nur
  über «Teilen → Zum Home-Bildschirm».
- **Firefox:** kein Web MIDI ohne Add-on.
- **Lighthouse:** Die PWA-Kategorie wurde in Lighthouse 12 entfernt. Die Installierbarkeit (Manifest,
  Icons, Service Worker, Offline-Start) wird stattdessen direkt geprüft.

## Lizenz

GPL-3.0, siehe [LICENSE](LICENSE).
