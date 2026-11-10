import { expect, test } from '@playwright/test';
import { signUpWithEmail, skipSetup, uniqueEmail } from './helpers';
import { audit } from './audit';

test('Advent brings a piece a day, then Christmas, then New Year', async ({ page }) => {
  test.setTimeout(90_000);
  await signUpWithEmail(page, uniqueEmail('season'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Mia');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);

  const decor = page.getByTestId('season-decor');
  const hero = page.getByRole('heading', { level: 1 });

  // first Sunday of Advent: only the wreath
  await page.clock.setFixedTime(new Date('2026-11-29T10:00:00'));
  await page.goto('/');
  await expect(decor).toHaveAttribute('data-season', 'advent');
  await expect(hero).toHaveText('Hallo Mia!');

  // Christmas Eve: everything, and a greeting
  await page.clock.setFixedTime(new Date('2026-12-24T10:00:00'));
  await page.goto('/');
  await expect(decor).toHaveAttribute('data-season', 'christmas');
  await expect(hero).toHaveText('Frohe Weihnachten, Mia!');
  await audit(page);

  // New Year's Day: fireworks
  await page.clock.setFixedTime(new Date('2027-01-01T10:00:00'));
  await page.goto('/');
  await expect(decor).toHaveAttribute('data-season', 'newyear');
  await expect(hero).toHaveText('Gutes neues Jahr 2027, Mia!');
  await audit(page);

  // and back to normal
  await page.clock.setFixedTime(new Date('2027-01-02T10:00:00'));
  await page.goto('/');
  await expect(hero).toHaveText('Hallo Mia!');
  await expect(decor).toHaveCount(0);
});
