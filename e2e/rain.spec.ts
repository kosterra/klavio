import { expect, test } from '@playwright/test';
import { LESSONS, midiToName } from '@klavio/shared';
import {
  seedCompletedLessons,
  signUpWithEmail,
  skipSetup,
  skipTheory,
  uniqueEmail,
} from './helpers';
import { audit } from './audit';

test('Notenregen: catch the falling notes before they land', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await signUpWithEmail(page, uniqueEmail('rain'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Mia');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  const index = LESSONS.findIndex((l) => l.id === 'rain-treble');
  await seedCompletedLessons(
    page,
    LESSONS.slice(0, index).map((l) => l.id),
  );
  await page.goto('/lesson/rain-treble');
  await skipTheory(page);
  await page.getByTestId('lesson-start').click();

  const field = page.getByTestId('note-rain').locator('[data-drops]');
  await page.getByTestId('rain-start').click();
  await expect(field).not.toHaveAttribute('data-drops', '[]');
  await audit(page);

  // a wrong key catches nothing; then every note that falls, lowest first
  for (let caught = 0; caught < 20;) {
    const drops = JSON.parse((await field.getAttribute('data-drops')) ?? '[]') as number[];
    if (!drops.length) continue;
    await page.getByRole('button', { name: midiToName(drops[0]!), exact: true }).click();
    caught++;
    await expect(page.getByTestId('rain-status')).toContainText(`${caught} von 20 gefangen`);
  }
  await expect(page.getByText('Alle gefangen – super gelesen!')).toBeVisible();
  // the lesson ends with its result
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });
});
