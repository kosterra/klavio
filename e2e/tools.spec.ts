import { expect, test } from '@playwright/test';
import { audit } from './audit';
import { seedCompletedLessons, signUpWithEmail, uniqueEmail } from './helpers';

test('free play, metronome, wardrobe, family overview, placement and data export', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await signUpWithEmail(page, uniqueEmail('tools'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lina');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await page.getByRole('heading', { name: 'Hallo Lina!' }).waitFor();

  // free play: the note played shows up big
  await page.goto('/play');
  await page.getByRole('button', { name: 'E4', exact: true }).click();
  await expect(page.getByTestId('free-note')).toHaveText('E');
  await page.getByText('Spieluhr').click();
  await audit(page);

  // metronome: tap tempo and start/stop
  await page.goto('/metronome');
  await page.getByRole('button', { name: 'Tempo tippen' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Tempo tippen' }).click();
  await expect(page.getByTestId('tempo')).not.toHaveText(/^80/);
  await page.getByTestId('metronome-toggle').click();
  await expect(page.getByTestId('metronome-toggle')).toHaveText('Stopp');
  await page.getByTestId('metronome-toggle').click();
  await audit(page);

  // wardrobe: level 1 → only «Nichts»; the cap needs level 2
  await page.goto('/profile');
  const wardrobe = page.getByTestId('wardrobe');
  await expect(wardrobe.getByRole('radio', { name: 'Zipfelmütze – ab Level 2' })).toBeVisible();
  await expect(wardrobe.getByRole('radio', { name: 'Nichts' })).toBeChecked();

  // placement: start at chapter 3 → the dashboard goes on there
  page.once('dialog', (d) => void d.accept());
  await page.getByTestId('placement').getByLabel('Beginnen bei').click();
  await page.getByRole('option', { name: /Kapitel 3/ }).click();
  await page.getByRole('button', { name: 'Hier beginnen' }).click();
  await expect(page.getByText('Kapitel 3 · Noten-Meer').first()).toBeVisible();

  // family overview
  await seedCompletedLessons(page, ['read-c-d-e']);
  await page.goto('/family');
  await expect(page.getByTestId('progress-Lina')).toContainText('Lektionen');
  await audit(page);

  // data export
  await page.goto('/account');
  const download = page.waitForEvent('download');
  await page.getByTestId('export').click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^klavio-.*\.json$/);
});
