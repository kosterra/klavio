import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { LESSONS } from '@klavio/shared';
import { audit } from './audit';
import { seedCompletedLessons, signUpWithEmail, uniqueEmail, skipSetup } from './helpers';

const musicXml = fileURLToPath(new URL('./fixtures/mein-lied.musicxml', import.meta.url));

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
  await skipSetup(page);
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();

  // adults are invited to set a dream song
  await page.getByTestId('goal-prompt').getByRole('link', { name: 'Traumlied festlegen' }).click();
  // popular picks: the opening of a public-domain piece can be heard and seen on the staff
  await page.getByRole('button', { name: '«Für Elise» anhören' }).click();
  await expect(page.getByRole('button', { name: '«Für Elise» stoppen' })).toBeVisible();
  await page.getByRole('button', { name: 'Noten von «Für Elise»' }).click();
  const sheet = page.getByRole('dialog', { name: /Für Elise/ });
  await expect(sheet.getByTestId('snippet-staff')).toHaveCount(2); // 9 bars: 5 + 4
  await sheet.getByRole('button', { name: 'Anhören' }).click();
  await expect(sheet.getByRole('button', { name: 'Stopp' })).toBeVisible();
  await audit(page);
  await page.screenshot({
    path: `${process.env.E2E_SCREENSHOTS ?? 'test-results'}/goal-snippet-sheet.png`,
  });
  await sheet.getByRole('button', { name: 'Schliessen' }).click();
  await expect(sheet).toBeHidden();
  // a song under copyright stays a title
  await expect(page.getByRole('button', { name: '«Let It Be» anhören' })).toHaveCount(0);
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
  await expect(page.getByText('Traumlied gespeichert.').last()).toBeVisible();

  // own notes as the dream song: uploaded here, saved with the own pieces, linked from the card
  await page.getByTestId('goal-upload').locator('input[type=file]').setInputFiles(musicXml);
  await expect(page.getByTestId('goal-uploaded')).toContainText(
    '«Mein erstes Lied» ist hochgeladen',
  );
  await expect(titleInput).toHaveValue('Mein erstes Lied');
  await page.getByRole('button', { name: 'Traumlied speichern' }).click();
  await expect(page.getByText('Traumlied gespeichert.').last()).toBeVisible();
  await page.goto('/');
  await expect(page.getByTestId('goal-card')).toContainText('Mein erstes Lied');
  await page.getByTestId('goal-piece').click();
  await expect(page.getByRole('heading', { name: 'Mein erstes Lied' })).toBeVisible();
  // back to a catalogue title for the rest of the test
  await page.goto('/profile#goal');
  await titleInput.fill('Nothing Else Matters – Metallica');
  await page.getByRole('button', { name: 'Traumlied speichern' }).click();
  await expect(page.getByText('Traumlied gespeichert.').last()).toBeVisible();

  // dashboard card: 0 % at the start, the first lesson as the next step
  await page.goto('/');
  const card = page.getByTestId('goal-card');
  await expect(card).toContainText('Nothing Else Matters – Metallica');
  await expect(page.getByTestId('goal-percent')).toHaveText('0 %');
  // folded: only the title and the bar; unfolded (and remembered) the next step
  await expect(card.getByRole('link', { name: 'Wo ist das C?' })).toBeHidden();
  await card.getByTestId('goal-toggle').click();
  await expect(card.getByRole('link', { name: 'Wo ist das C?' })).toBeVisible();

  // after the first two chapters the first skills are reached
  await seedCompletedLessons(
    page,
    // up to the C major scale: the right hand is learned (the first goal skill reached)
    LESSONS.slice(0, LESSONS.findIndex((l) => l.id === 'hand-scale') + 1).map((l) => l.id),
  );
  await page.reload();
  await expect(page.getByTestId('goal-percent')).not.toHaveText('0 %');
  await expect(card).toContainText('Rechte Hand');
  await audit(page);
});
