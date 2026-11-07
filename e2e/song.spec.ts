import { expect, test, type Page } from '@playwright/test';
import { LESSONS } from '@klavio/shared';
import { seedCompletedLessons, signUpWithEmail, uniqueEmail, startLesson } from './helpers';
import { audit } from './audit';

const before = (id: string) =>
  LESSONS.slice(
    0,
    LESSONS.findIndex((l) => l.id === id),
  ).map((l) => l.id);
const shot = async (page: Page, name: string) => {
  if (process.env.E2E_SCREENSHOTS) {
    await page.screenshot({ path: `${process.env.E2E_SCREENSHOTS}/${name}.png`, fullPage: true });
  }
};

test('song mode waits for every note; "listen" plays the song first', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await signUpWithEmail(page, uniqueEmail('song'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Mia');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
  await seedCompletedLessons(page, before('hand-entchen'));
  await page.reload();

  // finished chapter 1 is collapsed, the current chapter 2 open; chapter 1 opens on tap
  const ch1 = page.getByTestId('chapter-keys');
  await expect(ch1).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('chapter-hand')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('chapter-read')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('path-keys-c')).toBeHidden();
  await audit(page); // collapsed banners ("Geschafft!", locked chapters)
  await ch1.click();
  await expect(ch1).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('path-keys-c')).toBeVisible();
  await audit(page);
  // …and closes again (the open board must not cover its own heading)
  await ch1.click();
  await expect(ch1).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('path-keys-c')).toBeHidden();

  await page.getByTestId('path-hand-entchen').click();
  await startLesson(page);
  const staff = page.getByRole('img', { name: /Noten des Lieds, Zeile 1 von 3/ });
  await expect(staff.locator('svg')).toBeVisible();
  await audit(page);
  await shot(page, 'song-entchen');

  // listen: the status changes while it plays, notes are ignored meanwhile
  await page.getByRole('button', { name: 'Anhören' }).click();
  await expect(page.getByText('Hör gut zu …')).toBeVisible();
  await page.getByRole('button', { name: 'C4', exact: true }).click();
  await page.getByRole('button', { name: 'Stopp' }).click();
  await expect(page.getByTestId('song-status')).toHaveText('Ton 1 von 27');

  // a wrong note is counted, the song waits
  await page.getByRole('button', { name: 'H4', exact: true }).click();
  await expect(page.getByTestId('song-status')).toHaveText(/Das war H/);

  const summary = page.getByRole('button', { name: 'Zum Lernpfad' });
  const next = page.getByTestId('next-note');
  while (!(await summary.isVisible())) {
    const text = (await next.allTextContents())[0] ?? '';
    const note = /Nächster Ton: (\S+)/.exec(text)?.[1];
    if (!note) {
      await page.waitForTimeout(100);
      continue;
    }
    const status = (await page.getByTestId('song-status').allTextContents())[0];
    await page.getByRole('button', { name: `${note}4`, exact: true }).click();
    await expect(
      summary.or(page.getByTestId('song-status').filter({ hasNotText: status })),
    ).toBeVisible();
  }
  await expect(page.getByRole('heading', { name: 'Perfekt!' })).toBeVisible(); // 27 / 28 → 3 stars

  // the line moved on while playing: a later song shows dotted notes and eighths
  await seedCompletedLessons(page, ['song-haenschen']);
  await page.goto('/lesson/song-freude');
  await startLesson(page);
  await expect(page.getByRole('img', { name: /Noten des Lieds/ }).locator('svg')).toBeVisible();
  await shot(page, 'song-freude');
  await audit(page);
});
