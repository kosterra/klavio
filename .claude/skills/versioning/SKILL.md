---
name: versioning
description: Klavio's version numbers and releases – the format {year}.{month}.{sequence} (sequence from 0 in each month, e.g. 2026.11.0, 2026.11.1, 2026.12.0), where the version lives (root package.json), the script that bumps it, the branches (develop → release/<version> → main) and the rule that the next version is set on develop right before every pull request (opened only when the developer asks). Use whenever creating a pull request, cutting a release, bumping, setting or checking the version, naming a release branch or a «Was ist neu» entry, or when the user asks about versions or Docker image tags.
---

# Versioning for Klavio

## The format

**`{year}.{month}.{sequence}`** – the year, the calendar month, and a sequence number
that starts at **0** in every month:

`2026.11.0` → `2026.11.1` → (December) `2026.12.0` → (January) `2027.1.0`

- No leading zeros (`2027.1.0`, never `2027.01.0`): the version must stay valid semver
  for npm, the git tag and the Docker image tag (`kosterra/klavio:2026.11.0`).
- The month is the month **when the version is set**, not when it ships.
- The sequence only goes up within a month; a new month (or year) starts at 0.

## Where it lives

Only in the **root `package.json`** (`version`). `release.yml` reads it for the git tag
and the image tags (`<version>` and `latest`); the app shows it under «Was ist neu»
and in «Über Klavio» (Vite `__APP_VERSION__`). `shared`, `server` and `client` keep
their own `0.0.0`/`0.1.0` – do not touch them.

## The script

```sh
node scripts/version.mjs              # current version and the next one
node scripts/version.mjs next         # write the next version
node scripts/version.mjs 2026.11.3    # write a given version (corrections only)
```

## Branches and images

| Branch | Workflow | Image |
|---|---|---|
| pull request into `develop` (e.g. Dependabot) | `checks.yml` | – |
| push to `develop` | `develop.yml`: checks, then build | `kosterra/klavio:develop` («Next release» shown as coming soon) |
| merge into `main` | `release.yml`: git tag, build with `APP_RELEASED=true`, cosign signature, provenance + SBOM | `kosterra/klavio:<version>` and `:latest` |
| manual run of `release.yml` | checks, then rebuild of the current version (new base image) | same tags |

Secrets in the repository: `DOCKERHUB_USER`, `DOCKERHUB_PASSWORD` (an access token).

## When the version changes

**Pull requests are opened only when the developer asks for one.** Work goes to
`develop`; `main` changes only through a PR the developer merges themself.

**Right before every pull request you create, set the next version on `develop`:**

1. On `develop`: `git pull`, then `node scripts/version.mjs next`.
2. In the same commit, the «Next release» entry of «Was ist neu»
   (`client/src/whatsNew/changelog.ts`) gets that version (see the whats-new skill).
3. Commit `Version <new version>` (with the attribution lines) and push `develop`.
4. Wait for the develop run (`gh run list --branch develop --limit 1`, then
   `gh run watch <id> --exit-status`); fix failures on `develop` first and push
   nothing else until the PR is open.
5. `git push origin develop:release/<version>` and open the PR `release/<version>` →
   `main`. Link the develop run in the PR. Merging builds the release.
6. Tell the developer the PR with its version.

If creating the PR fails after the bump, keep the version (it is set once per PR).

## Checks

- `node scripts/version.mjs` warns when the version is not in the format.
- A version number is never reused: if `git tag` has it, it was released.
