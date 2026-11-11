import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { signUpWithEmail, skipSetup, uniqueEmail } from './helpers';
import { audit } from './audit';

const file = fileURLToPath(new URL('./fixtures/mein-lied.musicxml', import.meta.url));

test('own pieces: import a MusicXML file, play it, print it, delete it', async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await signUpWithEmail(page, uniqueEmail('own'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lina');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);

  await page.goto('/songs');
  const own = page.getByTestId('own-pieces');
  await own.locator('input[type=file]').setInputFiles(file);
  await expect(page.getByTestId('own-draft')).toContainText('Mein erstes Lied');
  await expect(page.getByTestId('own-draft')).toContainText('2 Takte');
  await audit(page);
  await page.getByTestId('own-save').click();
  await expect(own.getByRole('link', { name: /Mein erstes Lied/ }).first()).toBeVisible();

  // play it like a song – no stars
  await own.getByRole('link', { name: /Mein erstes Lied.*Lina/ }).click();
  await page.getByTestId('own-start').click();
  const keys = page.getByRole('group', { name: 'Klaviatur' });
  for (const k of ['C4', 'D4', 'E4', 'G4'])
    await keys.getByRole('button', { name: k, exact: true }).click();
  await expect(page.getByTestId('own-done')).toBeVisible();
  await audit(page);

  // on paper
  await page.goto('/songs');
  await own.getByRole('link', { name: 'Noten von «Mein erstes Lied» drucken' }).click();
  await expect(page.getByTestId('sheet')).toContainText('Eigenes Stück');
  await expect(page.getByTestId('sheet')).toContainText('Lina');

  // a file that is not MusicXML is refused with a reason
  await page.goto('/songs');
  await own.locator('input[type=file]').setInputFiles({
    name: 'brief.xml',
    mimeType: 'text/xml',
    buffer: Buffer.from('<letter>Hallo</letter>'),
  });
  await expect(page.getByTestId('own-problem')).toContainText('keine MusicXML-Datei');

  // gone again
  await own.getByRole('button', { name: '«Mein erstes Lied» löschen' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Löschen' }).click();
  await expect(own.getByRole('link', { name: /Mein erstes Lied/ })).toHaveCount(0);

  // classics: a piece by Schumann, with its source and licence
  await page.goto('/songs');
  await page.getByTestId('classic-schumann-melodie').click();
  await expect(page.getByTestId('classic-source')).toContainText('Mutopia Project');
  await expect(page.getByTestId('classic-source')).toContainText('CC BY-SA');
  await page.getByTestId('own-start').click();
  await expect(page.getByTestId('piece-practice')).toBeVisible();
  await audit(page);
  await page.goto('/classics/schumann-melodie/print');
  await expect(page.getByTestId('sheet')).toContainText('Robert Schumann');
  await expect(page.getByTestId('sheet')).toContainText('CC BY-SA 2.5');
});
