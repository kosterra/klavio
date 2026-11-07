import { expect, test } from '@playwright/test';
import {
  addVirtualAuthenticator,
  loginWithEmail,
  logout,
  signUpWithEmail,
  uniqueEmail,
} from './helpers';

test('sign up with e-mail, add a passkey in the account, then log in with it', async ({
  page,
  context,
}) => {
  await addVirtualAuthenticator(context, page);
  const email = uniqueEmail('passkey');

  // --- passkey-first registration is gone; the account starts with e-mail only
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Willkommen bei Klavio/ })).toBeVisible();
  const signUpCode = await signUpWithEmail(page, email, 'Familie E2E');

  // --- the profile picker suggests setting up a passkey
  await expect(page.getByText(/Richte einen Passkey ein/)).toBeVisible();

  // --- first profile
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lina');
  await page.getByRole('radio', { name: 'Eule' }).click();
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo Lina!' })).toBeVisible();
  await expect(page.getByText('Was du spielst, bleibt auf deinem Gerät.')).toBeVisible();

  // --- add a passkey under "Konto"
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByRole('menuitem', { name: 'Konto' }).click();
  await expect(page.getByText('Noch kein Passkey eingerichtet.')).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  await page.getByRole('button', { name: 'Passkey hinzufügen' }).click();
  await expect(page.getByRole('button', { name: /^Löschen:/ })).toHaveCount(1);
  await expect(page.getByText('Noch kein Passkey eingerichtet.')).toHaveCount(0);

  // --- passkey login (discoverable credential, no username)
  await logout(page);
  await page.getByRole('button', { name: 'Mit Passkey anmelden' }).click();
  await expect(page.getByRole('heading', { name: 'Wer spielt heute?' })).toBeVisible();
  await expect(page.getByText(/Richte einen Passkey ein/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Lina' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo Lina!' })).toBeVisible();

  // --- e-mail code login keeps working as the fallback
  await logout(page);
  await loginWithEmail(page, email, signUpCode);
  await page.getByRole('button', { name: 'Lina' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo Lina!' })).toBeVisible();
});
