import { expect, test } from '@playwright/test';
import { signUpWithEmail, skipSetup, uniqueEmail } from './helpers';
import { audit } from './audit';

test('children log in on their own with a PIN on a device set up for them', async ({ page }) => {
  test.setTimeout(120_000);
  await signUpWithEmail(page, uniqueEmail('child'), 'Familie Kind');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lina');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);

  // the parent gives Lina a PIN of her own
  await page.goto('/profile');
  const pinCard = page.getByTestId('child-pin-settings');
  await pinCard.getByTestId('child-pin-set').click();
  await pinCard.getByLabel('Neue PIN (4 Ziffern)').first().pressSequentially('4711');
  await pinCard.getByLabel('PIN nochmals eingeben').first().pressSequentially('4711');
  await expect(pinCard).toContainText('Lina hat eine PIN');

  // … and sets up this device for the children: the parent is signed out
  await page.goto('/account');
  const devices = page.getByTestId('child-devices');
  await expect(devices).toContainText('Mit PIN: Lina');
  await audit(page);
  await devices.getByTestId('device-set-up').click();

  // «Wer spielt?»
  await expect(page.getByTestId('child-login')).toBeVisible();
  await audit(page);
  await page.getByTestId('child-Lina').click();
  await page.getByLabel('PIN von Lina').first().pressSequentially('0000');
  await expect(page.getByRole('alert')).toContainText('Die PIN stimmt nicht');
  await page.getByLabel('PIN von Lina').first().pressSequentially('4711');

  // Lina is in, in her own profile – without switching to another
  await expect(page.getByRole('heading', { name: /Lina/ }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Menü' }).click();
  await expect(page.getByRole('menuitem', { name: 'Profil wechseln' })).toHaveCount(0);
  // the account and the parent area belong to the parents: not here
  await expect(page.getByRole('menuitem', { name: 'Konto' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByText('Familie und Fortschritt')).toHaveCount(0);
  await page.goto('/account');
  await expect(page).toHaveURL(/\/$/);

  // signing out goes back to «Wer spielt?»; the parents can still sign in there
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByRole('menuitem', { name: 'Abmelden' }).click();
  await expect(page.getByTestId('logout-confirm')).toContainText('mit deiner PIN');
  await page.getByTestId('logout-confirm-go').click();
  await expect(page.getByTestId('child-login')).toBeVisible();
  await page.getByTestId('child-login-parent').click();
  await expect(page.getByRole('link', { name: 'Mit E-Mail-Code anmelden' })).toBeVisible();
});
