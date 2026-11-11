import { expect, test } from '@playwright/test';
import { grantAdmin, signUpWithEmail, skipSetup, uniqueEmail } from './helpers';
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

  // the 6th: Samichlaus is there; on the 9th he's gone and a reindeer peeks in
  await page.clock.setFixedTime(new Date('2026-12-06T10:00:00'));
  await page.goto('/');
  await expect(decor.locator('[data-piece="samichlaus"]')).toBeVisible();
  await page.clock.setFixedTime(new Date('2026-12-09T10:00:00'));
  await page.goto('/');
  await expect(decor.locator('[data-piece="samichlaus"]')).toHaveCount(0);
  await expect(page.getByTestId('season-reindeer')).toBeVisible();
  await expect(page.getByTestId('season-garland')).toBeVisible();

  // Christmas Eve: everything, and a greeting
  await page.clock.setFixedTime(new Date('2026-12-24T10:00:00'));
  await page.goto('/');
  await expect(decor).toHaveAttribute('data-season', 'christmas');
  await expect(hero).toHaveText('Frohe Weihnachten, Mia!');
  await expect(decor.locator('[data-piece="santa"]')).toBeAttached();
  await expect(page.getByTestId('season-logo-cap')).toBeVisible();
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

test('admins can try the festive season out on their device', async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.setFixedTime(new Date('2026-11-10T10:00:00'));
  const email = uniqueEmail('season-admin');
  await signUpWithEmail(page, email, 'Admin');
  grantAdmin(email);
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Ada');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('1980');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  const decor = page.getByTestId('season-decor');
  await expect(page.getByRole('heading', { name: 'Hallo Ada!' })).toBeVisible();
  await expect(decor).toHaveCount(0);

  // pick Christmas Eve under «Verwaltung» …
  await page.goto('/admin');
  const card = page.getByTestId('season-preview');
  await card.getByText('Heiligabend').click();
  await expect(card.getByTestId('season-preview-state')).toContainText('24. Dezember 2026');
  await audit(page);
  // … and the start page celebrates
  await card.getByRole('link', { name: 'Zur Startseite' }).click();
  await expect(decor).toHaveAttribute('data-season', 'christmas');
  await expect(page.getByRole('heading', { name: 'Frohe Weihnachten, Ada!' })).toBeVisible();

  // a particular day: New Year's Eve
  await page.goto('/admin');
  await card.getByTestId('season-preview-day').fill('2026-12-31');
  await page.goto('/');
  await expect(decor).toHaveAttribute('data-season', 'newyear');

  // off again: today
  await page.goto('/admin');
  await card.getByText('Aus (heute)').click();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hallo Ada!' })).toBeVisible();
  await expect(decor).toHaveCount(0);
});
