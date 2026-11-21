import { expect, test, type Page } from '@playwright/test';
import { LESSONS, type ListenExercise } from '@klavio/shared';
import { audit } from './audit';
import { seedCompletedLessons, signUpWithEmail, skipSetup, uniqueEmail } from './helpers';

async function learnerBefore(page: Page, tag: string, lessonId: string) {
  await signUpWithEmail(page, uniqueEmail(tag), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Mia');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
  const ids = LESSONS.map((l) => l.id);
  await seedCompletedLessons(page, ids.slice(0, ids.indexOf(lessonId)));
  await page.goto(`/lesson/${lessonId}`);
}

test('«Unter dem C»: ledger lines below middle C', async ({ page }) => {
  test.setTimeout(90_000);
  await learnerBefore(page, 'belowc', 'read-below-c');
  const next = page.getByTestId('theory-next');
  await expect(page.getByTestId('theory-text')).toContainText('Hilfslinie des C');
  await next.click();
  await expect(page.getByRole('img', { name: /G3/ })).toBeVisible();
  await next.click();
  await page.getByRole('button', { name: 'H', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('zweite geht mitten');
  await page.getByRole('button', { name: 'A', exact: true }).click();
  await audit(page);
  await next.click();
  await expect(page.getByRole('heading', { name: 'Unter dem C: H, A, G' })).toBeVisible();
});

test('«Kurz und gebunden»: hear staccato and legato', async ({ page }) => {
  test.setTimeout(120_000);
  await learnerBefore(page, 'staccato', 'expr-staccato');
  const next = page.getByTestId('theory-next');
  await expect(page.getByTestId('theory-text')).toContainText('staccato');
  await next.click();
  // the theory game: two rounds (in any order) – try both answers until it is done
  for (let i = 0; i < 6 && (await next.isDisabled()); i++) {
    const name = i % 2 ? 'Gebunden' : 'Kurz';
    await page.getByRole('button', { name, exact: true }).click();
    await page.waitForTimeout(1200);
  }
  await next.click();
  await page.getByTestId('lesson-start-screen').click();
  const box = page.getByTestId('listen');
  const exercise = LESSONS.find((l) => l.id === 'expr-staccato')!.exercises[0] as ListenExercise;
  for (const [i, round] of exercise.rounds.entries()) {
    await expect(box).toHaveAttribute('data-round', String(i));
    await page.getByTestId(`listen-answer-${round.answer}`).click();
  }
  await audit(page);
  // then the play-along part
  await expect(page.getByRole('button', { name: 'C4', exact: true })).toBeVisible({
    timeout: 10_000,
  });
});
