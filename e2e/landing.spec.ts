import { expect, test } from '@playwright/test';
import { audit } from './audit';
import { signUpWithEmail, uniqueEmail } from './helpers';

test('landing page: sections, login card and easter eggs', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/welcome');
  await expect(page.getByRole('heading', { level: 1, name: /Klavier lernen/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Willkommen bei Klavio/ })).toBeVisible();
  for (const name of [
    'So funktioniert’s',
    'Was Klavio kann',
    '8 Welten warten auf dich',
    'Sicher und ehrlich',
    'Häufige Fragen',
  ]) {
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: 'Jetzt loslegen' }).first()).toHaveAttribute(
    'href',
    '/register',
  );
  await audit(page);

  // visitors can switch light / dark
  await page.getByRole('button', { name: /Farbschema/ }).click();
  await page.getByRole('menuitem', { name: 'Dunkel' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', 'dark');
  await page.getByRole('button', { name: /Farbschema/ }).click();
  await page.getByRole('menuitem', { name: 'Hell' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', 'light');

  const status = page.getByRole('status').filter({ hasText: /./ });

  // Konami code
  for (const k of [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
  ]) {
    await page.keyboard.press(k);
  }
  await expect(status).toContainText('Geheimcode geknackt');

  // «Alle meine Entchen» on the try-out keyboard
  const keyboard = page.getByRole('group', { name: 'Klaviatur' });
  for (const n of ['C4', 'D4', 'E4', 'F4', 'G4', 'G4']) {
    await keyboard.getByRole('button', { name: n, exact: true }).click();
  }
  await expect(status).toContainText('Alle meine Entchen');

  // tapping Klavi five times
  const klavi = page.getByRole('button', { name: 'Klavi, das Maskottchen' });
  for (let i = 0; i < 5; i++) await klavi.click();
  await expect(status).toContainText('Für Elise');
});

test('profile page: the own figure plays its tune after five taps', async ({ page }) => {
  await signUpWithEmail(page, uniqueEmail('egg'), 'Familie Ei');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Ole');
  await page.getByRole('radio', { name: 'Quaki, der Frosch' }).click();
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
  await page.goto('/profile');
  const figure = page.getByRole('button', { name: 'Quaki, deine Figur' });
  for (let i = 0; i < 5; i++) await figure.click();
  await expect(page.getByRole('status').filter({ hasText: /./ })).toContainText(
    'Quaki tanzt und spielt sein Lied',
  );
  await page.screenshot({
    path: `${process.env.E2E_SCREENSHOTS ?? 'test-results'}/egg-profile.png`,
  });
});

test('language: switch on the landing page, remembered on this device, also in the app menu', async ({
  page,
}) => {
  await page.goto('/welcome');
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Learn piano/ })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: /Learn piano/ })).toBeVisible();

  // link previews: description and image are in the page head
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /og-image\.jpg$/,
  );
  const image = await page.request.get('/og-image.jpg');
  expect(image.headers()['content-type']).toContain('image/jpeg');

  await page.getByRole('button', { name: 'Deutsch' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Klavier lernen/ })).toBeVisible();

  // in the app: the profile menu offers the languages too
  await signUpWithEmail(page, uniqueEmail('lang'), 'Familie Sprache');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Mia');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByRole('menuitem', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'Learning path' })).toBeVisible();
  await page.getByRole('menuitem', { name: 'Deutsch' }).click();
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
});
