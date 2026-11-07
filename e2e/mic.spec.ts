import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { signUpWithEmail, uniqueEmail } from './helpers';
import { audit } from './audit';

const MIC_FIXTURE = join(import.meta.dirname, '..', 'test-results', 'mic-fixture.wav');

// Chromium plays the generated WAV once as the microphone input (see global-setup).
test.use({
  permissions: ['microphone'],
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${MIC_FIXTURE}%noloop`,
    ],
  },
});

test('microphone setup wizard calibrates and the test page detects notes', async ({ page }) => {
  test.setTimeout(90_000);
  await signUpWithEmail(page, uniqueEmail('mic'), 'Mic');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Noah');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await expect(page.getByText(/Richte zuerst das Mikrofon ein/)).toBeVisible();
  await page.getByRole('link', { name: 'Mikrofon einrichten' }).click();

  await expect(page.getByRole('heading', { name: 'Mikrofon einrichten' })).toBeVisible();
  await audit(page);

  // 1: permission (the fake audio file starts playing now: 4 s of quiet first)
  await page.getByRole('button', { name: 'Mikrofon erlauben' }).click();
  // 2: room noise
  await page.getByRole('button', { name: 'Messen' }).click();
  await expect(page.getByText(/der Raum ist ruhig/)).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: 'Weiter' }).click();
  // 3: tuning — the fixture plays a held A4 at exactly 440 Hz
  await expect(page.getByText(/gestimmt/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/A = 4(39\.\d|40\.\d) Hz/)).toBeVisible();
  await page.getByRole('button', { name: 'Weiter' }).click();
  // 4: C4 E4 G4 C5
  await expect(page.getByText('Super, ich höre dich gut!')).toBeVisible({ timeout: 10_000 });
  for (const n of ['C4', 'E4', 'G4'])
    await expect(page.getByText(n, { exact: true })).toBeVisible();
  await audit(page);
  if (process.env.E2E_SCREENSHOTS) {
    await page.screenshot({ path: `${process.env.E2E_SCREENSHOTS}/mic-setup.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Speichern und fertig' }).click();

  // saved → mic test page, no "not calibrated" hint anymore
  await expect(page.getByRole('heading', { name: 'Mikrofon-Test' })).toBeVisible();
  await expect(page.getByText(/noch nicht eingerichtet/)).toHaveCount(0);

  // the test page lists what it hears (the fake input starts again from the top)
  await page.getByRole('button', { name: 'Mikrofon starten' }).click();
  const log = page.getByRole('table').filter({ hasText: 'Abweichung' });
  for (const n of ['A4', 'C4', 'E4', 'G4', 'C5']) {
    await expect(log.getByRole('cell', { name: n, exact: true })).toBeVisible({ timeout: 15_000 });
  }
  // exactly these five notes — no octave slips or repeated triggers
  await expect(log.locator('tbody tr')).toHaveCount(5);
  await audit(page);
  if (process.env.E2E_SCREENSHOTS) {
    await page.screenshot({ path: `${process.env.E2E_SCREENSHOTS}/mic-test.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Stoppen' }).click();
});
