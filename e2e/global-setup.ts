import { execFileSync } from 'node:child_process';

/** A previously aborted run may have left registration closed; reopen it. */
export default function globalSetup() {
  execFileSync('docker', [
    'compose',
    'exec',
    '-T',
    'mongo',
    'mongosh',
    'klavio',
    '--quiet',
    '--eval',
    `db.appsettings.updateOne({ _id: 'global' }, { $set: { registrationOpen: true } })`,
  ]);
}
