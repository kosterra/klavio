import { expect, test, type Page } from '@playwright/test';
import { LESSONS } from '@klavio/shared';
import { seedCompletedLessons, signUpWithEmail, uniqueEmail, startLesson } from './helpers';
import { audit } from './audit';

/**
 * Taps the on-screen key C4 at the given beats of the bar to play — scheduled
 * inside the page on the same clock the app uses for scoring.
 */
async function playBar(page: Page, beats: number[]) {
  await page.getByRole('button', { name: /^(Los|Nochmals)$/ }).click();
  const rhythm = page.getByTestId('rhythm');
  await expect(rhythm).toHaveAttribute('data-play-start', /\d/);
  await rhythm.evaluate((el, beats) => {
    const start = Number(el.dataset.playStart);
    const beatMs = Number(el.dataset.beatMs);
    const key = document.querySelector<HTMLButtonElement>('button[aria-label="C4"]')!;
    for (const b of beats) {
      setTimeout(
        () => {
          key.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
          setTimeout(() => key.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })), 80);
        },
        start + b * beatMs - performance.now(),
      );
    }
  }, beats);
  await expect(page.getByTestId('rhythm-result')).toBeVisible({ timeout: 15_000 });
}

test('rhythm: count-in, play in time, retry counts as practice', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await signUpWithEmail(page, uniqueEmail('rhythm'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Leo');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
  const idx = LESSONS.findIndex((l) => l.id === 'rhythm-quarters');
  await seedCompletedLessons(
    page,
    LESSONS.slice(0, idx).map((l) => l.id),
  );
  await page.goto('/lesson/rhythm-quarters');
  await startLesson(page);
  await expect(page.getByRole('img', { name: 'Rhythmus 1 von 5' }).locator('svg')).toBeVisible();
  await audit(page);

  // 1: q q q q — perfect, moves on by itself
  await playBar(page, [0, 1, 2, 3]);
  await expect(page.getByText('Super im Takt!')).toBeVisible();
  await expect(page.getByText('Teil 2 von 5')).toBeVisible();

  // 2: h h — first only one note → shown as missed, then a clean retry
  await playBar(page, [0]);
  await expect(page.getByTestId('rhythm-result')).toContainText('1 von 2 im Takt');
  await expect(page.getByTestId('rhythm-result')).toContainText('2: gefehlt');
  await audit(page);
  await playBar(page, [0, 2]);
  await expect(page.getByText('Super im Takt!')).toBeVisible();

  // 3–5
  await expect(page.getByText('Teil 3 von 5')).toBeVisible();
  await playBar(page, [0, 1, 2]); // q q h
  await expect(page.getByText('Teil 4 von 5')).toBeVisible();
  await playBar(page, [0, 2, 3]); // h q q
  await expect(page.getByText('Teil 5 von 5')).toBeVisible();
  await playBar(page, [0, 1, 2, 3]);

  // the retried bar does not cost stars
  await expect(page.getByRole('heading', { name: 'Perfekt!' })).toBeVisible();
});
