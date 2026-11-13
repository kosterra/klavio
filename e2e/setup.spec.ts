import { expect, test } from '@playwright/test';
import { CURRICULUM } from '@klavio/shared';
import { audit } from './audit';
import { signUpWithEmail, skipTheory, uniqueEmail } from './helpers';

test('a new profile starts with a few questions: instrument, goal, dream song, week and level', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await signUpWithEmail(page, uniqueEmail('setup'), 'Vera');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Vera');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('1985');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();

  // --- where the learner plays
  await expect(page.getByTestId('setup')).toBeVisible();
  await expect(page.getByText('Hallo Vera!')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Worauf spielst du?' })).toBeVisible();
  await audit(page);
  await page.getByTestId('setup-instrument-none').click();

  // --- why
  await expect(page.getByRole('heading', { name: 'Was möchtest du am liebsten?' })).toBeVisible();
  await page.getByTestId('setup-motive-songs').click();

  // --- dream song: picked with one tap, with the skills it needs
  await expect(page.getByTestId('goal-picks')).toBeVisible();
  // the pick itself (its name starts with the title; «anhören» and «Noten» are buttons of their own)
  const elise = page.getByRole('button', { name: /^Für Elise/ });
  await expect(elise).toContainText('Braucht 15 Fähigkeiten');
  await elise.click();
  await expect(elise).toHaveAttribute('aria-pressed', 'true');
  await audit(page);
  await page.getByTestId('setup-next').click();

  // --- weekly goal
  await page.getByTestId('setup-week-4').click();

  // --- level: two extracts yes, the third not yet
  await expect(page.getByTestId('setup-level')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Notenbeispiel' })).toBeVisible();
  await expect(page.getByTestId('setup-level').locator('svg .vf-stavenote').first()).toBeVisible();
  await audit(page);
  await page.getByTestId('setup-level-yes').click();
  await page.getByTestId('setup-level-yes').click();
  await page.getByTestId('setup-level-no').click();

  // --- summary
  const both = CURRICULUM.findIndex((c) => c.id === 'both');
  await expect(page.getByTestId('setup-start-chapter')).toContainText(`Kapitel ${both + 1}`);
  await expect(page.getByText('Dein Traumlied: «Für Elise»')).toBeVisible();
  await expect(page.getByText('Dein Wochenziel: 4 Tage')).toBeVisible();
  await audit(page);
  await page.getByTestId('setup-finish').click();

  // --- the dashboard: dream song, the week, the chapters before are passed
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
  await expect(page.getByTestId('goal-card')).toContainText('Für Elise');
  await expect(page.getByTestId('week-goal')).toBeVisible();
  await expect(page.getByText('0 von 4 Tagen diese Woche')).toBeVisible();
  const firstOfBoth = CURRICULUM[both]!.lessons.find((l) => !l.bonus)!;
  await expect(page.getByTestId(`path-${firstOfBoth.id}`)).toHaveAttribute('aria-current', 'step');
  await audit(page);

  // --- the weekly goal can be changed in «Mein Profil»
  await page.goto('/profile');
  await page.getByTestId('weekly-goal').getByText('2 Tage').click();
  await expect(
    page.getByTestId('weekly-goal').getByRole('radio', { name: '2 Tage' }),
  ).toBeChecked();
  await page.goto('/');
  await expect(page.getByText('0 von 2 Tagen diese Woche')).toBeVisible();

  // --- and where the learner plays: «no piano» in the questions, the piano from now on
  await page.goto('/profile');
  const playOn = page.getByTestId('play-on');
  await expect(playOn.getByRole('radio', { name: 'Auf dem Bildschirm' })).toBeChecked();
  await playOn.getByText('Auf meinem Klavier').click();
  await expect(playOn.getByRole('radio', { name: 'Auf meinem Klavier' })).toBeChecked();
  await page.goto(`/lesson/${firstOfBoth.id}`);
  await skipTheory(page);
  await expect(page.getByTestId('lesson-start')).toContainText('auf meinem Klavier');
});
