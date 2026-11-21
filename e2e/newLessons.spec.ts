import { expect, test, type Page } from '@playwright/test';
import { LESSONS, type ListenExercise } from '@klavio/shared';
import { audit } from './audit';
import {
  playTimedSong,
  seedCompletedLessons,
  signUpWithEmail,
  skipSetup,
  startLesson,
  uniqueEmail,
} from './helpers';

async function learnerBefore(page: Page, tag: string, lessonId: string) {
  await signUpWithEmail(page, uniqueEmail(tag), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Mia');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
  const ids = LESSONS.map((l) => l.id);
  const before = ids.slice(0, ids.indexOf(lessonId));
  if (before.length) await seedCompletedLessons(page, before);
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

test('«Hänsel und Gretel»: a song with rests, waiting and in time', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await learnerBefore(page, 'haensel', 'song-haensel');
  await startLesson(page);
  await expect(
    page
      .getByRole('img', { name: /Noten des Lieds/ })
      .first()
      .locator('svg'),
  ).toBeVisible();
  await audit(page);
  const summary = page.getByRole('button', { name: 'Zum Lernpfad' });
  const next = page.getByTestId('next-note');
  const timed = page.getByTestId('timed-song');
  while (!(await summary.isVisible()) && !(await timed.isVisible())) {
    const text = (await next.allTextContents())[0] ?? '';
    const note = /Nächster Ton: (\S+)/.exec(text)?.[1];
    if (!note) {
      await page.waitForTimeout(100);
      continue;
    }
    const status = (await page.getByTestId('song-status').allTextContents())[0];
    await page.getByRole('button', { name: `${note}4`, exact: true }).click();
    await expect(
      summary.or(timed).or(page.getByTestId('song-status').filter({ hasNotText: status })),
    ).toBeVisible();
  }
  // in time: the rests are not played, only the 46 notes count
  expect(await playTimedSong(page)).toContain('46 von 46 Tönen im Takt');
});

test('grown-ups: «Kann ich schon» skips a chapter; texts without children’s pictures', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await signUpWithEmail(page, uniqueEmail('adultskip'), 'Ralph');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Ralph');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('1990');
  await page.getByTestId('profile-more').click();
  await page.getByRole('dialog').getByText('Classic', { exact: true }).click();
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await page.goto('/lesson/keys-c');
  await expect(page.getByTestId('skip-offer')).toBeVisible();
  await audit(page);
  await page.getByTestId('skip-check').click();
  const next = page.getByTestId('theory-next');
  for (const [i, answer] of ['C', 'F', '3', 'Die Halbe'].entries()) {
    if (i) await next.click();
    await page.getByRole('button', { name: answer, exact: true }).click();
  }
  await next.click();
  await expect(page.getByText('Super, das kannst du schon!')).toBeVisible();
  await expect(page).toHaveURL(/\/lesson\/hand-a-h$/);
  // the D without «the little house»
  await page.goto('/lesson/keys-d-e');
  await page.getByTestId('theory-again').click();
  await expect(page.getByTestId('theory-text')).toContainText('der Zweiergruppe');
});

test('children see no check at the very start', async ({ page }) => {
  await learnerBefore(page, 'kidnocheck', 'keys-c');
  await expect(page.getByTestId('theory-text')).toBeVisible();
  await expect(page.getByTestId('skip-offer')).toHaveCount(0);
});
