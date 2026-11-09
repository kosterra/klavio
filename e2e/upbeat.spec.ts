import { expect, test } from '@playwright/test';
import { LESSONS } from '@klavio/shared';
import { audit } from './audit';
import {
  playTimedSong,
  seedCompletedLessons,
  signUpWithEmail,
  skipTheory,
  uniqueEmail,
} from './helpers';

test('ties are held, not played again; an upbeat is counted in', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { value: undefined });
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await signUpWithEmail(page, uniqueEmail('upbeat'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lina');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await page.getByRole('heading', { name: 'Hallo Lina!' }).waitFor();
  await seedCompletedLessons(
    page,
    LESSONS.slice(
      0,
      LESSONS.findIndex((l) => l.id === 'meter-ties'),
    ).map((l) => l.id),
  );

  // «Haltebögen»: 15 notes, 4 of them only held → 11 to play
  await page.goto('/lesson/meter-ties');
  await skipTheory(page);
  await page.getByTestId('lesson-start-screen').click();
  await expect(page.getByTestId('song-staff').locator('svg')).toBeVisible();
  await audit(page);
  const order = ['C4', 'D4', 'E4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4', 'D4', 'C4'];
  for (const key of order) {
    await expect(page.getByTestId('next-note')).toContainText(key.slice(0, 1));
    await page.getByRole('button', { name: key, exact: true }).click();
  }
  expect(await playTimedSong(page)).toContain('11 von 11 Tönen im Takt');

  // «Happy Birthday»: the upbeat comes at the end of the count-in bar
  await page.goto('/lesson/meter-upbeat');
  await skipTheory(page);
  await page.getByTestId('lesson-start-screen').click();
  await expect(page.getByTestId('song-staff').locator('svg')).toBeVisible();
  const birthday =
    'G4 G4 A4 G4 C5 H4 G4 G4 A4 G4 D5 C5 G4 G4 G5 E5 C5 H4 A4 F5 F5 E5 C5 D5 C5'.split(' ');
  for (const key of birthday) {
    await expect(page.getByTestId('next-note')).toContainText(key.slice(0, 1));
    await page.getByRole('button', { name: key, exact: true }).click();
  }
  expect(await playTimedSong(page)).toContain('25 von 25 Tönen im Takt');
});
