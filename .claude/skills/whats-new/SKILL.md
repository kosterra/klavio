---
name: whats-new
description: Keep Klavio's «Was ist neu» page (/whats-new, client/src/whatsNew/changelog.ts) up to date – every new feature and every fix of something learners or parents already have gets a line in the «Next release» entry in the same commit, in Swiss German (no ß, informal du) with its English text; that entry gets its version number only when the version is set before a pull request, and numbered entries are never changed. Use whenever implementing a feature, changing what learners or parents see or do, or fixing a bug, and before committing such work; also when the user asks to update What's new or the changelog.
---

# «Was ist neu» for Klavio

`/whats-new` (public, also in the app menu and in «Über Klavio») shows what changed,
newest first, from `client/src/whatsNew/changelog.ts`. **The commit that adds a feature
or fixes a bug also adds or changes its line.**

## Which entry

- Changes go into the top entry `{ version: UPCOMING, changes: [...] }` («Nächste
  Version · Kommt bald»). The release build of `main` hides it (`APP_RELEASED`).
- If the top entry has a number, create a new `UPCOMING` entry above it.
- **An entry with a version number is never changed** – it was released as it stands.
- The number comes only right before a pull request (see the versioning skill): then
  `UPCOMING` becomes that version in the version commit.

## What gets a line

| Change | Line |
|---|---|
| New feature, or something learners/parents see or do differently | a line, or extend the line of its area |
| Fix of something already released that people could notice | starts with `Korrektur: ` / `Fix: ` |
| Fix of a feature still in «Next release» | no own line; correct the feature's line if needed |
| New lessons, worlds, songs | a line per world or block, not per lesson |
| Refactoring, tests, CI, dependencies, the Docker image | nothing |
| Security fixes | a short line without details of the weakness |

About three to eight lines per version; merge lines of one area.

## How a line reads

- `L('Deutsch …', 'English …')` – Swiss German (ss, informal du), British English.
- A topic before the colon is shown bold: `'Klavi liest vor: …'`.
- For learners and parents: what they can do or see now and where («unter «Mein
  Profil»»), never component or file names.
- The app's own words for its screens and buttons («Entdecken», «Schnelle Runde»).

## Before committing

1. Only the top entry changed (`git diff client/src/whatsNew/changelog.ts`).
2. `npx eslint client/src/whatsNew` and `npm test --workspace client`.
