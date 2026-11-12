import { expect, test } from '@playwright/test';
import { LESSONS } from '@klavio/shared';
import { seedCompletedLessons, signUpWithEmail, skipSetup, uniqueEmail } from './helpers';
import { audit } from './audit';

test('a song can be printed as a sheet in Klavio’s look', async ({ page }) => {
  test.setTimeout(90_000);
  await signUpWithEmail(page, uniqueEmail('print'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lina');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2017');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  const upto = LESSONS.findIndex((l) => l.id === 'hand-entchen');
  await seedCompletedLessons(
    page,
    LESSONS.slice(0, upto).map((l) => l.id),
  );

  await page.goto('/songs');
  await page.getByRole('link', { name: 'Noten von «Alle meine Entchen» drucken' }).click();
  const sheet = page.getByTestId('sheet');
  await expect(sheet.getByRole('heading', { name: 'Alle meine Entchen' })).toBeVisible();
  await expect(sheet).toContainText('für Lina');
  await expect(sheet).toContainText('Diese Woche geübt');
  await expect(sheet.getByRole('img', { name: 'Notenzeile 1' })).toBeVisible();
  await audit(page);

  // the print view: only the sheet, on one A4 page
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByTestId('sheet-print')).toBeHidden();
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  const pages = pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? [];
  expect(pages).toHaveLength(1);

  // a song not reached yet cannot be printed
  await page.emulateMedia({ media: 'screen' });
  await page.goto('/songs/song-haenschen/print');
  await expect(page.getByRole('heading', { name: 'Lieder', exact: true })).toBeVisible();
});
