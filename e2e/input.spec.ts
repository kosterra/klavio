import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { signUpWithEmail, uniqueEmail } from './helpers';
import { audit } from './audit';
import { installFakeMidi } from './fixtures/fakeMidi';

const MIC_FIXTURE = join(import.meta.dirname, '..', 'test-results', 'mic-fixture.wav');

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

const midi = (page: Page, bytes: number[]) =>
  page.evaluate(
    (b) => (window as never as { __fakeMidi: { send(b: number[]): void } }).__fakeMidi.send(b),
    bytes,
  );

test('MIDI, on-screen keyboard and computer keys share one input; MIDI beats the microphone', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.addInitScript(installFakeMidi);
  await signUpWithEmail(page, uniqueEmail('input'), 'Input');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Mira');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();

  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByRole('menuitem', { name: 'Eingabe' }).click();
  await expect(page.getByRole('heading', { name: 'Wie spielst du?' })).toBeVisible();
  await expect(page.getByText('Aktiv: Bildschirm')).toBeVisible();
  await audit(page);

  const last = page.getByTestId('last-note');
  const source = page.getByTestId('last-source');

  // --- on-screen keyboard (tap) and computer keyboard (G = G4)
  await page.getByRole('button', { name: 'E4', exact: true }).click();
  await expect(last).toHaveText('E4');
  await expect(source).toHaveText('Bildschirm');
  await page.keyboard.press('KeyG');
  await expect(last).toHaveText('G4');

  // --- MIDI: connect, play, priority
  await page.getByRole('button', { name: 'MIDI verbinden' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Klavio Test Piano' })).toBeVisible();
  await expect(page.getByText('Aktiv: MIDI (Klavio Test Piano)')).toBeVisible();
  await midi(page, [0x90, 60, 100]);
  await expect(last).toHaveText('C4');
  await expect(source).toHaveText('MIDI');
  // the screen keyboard lights up the key played on the MIDI device
  await expect(page.getByRole('button', { name: 'C4', exact: true })).toHaveClass(/_active_/);
  if (process.env.E2E_SCREENSHOTS) {
    await page.screenshot({ path: `${process.env.E2E_SCREENSHOTS}/input.png`, fullPage: true });
  }
  await midi(page, [0x80, 60, 0]);
  await expect(page.getByRole('button', { name: 'C4', exact: true })).not.toHaveClass(/_active_/);
  await audit(page);

  // microphone hears the "digital piano" (fixture: A4 after 4 s) → ignored because of MIDI
  await page.getByRole('button', { name: 'Hier testen' }).click();
  await expect(page.getByText('pausiert (MIDI)')).toBeVisible();
  await expect(page.getByTestId('ignored-note')).toHaveText(
    'A4 vom Mikrofon ignoriert: MIDI hat Vorrang.',
    { timeout: 15_000 },
  );
  await expect(last).toHaveText('C4');

  // --- unplugging falls back to the microphone
  await page.evaluate(() =>
    (window as never as { __fakeMidi: { unplug(): void } }).__fakeMidi.unplug(),
  );
  await expect(page.getByText('Aktiv: Mikrofon')).toBeVisible();
  await expect(last).toHaveText(/^(C4|E4|G4|C5)$/, { timeout: 15_000 });
  await expect(source).toHaveText('Mikrofon');
  await page.getByRole('button', { name: 'Stoppen' }).click();
});
