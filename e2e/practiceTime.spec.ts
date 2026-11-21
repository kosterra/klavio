import { expect, test } from '@playwright/test';
import { signUpWithEmail, skipSetup, uniqueEmail } from './helpers';

test('free play counts for the daily goal (kept on the device, then on the server)', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await signUpWithEmail(page, uniqueEmail('practicetime'), 'Familie Zeit');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Ivo');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await expect(page.getByText('0 von 10 Minuten heute')).toBeVisible();

  await page.goto('/play');
  await page.getByTestId('free-show-keys').click();
  // a little more than a minute of playing: a key every 15 seconds
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: 'E4', exact: true }).click();
    await page.waitForTimeout(15_000);
  }
  await page.goBack(); // within the app: the page closes, its time is kept
  await expect(page.getByText('1 von 10 Minuten heute')).toBeVisible();
  // sent: the server knows it too
  await page.reload();
  await expect(page.getByText('1 von 10 Minuten heute')).toBeVisible();
});
