import { expect, test, type Page } from '@playwright/test';

async function addVirtualAuthenticator(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

test('register with passkey, create profile, log out and back in', async ({ page }) => {
  await addVirtualAuthenticator(page);
  const name = `Familie E2E ${Date.now()}`;

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Willkommen bei Klavio/ })).toBeVisible();

  // --- register
  await page.getByRole('button', { name: 'Neues Konto' }).click();
  await page.getByLabel('Wie heisst du?').fill(name);
  await page.getByRole('button', { name: 'Passkey erstellen' }).click();

  // --- recovery codes shown once
  await expect(page.getByRole('heading', { name: 'Deine Wiederherstellungscodes' })).toBeVisible();
  const codes = await page.getByRole('listitem').allTextContents();
  expect(codes).toHaveLength(8);
  await page.getByRole('button', { name: 'Ich habe die Codes gesichert' }).click();

  // --- first profile
  await expect(page.getByRole('heading', { name: 'Wer spielt heute?' })).toBeVisible();
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lina');
  await page.getByRole('radio', { name: 'Eule' }).click();
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo Lina!' })).toBeVisible();
  await expect(page.getByText('Was du spielst, bleibt auf deinem Gerät.')).toBeVisible();

  // --- logout
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByRole('menuitem', { name: 'Abmelden' }).click();
  await expect(page.getByRole('heading', { name: /Willkommen bei Klavio/ })).toBeVisible();

  // --- passkey login (discoverable credential, no username)
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Wer spielt heute?' })).toBeVisible();
  await page.getByRole('button', { name: 'Lina' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo Lina!' })).toBeVisible();

  // --- account page lists the passkey
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByRole('menuitem', { name: 'Konto' }).click();
  await expect(page.getByRole('heading', { name: 'Passkeys' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Löschen:/ })).toHaveCount(1);
  await expect(page.getByText('Noch 8 unbenutzte Codes.')).toBeVisible();

  // --- recovery code login works once
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByRole('menuitem', { name: 'Abmelden' }).click();
  await page.getByRole('link', { name: 'Wiederherstellungscode verwenden' }).click();
  await page.getByLabel(/Code/).fill(codes[0]!);
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByText('Noch 7 unbenutzte Codes.')).toBeVisible();
});
