import { expect, test } from '@playwright/test';
import { audit } from './audit';
import { seedCompletedLessons, signUpWithEmail, skipSetup, uniqueEmail } from './helpers';

test('parent area: start the path again from the first missing lesson', async ({ page }) => {
  await signUpWithEmail(page, uniqueEmail('reset'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lina');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await page.getByRole('heading', { name: 'Hallo Lina!' }).waitFor();
  // «D und E» is missing – as after a new lesson was put before the furthest one
  await seedCompletedLessons(page, ['keys-c', 'keys-middle-c', 'keys-cde', 'keys-f-g']);

  await page.goto('/profile');
  const reset = page.getByTestId('reset-path');
  await expect(reset.getByText(/fehlen Lektionen/)).toBeVisible();
  // the first gap is chosen already
  await expect(reset.getByRole('combobox', { name: 'Ab Lektion oder Kapitel' })).toHaveValue(
    'D und E (fehlt)',
  );
  await audit(page);
  page.once('dialog', (d) => void d.accept());
  await reset.getByRole('button', { name: 'Zurücksetzen' }).click();
  await expect(
    page.getByText('Zurückgesetzt – der Lernpfad geht jetzt dort weiter.'),
  ).toBeVisible();

  const lessons = await page.evaluate(async () => {
    const date = new Date().toLocaleDateString('sv');
    return Object.keys((await (await fetch(`/api/progress?date=${date}`)).json()).lessons).sort();
  });
  expect(lessons).toEqual(['keys-c', 'keys-middle-c']);
});
