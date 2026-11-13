import { expect, test, type Page } from '@playwright/test';
import { LESSONS, midiToName, type ListenExercise } from '@klavio/shared';
import { audit } from './audit';
import {
  playTimedSong,
  seedCompletedLessons,
  signUpWithEmail,
  skipSetup,
  skipTheory,
  uniqueEmail,
} from './helpers';

const summary = (page: Page) => page.getByRole('button', { name: 'Zum Lernpfad' });

/** Answers every round of a «Hör genau hin» exercise – the first one wrong, once. */
async function answerAll(page: Page, exercise: ListenExercise, wrongFirst: boolean) {
  const box = page.getByTestId('listen');
  for (const [i, round] of exercise.rounds.entries()) {
    await expect(box).toHaveAttribute('data-round', String(i));
    if (wrongFirst && i === 0) {
      const wrong = round.answer === 0 ? 1 : 0;
      await page.getByTestId(`listen-answer-${wrong}`).click();
      await expect(page.getByTestId(`listen-answer-${wrong}`)).toBeDisabled();
    }
    await page.getByTestId(`listen-answer-${round.answer}`).click();
  }
}

test('new practice: listening, interval rain and sight-reading', async ({ page }) => {
  test.setTimeout(240_000);
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { value: undefined });
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await signUpWithEmail(page, uniqueEmail('practice'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lina');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await page.getByRole('heading', { name: 'Hallo Lina!' }).waitFor();
  await seedCompletedLessons(
    page,
    LESSONS.slice(
      0,
      LESSONS.findIndex((l) => l.id === 'sight-first'),
    )
      .filter((l) => !['ear-high-low', 'read-steps'].includes(l.id))
      .map((l) => l.id),
  );

  // «Hoch oder tief?»: Klavi plays two notes, the answer is tapped; a wrong one is a mistake
  const highLow = LESSONS.find((l) => l.id === 'ear-high-low')!;
  await page.goto('/lesson/ear-high-low');
  await skipTheory(page);
  await page.getByTestId('lesson-start-screen').click();
  await expect(page.getByTestId('listen')).toBeVisible();
  await audit(page);
  await answerAll(page, highLow.exercises[0] as ListenExercise, true);
  await expect(summary(page)).toBeVisible({ timeout: 10_000 });

  // «Schritt und Sprung»: by ear, then the interval rain – two notes, the second is played
  const steps = LESSONS.find((l) => l.id === 'read-steps')!;
  await page.goto('/lesson/read-steps');
  await skipTheory(page);
  await page.getByTestId('lesson-start-screen').click();
  await answerAll(page, steps.exercises[0] as ListenExercise, false);
  const field = page.getByTestId('note-rain').locator('[data-drops]');
  await page.getByTestId('rain-start').click();
  await expect(field).not.toHaveAttribute('data-drops', '[]');
  await expect(field.getByText(/^von /).first()).toBeVisible();
  await audit(page);
  for (let caught = 0; caught < 8;) {
    const drops = JSON.parse((await field.getAttribute('data-drops')) ?? '[]') as number[];
    if (!drops.length) continue;
    await page.getByRole('button', { name: midiToName(drops[0]!), exact: true }).click();
    caught++;
    await expect(page.getByTestId('rain-status')).toContainText(`${caught} von 8 gefangen`);
  }
  await expect(summary(page)).toBeVisible({ timeout: 10_000 });

  // «Vom Blatt spielen»: three new melodies in time, no listening, no marked keys
  await page.goto('/lesson/sight-first');
  await skipTheory(page);
  await page.getByTestId('lesson-start-screen').click();
  const sight = page.getByTestId('sight-read');
  await expect(sight).toBeVisible();
  await expect(page.getByTestId('tempo-level')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Anhören' })).toHaveCount(0);
  await audit(page);
  for (const round of [0, 1, 2]) {
    await expect(sight).toHaveAttribute('data-round', String(round));
    await expect(sight).toContainText(`Melodie ${round + 1} von 3`);
    expect(await playTimedSong(page)).toContain('6 von 6 Tönen im Takt');
  }
  await expect(summary(page)).toBeVisible({ timeout: 10_000 });
});
