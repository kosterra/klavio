import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { LESSONS, addDays, localIsoDate } from '@klavio/shared';
import { audit } from './audit';
import { seedCompletedLessons, signUpWithEmail, uniqueEmail } from './helpers';

test('lessons come back for review; quick round mixes old questions', async ({ page }) => {
  test.setTimeout(90_000);
  await signUpWithEmail(page, uniqueEmail('review'), 'Familie Repetition');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Tim');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();

  const played = LESSONS.slice(0, 3).map((l) => l.id);
  await seedCompletedLessons(page, played);
  const profileId = await page.evaluate(
    async () => (await (await fetch('/api/auth/me')).json()).activeProfileId as string,
  );
  // the first two were played 10 days ago (step 1 = due after 3 days), the third today
  const today = localIsoDate();
  execFileSync('docker', [
    'compose',
    'exec',
    '-T',
    'mongo',
    'mongosh',
    'klavio',
    '--quiet',
    '--eval',
    `db.lessonprogresses.updateMany({ profileId: ObjectId("${profileId}") }, { $set: { lastLocalDate: "${addDays(today, -10)}", reviewBox: 1 } });
     db.lessonprogresses.updateOne({ profileId: ObjectId("${profileId}"), lessonId: "${played[2]}" }, { $set: { lastLocalDate: "${today}" } })`,
  ]);
  await page.reload();

  // dashboard: the two due lessons, the oldest material first
  const card = page.getByTestId('review-card');
  await expect(card).toContainText('Heute wiederholen');
  await expect(card).toContainText('vor 10 Tagen gespielt');
  await expect(page.getByTestId(`review-${played[0]}`)).toBeVisible();
  await expect(page.getByTestId(`review-${played[1]}`)).toBeVisible();
  await expect(page.getByTestId(`review-${played[2]}`)).toHaveCount(0);

  // path: badges on the due stones and a note in the chapter heading
  const chapter = page.getByTestId('chapter-keys');
  if ((await chapter.getAttribute('aria-expanded')) === 'false') await chapter.click();
  await expect(page.getByTestId(`due-${played[0]}`)).toBeVisible();
  await expect(page.getByTestId(`due-${played[2]}`)).toHaveCount(0);
  await expect(page.getByTestId('chapter-keys')).toContainText('2 zum Wiederholen');
  await expect(page.getByTestId(`path-${played[0]}`)).toHaveAccessibleName(/zum Wiederholen/);
  await audit(page);

  // the review button opens the lesson (start card: it was played before)
  await page.getByTestId(`review-${played[0]}`).click();
  await expect(page.getByRole('button', { name: 'Los geht’s!' })).toBeVisible();

  // quick round
  await page.goto('/');
  await page.getByTestId('quick-round').click();
  await expect(page.getByText('Schnelle Runde', { exact: true })).toBeVisible();
  await expect(page.getByTestId('theory-text')).toBeVisible();
  await audit(page);
  await page.getByRole('button', { name: 'Beenden', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Super, schnelle Runde geschafft!' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Zum Lernpfad' }).click();
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
});
