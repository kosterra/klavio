# Betrieb

Klavio auf einem eigenen Server mit eigener Domain betreiben. Für die lokale Entwicklung siehe
[README](../README.md).

## Voraussetzungen

- Ein Linux-Server mit Docker und Compose v2. Die Last ist gering: Tonerkennung und Notation laufen im
  Browser, der Server speichert nur Konten und Fortschritt.
- Eine **Domain** (z. B. `klavio.example.ch`), deren DNS-Eintrag (A/AAAA) auf den Server zeigt.
  Passkeys brauchen einen Domainnamen; eine IP-Adresse reicht nicht.
- Port **443** von aussen erreichbar (Caddy holt das Zertifikat bei Let's Encrypt über diesen Port).
  Port 80 ist optional, nur für die Umleitung von `http://` auf `https://`.
- Ein **SMTP-Konto** für die E-Mail-Codes (Anmeldung und Registrierung laufen darüber).

## Das Image

Klavio kommt als **ein Docker-Image** für App und API: `kosterra/klavio` auf Docker Hub. Der Server
beantwortet `/api` und liefert die gebaute App selbst aus (mit eigenen Sicherheits-Headern: CSP,
HSTS, Permissions-Policy). Davor gehört nur ein Reverse Proxy für TLS – in `docker-compose.yml` ist
das Caddy.

| Tag         | Inhalt                                                                          |
| ----------- | ------------------------------------------------------------------------------- |
| `latest`    | die neueste Version (jeder Merge nach `main`)                                   |
| `2026.11.0` | eine bestimmte Version (`{Jahr}.{Monat}.{Folge}`, siehe «Was ist neu»)          |
| `develop`   | der neueste Entwicklungsstand, für Testserver; «Was ist neu» zeigt «Kommt bald» |

Die Versionen sind mit Sigstore signiert (keyless, an den Release-Workflow gebunden) und tragen
Provenienz und SBOM:

```bash
cosign verify kosterra/klavio:2026.11.0 \
  --certificate-identity-regexp 'https://github.com/kosterra/klavio/.github/workflows/release.yml@.*' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
docker buildx imagetools inspect kosterra/klavio:2026.11.0 --format '{{ json .SBOM }}'
```

## Einrichten

Es braucht nur `docker-compose.yml`, `Caddyfile` und `.env` (aus diesem Repository):

```bash
git clone <repo> klavio && cd klavio
cp .env.example .env
openssl rand -base64 48        # → AUTH_SECRET
```

In `.env` für den Betrieb anpassen bzw. ergänzen:

```ini
AUTH_SECRET=<zufällig, mindestens 32 Zeichen>

# Domain und Zertifikat
SITE_ADDRESS=klavio.example.ch
CADDY_TLS=admin@example.ch        # E-Mail für Let's Encrypt (statt "internal")
HTTPS_PORT=443

# Mailversand (ohne diese Zeilen landen die Mails in Mailpit)
SMTP_HOST_DOCKER=smtp.example.ch
SMTP_PORT_DOCKER=587
SMTP_USER=klavio@example.ch
SMTP_PASS=<Passwort>
SMTP_REQUIRE_TLS=true
MAIL_FROM=Klavio <klavio@example.ch>

# Dürfen sich neue Konten registrieren? (später in der App umschaltbar)
REGISTRATION_OPEN_DEFAULT=true
```

Die Zeilen für die lokale Entwicklung (`APP_ORIGIN`, `RP_ID`, `COOKIE_SECURE`, `MONGO_URL`,
`SMTP_HOST`, `SMTP_PORT`) dürfen stehen bleiben: Docker Compose überschreibt sie mit den Werten für
den Container-Betrieb.

Starten – **ohne Mailpit**, das nur zum Testen gedacht ist:

```bash
docker compose pull app
docker compose up -d mongo app caddy
docker compose ps
curl https://klavio.example.ch/api/health      # {"ok":true}
```

Caddy holt beim ersten Aufruf das Zertifikat. Für die Umleitung von Port 80 eine
`docker-compose.override.yml` anlegen (wird von Compose automatisch mitgelesen):

```yaml
services:
  caddy:
    ports:
      - '80:80'
```

### Ersten Admin ernennen

In der App ein Konto registrieren, dann:

```bash
docker compose exec app node server/dist/scripts/grantAdmin.js admin@example.ch
docker compose exec app node server/dist/scripts/grantAdmin.js admin@example.ch --revoke
```

Statt der E-Mail-Adresse geht auch die Konto-ID (steht in der App unter «Konto»). Admins sehen im
Menü «Verwaltung» und können dort die **Registrierung schliessen**: Dann entstehen keine neuen Konten
mehr, bestehende melden sich weiter mit Passkey oder E-Mail-Code an – sinnvoll für eine Instanz nur
für die eigene Familie oder Schule.

Ebenfalls unter «Verwaltung»:

- **Welten:** ab welchem Alter (aus dem Geburtsjahr des Profils) neben den bunten Welten auch «Die
  Reise» wählbar ist (Standard 12). Jüngere Profile sehen immer die bunten Welten.
- **Betreiber und Kontakt:** Name und Kontakt-E-Mail stehen in der Fusszeile und auf der Seite
  «Datenschutz» (`/privacy`) als verantwortliche Stelle – bitte ausfüllen, eine Datenschutzerklärung
  muss sie nennen.
- **E-Mail-Vorlagen:** Betreff, Überschrift und die Texte vor und nach dem Code der beiden Code-Mails
  (Anmeldung, neue Adresse bestätigen), auf Deutsch und Englisch, mit Platzhaltern `{{code}}`,
  `{{app}}`, `{{minutes}}`. Gestaltung und Code-Feld bleiben fest; jede Mail geht in der Sprache, in
  der die Person Klavio gerade nutzt. Die Vorschau zeigt die Mail genau so, wie sie verschickt wird;
  «Test-E-Mail an mich» schickt sie mit dem Beispielcode 123456 an die eigene Adresse.

### Hinter einer Zugangssperre (z. B. Cloudflare Access)

Klavio funktioniert auch hinter einer vorgeschalteten Anmeldung wie Cloudflare Access (Zugang nur für
bestimmte E-Mail-Adressen). Das Web-App-Manifest wird mit Cookies geladen, damit sich die App trotzdem
installieren lässt. Die Sitzungsdauer der Sperre grosszügig wählen (z. B. einen Monat): Läuft sie ab,
erreicht die installierte App den Server erst wieder, wenn man sie öffnet und sich neu anmeldet.

### Hinter einem anderen Reverse Proxy

Läuft Klavio hinter einem weiteren Proxy (z. B. Traefik, nginx), muss der Server wissen, unter welcher
Adresse der Browser die App sieht – davon hängen die Origin-Prüfung und Passkeys ab:

```ini
PUBLIC_ORIGIN=https://klavio.example.ch
SITE_ADDRESS=klavio.example.ch    # wird auch als WebAuthn-RP-ID verwendet
```

## Konfiguration

Server (`server/src/config.ts`, wird beim Start geprüft – bei Fehlern startet der Server nicht und
nennt die Variable):

| Variable                    | Standard                           | Bedeutung                                                                                  |
| --------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `AUTH_SECRET`               | – (Pflicht, ≥ 32 Zeichen)          | Geheimnis für die HMAC der E-Mail-Codes. Ändern macht offene Codes ungültig, sonst nichts. |
| `APP_ORIGIN`                | `http://localhost:5173`            | Adresse der App aus Sicht des Browsers (Origin-Prüfung, WebAuthn). In Docker gesetzt.      |
| `RP_ID`                     | `localhost`                        | WebAuthn-Domain, ohne Schema und Port. In Docker = `SITE_ADDRESS`.                         |
| `COOKIE_SECURE`             | `true`                             | Session-Cookie nur über HTTPS. Nur für `http://localhost` auf `false`.                     |
| `SESSION_TTL_DAYS`          | `60`                               | Wie lange eine Anmeldung gilt.                                                             |
| `REGISTRATION_OPEN_DEFAULT` | `true`                             | Anfangswert des Schalters «Registrierung»; danach gilt der Wert aus der App.               |
| `MONGO_URL`                 | `mongodb://localhost:27017/klavio` | In Docker gesetzt.                                                                         |
| `SMTP_HOST`                 | –                                  | Ohne SMTP-Server werden Mails nur ins Log geschrieben (nur für Entwicklung).               |
| `SMTP_PORT`                 | `587`                              |                                                                                            |
| `SMTP_SECURE`               | `false`                            | `true` für Port 465 (TLS von Anfang an).                                                   |
| `SMTP_REQUIRE_TLS`          | `true`                             | STARTTLS erzwingen. Nur für Mailpit auf `false`.                                           |
| `SMTP_USER`, `SMTP_PASS`    | –                                  |                                                                                            |
| `MAIL_FROM`                 | `Klavio <no-reply@localhost>`      | Absender der E-Mail-Codes.                                                                 |
| `TRUST_PROXY`               | `false`                            | Hinter Caddy `true` (in Docker gesetzt), damit Rate-Limits die echte Client-IP sehen.      |
| `LOG_LEVEL`                 | `info`                             | `fatal` … `trace`, `silent`.                                                               |
| `PORT`, `HOST`              | `3100`, `0.0.0.0`                  |                                                                                            |

Docker Compose (`docker-compose.yml`):

| Variable                               | Standard                          | Bedeutung                                                      |
| -------------------------------------- | --------------------------------- | -------------------------------------------------------------- |
| `SITE_ADDRESS`                         | `localhost`                       | Domain, für die Caddy das Zertifikat holt; zugleich `RP_ID`.   |
| `CADDY_TLS`                            | `internal`                        | `internal` = lokale CA (Test), E-Mail-Adresse = Let's Encrypt. |
| `HTTPS_PORT`                           | `8443`                            | Öffentlicher HTTPS-Port; im Betrieb `443`.                     |
| `PUBLIC_ORIGIN`                        | `https://SITE_ADDRESS:HTTPS_PORT` | Nur nötig hinter einem weiteren Proxy.                         |
| `SMTP_HOST_DOCKER`, `SMTP_PORT_DOCKER` | `mailpit`, `1025`                 | Echter SMTP-Server im Betrieb.                                 |

### Link-Vorschau

Wird ein Link zu Klavio geteilt (WhatsApp, Signal, soziale Medien), zeigen die Dienste Titel,
Beschreibung und das Bild `client/public/og-image.jpg` (1200 × 630). Diese Dienste verlangen absolute
Adressen: Der Server setzt beim Ausliefern von `index.html` seine `APP_ORIGIN` ein. `robots.txt`
erlaubt Suchmaschinen die Startseite und sperrt `/api/`.

Der Produktname ist ein Platzhalter und steht zentral in `shared/src/config/app.ts` (UI, Manifest,
WebAuthn, E-Mails); eine Änderung braucht einen neuen Build.

## Sicherung und Wiederherstellung

Alles Wichtige liegt in MongoDB. Sicherung als komprimiertes Archiv:

```bash
docker compose exec -T mongo mongodump --db klavio --archive --gzip > klavio-$(date +%F).archive.gz
```

Wiederherstellen (überschreibt den aktuellen Stand):

```bash
docker compose exec -T mongo mongorestore --drop --archive --gzip < klavio-2026-11-07.archive.gz
```

Das Volume `caddy_data` enthält nur die Zertifikate; Caddy holt sie bei Verlust neu. Sicherungen
enthalten Personendaten (E-Mail-Adressen, Profilnamen) – verschlüsselt und nur so lange wie nötig
aufbewahren, siehe [datenschutz.md](datenschutz.md).

## Aktualisieren

```bash
git pull                       # neue docker-compose.yml / Caddyfile, falls geändert
docker compose pull app
docker compose up -d mongo app caddy
```

Eine bestimmte Version statt `latest`: `KLAVIO_VERSION=2026.11.0` in `.env`. Selbst bauen statt
herunterladen: `docker compose build app`.

Indizes legt der Server beim Start selbst an; Migrationen sind bisher nicht nötig. Geöffnete Apps
laden die neue Version im Hintergrund und zeigen ein Banner «Neue Version verfügbar – Neu laden».
Vorher eine Sicherung machen.

## Überwachen

- **Gesundheit:** `GET /api/health` → `{"ok":true}`.
- **Logs:** `docker compose logs -f app` (JSON, eine Zeile pro Anfrage: Methode, Pfad, Status,
  Dauer – **ohne IP-Adressen**). Caddy schreibt kein Zugriffsprotokoll. Fehler enthalten den
  Stacktrace.
- **Container-Neustart** ist mit `restart: unless-stopped` eingerichtet.

## Sicherheit

- **Ports:** Nur Caddy (443, optional 80) ist von aussen erreichbar. MongoDB (27017) und Mailpit sind
  nur an `127.0.0.1` gebunden; im Betrieb Mailpit nicht starten. MongoDB läuft ohne Passwort im
  internen Docker-Netz – auf einem geteilten Server zusätzlich die Authentifizierung von MongoDB
  einschalten und eine Firewall verwenden.
- **Header** (Caddy): strikte CSP (Skripte nur von der eigenen Domain; `style-src 'unsafe-inline'` für
  Mantine, `font-src data:` für die eingebettete Notenschrift), HSTS, `Permissions-Policy` erlaubt nur
  Mikrofon und MIDI für die eigene Domain, kein Einbetten in fremde Seiten.
- **API:** Eingaben mit zod geprüft, begrenzte Anfragegrösse, Origin-Prüfung für alle schreibenden
  Anfragen, Rate-Limits (global 300/min; E-Mail-Codes 5 pro Adresse und 30 pro IP in 10 Minuten,
  Prüfungen 10 bzw. 60). Im Entwicklungsmodus ist `localhost` von den IP-Limits ausgenommen.
- **Secrets:** nur in `.env` (nicht im Repository). `AUTH_SECRET` nicht mit anderen Diensten teilen.
- **Sessions** sind 60 Tage gültig; bei Verdacht alle Sitzungen beenden:
  `docker compose exec mongo mongosh klavio --eval 'db.sessions.deleteMany({})'`.

## Bekannte Plattform-Einschränkungen

- **iPad/iPhone:** kein Web MIDI (nur Mikrofon oder Bildschirm-Klaviatur). Audio startet erst nach
  einem Tippen. In der installierten App fragt iOS die Mikrofonfreigabe teils bei jedem Start erneut.
  Safari kann Website-Daten nach längerer Inaktivität löschen – dann fehlen nur der Offline-Stand und
  noch nicht übertragene Ergebnisse; der Server bleibt die Quelle der Wahrheit. Installation nur über
  «Teilen → Zum Home-Bildschirm».
- **Firefox:** kein Web MIDI ohne Add-on.
- **MongoDB 8.0 auf Linux-Kernel 7.x:** startet nur mit `GLIBC_TUNABLES=glibc.pthread.rseq=1`
  (in `docker-compose.yml` gesetzt), bis das Image mindestens 8.0.35 enthält.
