import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { writeMicFixture } from './fixtures/micAudio';

export const MIC_FIXTURE = join(import.meta.dirname, '..', 'test-results', 'mic-fixture.wav');

/**
 * Reopens registration and switches the full start page on, directly in the
 * dev database (no browser needed) – the specs expect both.
 */
export function reopenRegistration() {
  execFileSync('docker', [
    'compose',
    'exec',
    '-T',
    'mongo',
    'mongosh',
    'klavio',
    '--quiet',
    '--eval',
    `db.appsettings.updateOne({ _id: 'global' }, { $set: { registrationOpen: true, publicPage: true } })`,
  ]);
}

/** A previously aborted run may have left registration closed; reopen it. */
export default function globalSetup() {
  writeMicFixture(MIC_FIXTURE);
  reopenRegistration();
}
