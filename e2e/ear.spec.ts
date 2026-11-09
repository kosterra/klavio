import { expect, test } from '@playwright/test';
import { LESSONS } from '@klavio/shared';
import { audit } from './audit';
import { seedCompletedLessons, signUpWithEmail, uniqueEmail } from './helpers';

test('play back by ear; improvising on the white keys', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { value: undefined });
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await signUpWithEmail(page, uniqueEmail('ear'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lina');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await page.getByRole('heading', { name: 'Hallo Lina!' }).waitFor();
  await seedCompletedLessons(
    page,
    LESSONS.slice(
      0,
      LESSONS.findIndex((l) => l.id === 'song-jakob'),
    ).map((l) => l.id),
  );

  await page.goto('/lesson/ear-echo-cde');
  await page.getByTestId('lesson-start-screen').click();
  const again = page.getByTestId('echo-again');
  // Klavi plays C D first – the notes stay hidden
  await expect(page.getByTestId('echo-notes')).toContainText('??');
  // wait until Klavi has played (keys are ignored meanwhile)
  await expect(again).toBeDisabled();
  await expect(again).toBeEnabled({ timeout: 10_000 });
  await audit(page);
  // a wrong note: Klavi plays the motif again
  await page.getByRole('button', { name: 'E4', exact: true }).click();
  await expect(page.getByText('Das war E – hör nochmals zu.')).toBeVisible();
  await expect(again).toBeDisabled();
  await expect(again).toBeEnabled({ timeout: 10_000 });
  await page.getByRole('button', { name: 'C4', exact: true }).click();
  await page.getByRole('button', { name: 'D4', exact: true }).click();
  await expect(page.getByText('Teil 2 von 5')).toBeVisible();

  // improvising: the white keys this time
  await page.goto('/lesson/improvise-white');
  await page.getByTestId('lesson-start-screen').click();
  await expect(page.getByText(/du spielst frei auf den weissen Tasten/).first()).toBeVisible();
  await audit(page);
});
