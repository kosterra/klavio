import { expect, test, type Page } from '@playwright/test';
import { LESSONS } from '@klavio/shared';
import { audit } from './audit';
import {
  seedCompletedLessons,
  signUpWithEmail,
  startLesson,
  uniqueEmail,
  skipSetup,
} from './helpers';

const ids = LESSONS.map((l) => l.id);

async function learner(page: Page, name: string) {
  await signUpWithEmail(page, uniqueEmail(name), 'Familie Stufe');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Ada');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
}

test('level 2: own map, piece for both hands on the grand staff', async ({ page }) => {
  test.setTimeout(120_000);
  await learner(page, 'stage2');
  await seedCompletedLessons(page, ids.slice(0, ids.indexOf('both-entchen')));
  await page.reload();

  // the map of level 2 is shown, level 1 is one click away
  const levels = page.getByTestId('stage-switch');
  await expect(levels.getByRole('radio', { name: 'Stufe 2 · Beide Hände' })).toBeChecked();
  await expect(page.getByTestId('chapter-both')).toBeVisible();
  await expect(page.getByTestId('chapter-keys')).toHaveCount(0);
  await audit(page);
  await levels.getByText('Stufe 1 · Erste Schritte').click();
  await expect(page.getByTestId('chapter-keys')).toBeVisible();
  await page.getByTestId('next-stage').click();
  await expect(page.getByTestId('chapter-bass')).toBeVisible();

  // piece: the first step needs the low C (left) and middle C (right)
  await page.getByTestId('path-both-entchen').click();
  await startLesson(page);
  const status = page.getByTestId('piece-status');
  await expect(status).toHaveText('Ton 1 von 27');
  const keys = page.getByRole('group', { name: 'Klaviatur' });
  await keys.getByRole('button', { name: 'C3', exact: true }).click();
  await expect(status).toHaveText('Ton 1 von 27'); // the right hand is still missing
  await keys.getByRole('button', { name: 'C4', exact: true }).click();
  await expect(status).toHaveText('Ton 2 von 27');
  // a wrong note is shown, the step stays
  await keys.getByRole('button', { name: 'G4', exact: true }).click();
  await expect(status).toContainText('Das war G');
  await keys.getByRole('button', { name: 'D4', exact: true }).click();
  await expect(status).toHaveText('Ton 3 von 27');
  await audit(page);
});

test('level 2: improvising on the black keys – no wrong notes', async ({ page }) => {
  test.setTimeout(120_000);
  await learner(page, 'improvise');
  await seedCompletedLessons(page, ids.slice(0, ids.indexOf('black-improvise')));
  await page.goto('/lesson/black-improvise');
  await startLesson(page);
  await page.getByRole('button', { name: 'Los geht’s', exact: true }).click();
  const keys = page.getByRole('group', { name: 'Klaviatur' });
  // a white key only gets a nudge
  await keys.getByRole('button', { name: 'C4', exact: true }).click();
  await expect(page.getByText('Probier die schwarzen Tasten!')).toBeVisible();
  for (let i = 0; i < 14; i++) {
    const black = ['Cis4', 'Dis4', 'Fis4', 'Gis4', 'Ais4'][i % 5]!;
    await keys.getByRole('button', { name: black, exact: true }).click();
  }
  await expect(page.getByTestId('improvise-count')).toContainText('14 Sterne');
  // 8 bars at 88 bpm ≈ 22 s, then the lesson is done – with three stars
  await expect(page.getByRole('heading', { name: 'Perfekt!' })).toBeVisible({ timeout: 40_000 });
});
