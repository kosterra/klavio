import { expect, test } from '@playwright/test';
import { LESSONS } from '@klavio/shared';
import { audit } from './audit';
import {
  seedCompletedLessons,
  signUpWithEmail,
  skipSetup,
  skipTheory,
  uniqueEmail,
} from './helpers';

test('Klavi explains in the exercise, the hand lies on the keys, songs and lesson types', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await signUpWithEmail(page, uniqueEmail('guide'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lou');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);

  // --- the learning path: the symbols explained, the type in each label
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
  await page.getByTestId('path-legend').getByText('Was bedeuten die Zeichen?').click();
  await expect(page.getByTestId('path-legend')).toContainText('Hören');
  await expect(page.getByTestId('path-keys-c')).toHaveAttribute(
    'aria-label',
    /Tasten finden: Wo ist das C/,
  );

  // --- Klavi's sentence in the first exercise – it stays, nothing jumps while playing
  await page.getByTestId('path-keys-c').click();
  await skipTheory(page);
  const screen = page.getByTestId('lesson-start-screen');
  await ((await screen.isVisible()) ? screen : page.getByTestId('lesson-start')).click();
  await expect(page.getByTestId('coach-tip')).toContainText('zwei schwarzen Tasten');
  await audit(page);
  await page.getByRole('button', { name: 'C4', exact: true }).click();
  await expect(page.getByText('Aufgabe 2 von 5')).toBeVisible();
  await expect(page.getByTestId('coach-tip')).toBeVisible();

  // --- a five-finger lesson shows the hand on the keys
  const idx = LESSONS.findIndex((l) => l.id === 'song-freude');
  await seedCompletedLessons(
    page,
    LESSONS.slice(0, idx)
      .filter((l) => !l.bonus)
      .map((l) => l.id),
  );
  await page.goto('/lesson/keys-five');
  await skipTheory(page);
  await expect(page.getByText('So liegt deine Hand')).toBeVisible();
  await expect(page.getByRole('img', { name: /^Rechte Hand: Finger 1 auf C/ })).toBeVisible();
  await audit(page);

  // --- «Lieder»: open songs to play again, the others with their chapter
  await page.goto('/songs');
  await expect(page.getByRole('heading', { name: 'Lieder', level: 1 })).toBeVisible();
  await expect(page.getByTestId('song-song-haenschen')).toHaveAccessibleName(/Hänschen/);
  await expect(page.getByTestId('song-bass-lamb')).toContainText('Kommt in Kapitel');
  await audit(page);
  await page.getByTestId('song-song-haenschen').click();
  await expect(page).toHaveURL(/\/lesson\/song-haenschen$/);
});
