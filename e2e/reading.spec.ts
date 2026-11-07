import { expect, test } from '@playwright/test';
import { LESSONS } from '@klavio/shared';
import { seedCompletedLessons, signUpWithEmail, uniqueEmail } from './helpers';
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
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
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
  await page.getByRole('button', { name: 'Los geht’s!' }).click();

  const staff = page.getByRole('img', { name: /Notenlinien mit Violinschlüssel/ });
  await expect(staff).toBeVisible();
  await expect(staff.locator('svg')).toBeVisible(); // VexFlow rendered (font loaded locally)
  await audit(page);
  if (process.env.E2E_SCREENSHOTS) {
    await page.screenshot({ path: `${process.env.E2E_SCREENSHOTS}/reading.png`, fullPage: true });
  }

  const round = page.getByTestId('round');
  const summary = page.getByRole('button', { name: 'Zum Lernpfad' });
  while (!(await summary.isVisible())) {
    const before = (await round.allTextContents())[0];
    if (!before) continue;
    // G4 is never asked in this lesson: a miss reveals the note's name
    await page.getByRole('button', { name: 'G4', exact: true }).click();
    const name = /Das ist ein (\S+)\./.exec(
      (await page.getByText(/^Das ist ein \S+\.$/).textContent()) ?? '',
    )![1];
    await page.getByRole('button', { name: `${name}4`, exact: true }).click();
    await expect(summary.or(round.filter({ hasNotText: before }))).toBeVisible();
  }
  // one miss per note → 6 / 12 correct → 1 star, still finished
  await expect(page.getByRole('heading', { name: 'Geschafft!' })).toBeVisible();
  await expect(page.getByRole('img', { name: '1 von 3 Sternen' })).toBeVisible();
});
