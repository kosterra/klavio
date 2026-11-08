import { expect, test } from '@playwright/test';
import { LESSONS } from '@klavio/shared';
import { audit } from './audit';
import { seedCompletedLessons, signUpWithEmail, uniqueEmail } from './helpers';

test('dream song: set it in the profile, see progress and the next step on the dashboard', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await signUpWithEmail(page, uniqueEmail('goal'), 'Ralph');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Ralph');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('1990');
  await page.getByTestId('profile-more').click();
  await page.getByRole('dialog').getByText('Classic', { exact: true }).click();
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();

  // adults are invited to set a dream song
  await page.getByTestId('goal-prompt').getByRole('link', { name: 'Traumlied festlegen' }).click();
  const titleInput = page.getByRole('combobox', { name: 'Titel' });
  // a typo is recognised and can be corrected with one tap
  await titleInput.fill('Nothing Else Matter');
  await expect(page.getByTestId('goal-recognized')).toContainText(
    'Meinst du «Nothing Else Matters»',
  );
  await page.getByRole('button', { name: 'Titel übernehmen' }).click();
  await expect(titleInput).toHaveValue('Nothing Else Matters – Metallica');
  // the dropdown suggests songs while typing
  await titleInput.fill('metall');
  await page.getByRole('option', { name: /Nothing Else Matters/ }).click();
  await expect(titleInput).toHaveValue('Nothing Else Matters – Metallica');
  // recognised from the built-in song list: minor, 6/8, broken chords, pedal
  await expect(page.getByTestId('goal-recognized')).toContainText('von Metallica');
  await expect(page.getByRole('checkbox', { name: /Pedal/ })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /Sechsachteltakt/ })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /Improvisieren/ })).not.toBeChecked();
  await audit(page);
  await page.getByRole('button', { name: 'Traumlied speichern' }).click();
  await expect(page.getByText('Traumlied gespeichert.')).toBeVisible();

  // dashboard card: 0 % at the start, the first lesson as the next step
  await page.goto('/');
  const card = page.getByTestId('goal-card');
  await expect(card).toContainText('Nothing Else Matters – Metallica');
  await expect(page.getByTestId('goal-percent')).toHaveText('0 %');
  await expect(card.getByRole('link', { name: 'Wo ist das C?' })).toBeVisible();

  // after the first two chapters the first skills are reached
  await seedCompletedLessons(
    page,
    LESSONS.slice(0, 10).map((l) => l.id),
  );
  await page.reload();
  await expect(page.getByTestId('goal-percent')).not.toHaveText('0 %');
  await expect(card).toContainText('Rechte Hand');
  await audit(page);
});
