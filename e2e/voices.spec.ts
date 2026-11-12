import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { grantAdmin, logout, signUpWithEmail, uniqueEmail } from './helpers';
import { audit } from './audit';

test('a family’s words reach the start page only with consent and approval', async ({ page }) => {
  test.setTimeout(90_000);
  const email = uniqueEmail('voices');
  await signUpWithEmail(page, email, 'Familie');
  await page.goto('/account');
  const card = page.getByTestId('testimonial');
  const words = `Unsere Kinder üben jetzt gern – ${Date.now()}`;
  await card.getByLabel('Deine Worte', { exact: true }).fill(words);
  await card.getByLabel('Unterschrift', { exact: true }).fill('Andrea');
  await card.getByLabel('Wer du bist (freiwillig)').fill('Mutter von zwei Kindern');
  // without consent nothing is sent
  await expect(card.getByRole('button', { name: 'Abschicken' })).toBeDisabled();
  await card.getByLabel(/Ich bin einverstanden/).check();
  await card.getByRole('button', { name: 'Abschicken' }).click();
  await expect(card).toContainText('Wird gelesen');
  await audit(page);

  // the operator reads and approves
  grantAdmin(email);
  await page.goto('/admin');
  const admin = page.getByTestId('admin-testimonials');
  const entry = admin.locator('.mantine-Card-root', { hasText: words });
  await entry.getByRole('button', { name: 'Freigeben' }).click();
  await expect(entry).toContainText('Veröffentlicht');

  // now on the public page
  await logout(page);
  await expect(page.getByTestId('voices')).toContainText(words);
  await expect(page.getByTestId('voices')).toContainText('Andrea, Mutter von zwei Kindern');
  await audit(page);
});

// the test's words are not a real family's: they never stay on the page
test.afterEach(() => {
  execFileSync('docker', [
    'compose',
    'exec',
    '-T',
    'mongo',
    'mongosh',
    'klavio',
    '--quiet',
    '--eval',
    'db.testimonials.deleteMany({ text: /^Unsere Kinder üben jetzt gern – \\d+$/ })',
  ]);
});
