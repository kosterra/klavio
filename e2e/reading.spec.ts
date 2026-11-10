import { expect, test } from '@playwright/test';
import { LESSONS, midiToName } from '@klavio/shared';
import {
  seedCompletedLessons,
  signUpWithEmail,
  uniqueEmail,
  startLesson,
  skipSetup,
} from './helpers';
import { audit } from './audit';

test('note reading: the staff shows a note, playing it is checked exactly', async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await signUpWithEmail(page, uniqueEmail('read'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Noa');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();

  // chapters 1 and 2 done → chapter 3 "Noten lesen" is next
  const firstReading = LESSONS.findIndex((l) => l.id === 'read-c-d-e');
  await seedCompletedLessons(
    page,
    LESSONS.slice(0, firstReading).map((l) => l.id),
  );
  await page.reload();
  await expect(page.getByTestId('path-read-c-d-e')).toHaveAttribute('aria-current', 'step');
  await page.getByTestId('path-read-c-d-e').click();
  await startLesson(page);

  const staff = page.getByRole('img', { name: /Notenlinien mit Violinschlüssel/ });
  await expect(staff).toBeVisible();
  await expect(staff.locator('svg')).toBeVisible(); // VexFlow rendered (font loaded locally)
  await audit(page);
  if (process.env.E2E_SCREENSHOTS) {
    await page.screenshot({ path: `${process.env.E2E_SCREENSHOTS}/reading.png`, fullPage: true });
  }

  const round = page.getByTestId('round');
  const summary = page.getByRole('button', { name: 'Zum Lernpfad' });
  const rain = page.getByTestId('note-rain');
  await expect(page.getByTestId('lesson-parts')).toContainText('Noten lesen');
  while (!(await rain.isVisible())) {
    const before = (await round.allTextContents())[0];
    if (!before) continue;
    // G4 is never asked in this lesson: a miss reveals the note's name
    await page.getByRole('button', { name: 'G4', exact: true }).click();
    const name = /Das ist ein (\S+)\./.exec(
      (await page.getByText(/^Das ist ein \S+\.$/).textContent()) ?? '',
    )![1];
    await page.getByRole('button', { name: `${name}4`, exact: true }).click();
    await expect(rain.or(round.filter({ hasNotText: before }))).toBeVisible();
  }
  // part 2: the same notes as a short note rain
  await expect(page.getByTestId('lesson-parts').locator('[aria-current="step"]')).toHaveText(
    'Notenregen',
  );
  await audit(page);
  const field = rain.locator('[data-drops]');
  await page.getByTestId('rain-start').click();
  for (let caught = 0; caught < 6;) {
    const drops = JSON.parse((await field.getAttribute('data-drops')) ?? '[]') as number[];
    if (!drops.length) continue;
    await page.getByRole('button', { name: midiToName(drops[0]!), exact: true }).click();
    caught++;
    await expect(page.getByTestId('rain-status')).toContainText(`${caught} von 6 gefangen`);
  }
  // one miss per read note → 12 / 18 correct → 1 star, still finished
  await expect(page.getByRole('heading', { name: 'Geschafft!' })).toBeVisible();
  await expect(page.getByRole('img', { name: '1 von 3 Sternen' })).toBeVisible();
  await expect(summary).toBeVisible();
});
