import { expect, test, type Page } from '@playwright/test';
import { signUpWithEmail, uniqueEmail } from './helpers';
import { audit } from './audit';

/** No MIDI, microphone denied → the lesson falls back to the on-screen keyboard. */
async function denyMicrophone(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { value: undefined });
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
}

const key = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const summary = (page: Page) => page.getByRole('button', { name: 'Zum Lernpfad' });

/**
 * "Finde die Taste": read the asked note, tap it in the 4th octave. Waits for
 * lasting state (task counter / summary), not for the short feedback text.
 */
async function solveFindKey(page: Page, { mistakeFirst = false } = {}) {
  const counter = page.getByText(/^Aufgabe \d+ von \d+$/);
  let first = true;
  while (!(await summary(page).isVisible())) {
    // allTextContents() does not wait for the element (it disappears at the end)
    const before = (await counter.allTextContents())[0] ?? null;
    const note = /Finde das (\S+)/.exec(
      (await page.getByTestId('prompt').textContent()) ?? '',
    )?.[1];
    if (!note || before === null) continue;
    if (first && mistakeFirst) {
      await key(page, note === 'D' ? 'E4' : 'D4').click();
      // kids mode: after a miss the right key gets marked
      await expect(page.getByText('Schau, die markierte Taste hilft dir.')).toBeVisible();
    }
    first = false;
    await key(page, /\d$/.test(note) ? note : `${note}4`).click();
    // next task (counter changed) or the lesson summary
    await expect(summary(page).or(counter.filter({ hasNotText: before }))).toBeVisible();
  }
}

/** "Spiel nach": tap the highlighted bubble's note, one after the other. */
async function solvePlayAlong(page: Page) {
  while (!(await summary(page).isVisible())) {
    const current = page.getByTestId('sequence').locator('[aria-current="step"]');
    if (!(await current.count())) {
      await page.waitForTimeout(100); // between two sequences
      continue;
    }
    const note = (await current.getAttribute('aria-label'))!.split(',')[0]!;
    await key(page, `${note}4`).click();
  }
}

async function startLesson(page: Page, title: string) {
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await page.getByRole('button', { name: 'Los geht’s!' }).click();
}

test('learning path: play lessons, earn stars and XP, unlock the next ones', async ({ page }) => {
  test.setTimeout(120_000);
  await denyMicrophone(page);
  await signUpWithEmail(page, uniqueEmail('lesson'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lina');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();

  // --- dashboard: first lesson current, the rest locked
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
  await expect(page.getByTestId('path-keys-c')).toHaveAttribute('aria-current', 'step');
  await expect(page.getByTestId('path-keys-middle-c')).toHaveCount(0);
  await expect(
    page.getByRole('img', { name: /Lektion 2, Das mittlere C, noch gesperrt/ }),
  ).toBeVisible();
  await audit(page);

  // --- lesson 1 "Wo ist das C?" with one mistake → 2 stars
  await page.getByRole('link', { name: 'Erste Lektion starten' }).click();
  await audit(page);
  await startLesson(page, 'Wo ist das C?');
  await expect(page.getByText(/Zugriff auf das Mikrofon wurde verweigert/)).toBeVisible();
  await audit(page);
  await solveFindKey(page, { mistakeFirst: true });
  await expect(page.getByRole('heading', { name: 'Sehr gut!' })).toBeVisible();
  await expect(page.getByTestId('xp-gained')).toHaveText('+20 XP');
  await expect(page.getByText('1 Tag in Folge')).toBeVisible();
  await audit(page);

  // --- lesson 2 via "next", perfect → 3 stars
  await page.getByRole('button', { name: 'Nächste Lektion' }).click();
  await startLesson(page, 'Das mittlere C');
  await solveFindKey(page);
  await expect(page.getByRole('heading', { name: 'Perfekt!' })).toBeVisible();
  await expect(page.getByTestId('xp-gained')).toHaveText('+25 XP');

  // --- lessons 3 (find D/E) and 4 (play along C-D-E)
  await page.getByRole('button', { name: 'Nächste Lektion' }).click();
  await startLesson(page, 'D und E');
  await solveFindKey(page);
  // 20 + 25 + 25 = 70 XP → level 2 (from 50 XP)
  await expect(page.getByText('Neues Level: 2!')).toBeVisible();
  await page.getByRole('button', { name: 'Nächste Lektion' }).click();
  await startLesson(page, 'C, D, E nachspielen');
  await expect(page.getByTestId('sequence')).toBeVisible();
  await audit(page);
  await solvePlayAlong(page);
  await expect(page.getByRole('heading', { name: 'Perfekt!' })).toBeVisible();
  await expect(page.getByTestId('xp-gained')).toHaveText('+30 XP'); // 100 XP in total
  await expect(page.getByText(/Neues Level/)).toHaveCount(0);

  // --- back on the path: stars shown, lesson 5 is next
  await summary(page).click();
  await expect(page.getByTestId('path-keys-c')).toHaveAccessibleName(/2 von 3 Sternen/);
  await expect(page.getByTestId('path-keys-cde')).toHaveAccessibleName(/3 von 3 Sternen/);
  await expect(page.getByTestId('path-keys-f-g')).toHaveAttribute('aria-current', 'step');
  await expect(page.getByRole('link', { name: 'Weiter: F und G' })).toBeVisible();
  await expect(page.getByText('100', { exact: true })).toBeVisible(); // XP stat
  if (process.env.E2E_SCREENSHOTS) {
    await page.screenshot({ path: `${process.env.E2E_SCREENSHOTS}/path.png`, fullPage: true });
  }
  await audit(page);

  // --- a replay is possible and keeps the best result
  await page.getByTestId('path-keys-c').click();
  await startLesson(page, 'Wo ist das C?');
  await solveFindKey(page);
  await expect(page.getByTestId('xp-gained')).toHaveText('+10 XP'); // half of 10 + 5 for the extra star
});
