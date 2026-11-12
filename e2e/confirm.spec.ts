import { expect, test } from '@playwright/test';
import { signUpWithEmail, skipSetup, skipTheory, uniqueEmail } from './helpers';

test('leaving a lesson and signing out ask first', async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await signUpWithEmail(page, uniqueEmail('confirm'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Mia');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2017');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);

  // not started yet: the X just leaves
  await page.goto('/lesson/keys-c');
  await skipTheory(page);
  await page.getByRole('button', { name: 'Lektion beenden' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo Mia!' })).toBeVisible();

  // started: the X asks, «Weiterspielen» keeps the run
  await page.goto('/lesson/keys-c');
  await skipTheory(page);
  await page.getByTestId('lesson-start').click();
  await page.getByRole('button', { name: 'C4', exact: true }).click();
  await page.getByRole('button', { name: 'Lektion beenden' }).click();
  const ask = page.getByRole('dialog', { name: 'Wirklich aufhören?' });
  await expect(ask).toBeVisible();
  await ask.getByRole('button', { name: 'Weiterspielen' }).click();
  await expect(ask).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'C4', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Lektion beenden' }).click();
  await ask.getByRole('button', { name: 'Aufhören' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo Mia!' })).toBeVisible();

  // signing out asks too
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByRole('menuitem', { name: 'Abmelden' }).click();
  const out = page.getByRole('dialog', { name: 'Abmelden?' });
  await expect(out).toBeVisible();
  await out.getByRole('button', { name: 'Angemeldet bleiben' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo Mia!' })).toBeVisible();
});
