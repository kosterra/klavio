#!/usr/bin/env node
// The version of Klavio: {year}.{month}.{sequence}, the sequence counting from
// 0 in each month (2026.11.0, 2026.11.1, … then 2026.12.0). The month has no
// leading zero, so the version stays valid semver for npm, the git tag and the
// image tag (kosterra/klavio:2026.11.0). It lives in the root package.json
// (`version`), which the release workflow tags and builds and the app shows
// under «Was ist neu».
//
//   node scripts/version.mjs           # show the version and the next one
//   node scripts/version.mjs next      # write the next version
//   node scripts/version.mjs 2026.11.0 # write this version (a correction)
//
// The next version after the current one: in the same month the sequence goes
// up by one, in a new month (or year) it starts at 0 again. See the
// versioning skill (.claude/skills/versioning) for when to bump.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE = path.join(ROOT, 'package.json');
const FORMAT = /^(\d{4})\.([1-9]|1[0-2])\.(0|[1-9]\d*)$/;

export const nextVersion = (current, today = new Date()) => {
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const match = FORMAT.exec(current);
  if (match && Number(match[1]) === year && Number(match[2]) === month) {
    return `${year}.${month}.${Number(match[3]) + 1}`;
  }
  return `${year}.${month}.0`;
};

// replaced as a whole (a temp file renamed over it), as the dev servers watch the working copy
const writeAtomic = (file, text) => {
  const temp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temp, text);
  fs.renameSync(temp, file);
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const text = fs.readFileSync(PACKAGE, 'utf8');
  const current = JSON.parse(text).version;
  const arg = process.argv[2];

  if (!arg) {
    const note = FORMAT.test(current) ? '' : ' (not {year}.{month}.{sequence})';
    console.log(`version ${current}${note}, next ${nextVersion(current)}`);
    process.exit(0);
  }

  const version = arg === 'next' ? nextVersion(current) : arg;
  if (!FORMAT.test(version)) {
    console.error(`${version} is not {year}.{month}.{sequence} (e.g. 2026.11.0, no leading zeros)`);
    process.exit(1);
  }
  writeAtomic(PACKAGE, text.replace(/("version":\s*")[^"]*(")/, `$1${version}$2`));
  console.log(`${current} → ${version}`);
}
