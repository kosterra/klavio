import { expect, test } from '@playwright/test';
import { signUpWithEmail, skipSetup, uniqueEmail } from './helpers';
import { audit } from './audit';

test('the reminder setting shows up when the instance has a push key', async ({ page }) => {
  test.setTimeout(90_000);
  // an instance with reminders switched on (the dev server may have no key)
  await page.route('**/api/config', async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    await route.fulfill({ response: res, json: { ...body, pushPublicKey: 'B'.repeat(87) } });
  });
  await signUpWithEmail(page, uniqueEmail('reminder'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lina');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2017');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await page.goto('/profile');
  const card = page.getByTestId('reminder');
  await expect(card.getByRole('heading', { name: 'Erinnerung' })).toBeVisible();
  // the development server has no service worker: the card says why it cannot remind
  await expect(card.getByTestId('reminder-unsupported')).toBeVisible({ timeout: 10_000 });
  await audit(page);
});
