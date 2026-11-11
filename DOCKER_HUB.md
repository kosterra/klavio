# Klavio – learn piano on a real piano

**Klavio** is a self-hosted web app for learning the piano on a real piano: it listens through the microphone (or takes a digital piano over MIDI), shows step by step what comes next and leads children and adults through colourful worlds. One image holds the whole app: the API (Fastify) and the web app (React), installable on tablets and phones as an app. All it needs next to it is MongoDB and HTTPS in front.

**Source and documentation:** [github.com/kosterra/klavio](https://github.com/kosterra/klavio) · **Licence:** AGPLv3

---

## What it does

- **On a real piano:** note detection through the microphone, MIDI for digital pianos, or the on-screen keyboard. **Audio stays on the device** – it is analysed in the browser and never uploaded or stored.
- **Learning path:** worlds from the first key to playing with both hands – keys, the right and left hand, reading music in both clefs, rhythm, black keys, songs and pieces for both hands, improvising.
- **Discover:** a short explanation with pictures, games and quizzes before each lesson; reading aloud for children who can't read yet (with the device's own voices).
- **Review like flash cards:** lessons come back after 1, 3, 7, 14 and 30 days, with a quick round and medals.
- **My dream song:** adults name the song they want to play one day; Klavio recognises it and shows the skills it needs and how close they are.
- **Two kinds of worlds:** colourful worlds for children; from an age admins set, a profile can choose «The journey» instead – down into «hell», the hardest chapter, and up to the dream song, with an elevation profile.
- **For families:** several profiles per account, a Kids and a Classic view, a parent area behind a PIN (or a passkey), stars, levels and badges without pressure.
- **Accounts:** passkeys (fingerprint, face or device PIN) or a code by e-mail – no passwords. No birthdates (just the year, to offer the right worlds), no tracking, no ads.
- **Works offline** once loaded; results are sent when the device is back online.
- **Languages:** German (Switzerland) and English; light and dark colour scheme.

---

## Quick start

The repository has a ready-to-copy [`docker-compose.yml`](https://github.com/kosterra/klavio/blob/main/docker-compose.yml) with MongoDB and Caddy (HTTPS with Let's Encrypt), its [`Caddyfile`](https://github.com/kosterra/klavio/blob/main/Caddyfile) and [`.env.example`](https://github.com/kosterra/klavio/blob/main/.env.example) for the settings.

1. Copy the three files into a folder. Rename `.env.example` to `.env` and fill in at least:
   - `AUTH_SECRET` (at least 32 random characters, e.g. `openssl rand -base64 48`);
   - `SITE_ADDRESS` (your domain, e.g. `klavio.example.com` – passkeys need a domain, not an IP address);
   - `CADDY_TLS` (your e-mail address for Let's Encrypt) and `HTTPS_PORT=443`;
   - `SMTP_HOST_DOCKER`, `SMTP_PORT_DOCKER`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` (sign-up and login codes go out by mail).
2. Start it: `docker compose up -d mongo app caddy`.
3. Open `https://<your domain>`, create an account, then make it an admin:
   `docker compose exec app node server/dist/scripts/grantAdmin.js you@example.com`.
   Admins can close the registration, e.g. for an instance only for the own family or school.

**HTTPS is required:** passkeys, the microphone and offline use only work on a secure origin. Without Caddy, put any reverse proxy in front of port 3100 and set `TRUST_PROXY=1` (the number of proxies in front of the app, or a comma-separated list of their addresses – never more than there really are, or clients could pick their own address for the rate limits).

A minimal service, next to a MongoDB 8 that only it can reach:

```yaml
services:
  klavio:
    image: kosterra/klavio:latest
    restart: unless-stopped
    ports:
      - '127.0.0.1:3100:3100' # for the reverse proxy on the same host
    environment:
      MONGO_URL: mongodb://mongo:27017/klavio
      AUTH_SECRET: ${AUTH_SECRET}
      APP_ORIGIN: https://klavio.example.com
      RP_ID: klavio.example.com
      TRUST_PROXY: '1'
      SMTP_HOST: smtp.example.com
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      MAIL_FROM: Klavio <klavio@example.com>
```

---

## Environment variables

| Variable                    | Required       | Default                            | What it is for                                                                                                                   |
| --------------------------- | -------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_SECRET`               | yes            | —                                  | At least 32 characters; protects the e-mail codes and the parent PIN. Changing it makes codes in flight and set PINs invalid     |
| `MONGO_URL`                 | yes            | `mongodb://localhost:27017/klavio` | Where MongoDB is                                                                                                                 |
| `APP_ORIGIN`                | yes            | `http://localhost:5173`            | The public address the browser sees (`https://klavio.example.com`): passkeys, the origin check and the address in link previews  |
| `RP_ID`                     | yes            | `localhost`                        | The domain passkeys belong to, without scheme and port (`klavio.example.com`)                                                    |
| `TRUST_PROXY`               | behind a proxy | `false`                            | number of reverse proxies in front (`1` for one), or a list of their addresses / CIDR ranges, so rate limits see the real client |
| `COOKIE_SECURE`             | no             | `true`                             | The login cookie only over HTTPS; `false` only for `http://localhost`                                                            |
| `SESSION_TTL_DAYS`          | no             | `60`                               | How long a login lasts                                                                                                           |
| `REGISTRATION_OPEN_DEFAULT` | no             | `true`                             | Whether new accounts may sign up at first; admins switch it in the app later                                                     |
| `SMTP_HOST`                 | for mail       | —                                  | The mail server. Without it, mails only go to the log (development)                                                              |
| `SMTP_PORT`                 | no             | `587`                              | `465` together with `SMTP_SECURE=true`                                                                                           |
| `SMTP_SECURE`               | no             | `false`                            | TLS from the start (port 465)                                                                                                    |
| `SMTP_REQUIRE_TLS`          | no             | `true`                             | Insist on STARTTLS                                                                                                               |
| `SMTP_USER`, `SMTP_PASS`    | no             | —                                  | The login at the mail server                                                                                                     |
| `MAIL_FROM`                 | recommended    | `Klavio <no-reply@localhost>`      | The sender of the codes                                                                                                          |
| `LOG_LEVEL`                 | no             | `info`                             | `fatal` … `trace`, `silent`. Logs carry no IP addresses                                                                          |
| `PORT`, `HOST`              | no             | `3100`, `0.0.0.0`                  | Where the server listens inside the container                                                                                    |

---

## Data, backups and health

- **All data is in MongoDB** (accounts, profiles, progress); the container itself keeps nothing and needs no volume.
- **Backups:** `docker compose exec -T mongo mongodump --db klavio --archive --gzip > klavio.archive.gz`, restore with `mongorestore --drop --archive --gzip`. Backups contain personal data (e-mail addresses, profile names) – keep them encrypted.
- **Health:** the image has a `HEALTHCHECK` on `/api/health`; Docker and Portainer show the state.
- **Upgrading:** pull the new image and restart; indexes are created at startup. Open apps load the new version in the background and offer to reload.
- The app runs as user `node`, with its own security headers (CSP, HSTS, Permissions-Policy: microphone and MIDI only for itself).

---

## Tags

| Tag        | What it is                                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `latest`   | The newest release                                                                                                      |
| `YYYY.M.N` | A release, e.g. `2026.11.0` – what changed is under _What's new_ in the app (`/whats-new`)                              |
| `develop`  | The newest state of development, built after every change that passes all checks: for a test server, not for production |

Releases are signed keyless with Sigstore and carry provenance and an SBOM:

```sh
cosign verify kosterra/klavio:latest \
  --certificate-identity-regexp 'https://github.com/kosterra/klavio/.github/workflows/release.yml@.*' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

---

## Licence

[AGPLv3](https://www.gnu.org/licenses/agpl-3.0.html): run it, change it and share it. Whoever offers a changed Klavio to others over the network shares its source code too (the app links to it; set your fork's address in `shared/src/config/app.ts`). Please give a changed version you offer to others a name of its own, so nobody mistakes it for this project.
