import { expect, test, type Page } from '@playwright/test';
import { grantAdmin, loginWithEmail, logout, signUpWithEmail, uniqueEmail } from './helpers';

async function setRegistrationOpen(page: Page, open: boolean) {
  await page.goto('/admin');
  const toggle = page.getByRole('switch', { name: 'Registrierung neuer Konten erlauben' });
  await expect(toggle).toBeEnabled();
  if ((await toggle.isChecked()) !== open) await toggle.click({ force: true });
  await expect(toggle).toBeChecked({ checked: open });
}

test('admin closes registration; existing accounts can still log in', async ({ browser }) => {
  // --- admin signs up via e-mail and is promoted
  const admin = await (await browser.newContext()).newPage();
  const adminEmail = uniqueEmail('admin');
  await signUpWithEmail(admin, adminEmail, 'Admin');
  grantAdmin(adminEmail);

  // --- a regular user exists before registration is closed
  const user = await (await browser.newContext()).newPage();
  const userEmail = uniqueEmail('user');
  const userCode = await signUpWithEmail(user, userEmail, 'Eva');
  await logout(user);

  try {
    await setRegistrationOpen(admin, false);

    // --- sign-up is no longer offered
    const anon = await (await browser.newContext()).newPage();
    await anon.goto('/welcome');
    await expect(anon.getByText('Neue Konten können zurzeit nicht erstellt werden.')).toBeVisible();
    await expect(anon.getByRole('link', { name: 'Konto erstellen' })).toHaveCount(0);
    await anon.goto('/register');
    await expect(anon.getByRole('button', { name: 'Code senden' })).toBeDisabled();

    // --- the existing user still gets in with an e-mail code
    await loginWithEmail(user, userEmail, userCode);
  } finally {
    await setRegistrationOpen(admin, true);
  }

  const anon = await (await browser.newContext()).newPage();
  await anon.goto('/welcome');
  await expect(anon.getByRole('link', { name: 'Konto erstellen' })).toBeVisible();
});
