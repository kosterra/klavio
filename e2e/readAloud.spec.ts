import { expect, test, type Page } from '@playwright/test';
import { audit } from './audit';
import { signUpWithEmail, startLesson, uniqueEmail, skipSetup } from './helpers';

/**
 * The test browser has no voices: a stand-in speech synthesis with one local
 * German and one English voice records what Klavi says.
 */
async function fakeSpeech(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    const spoken: string[] = [];
    w.__spoken = spoken;
    const voices = [
      { lang: 'de-CH', name: 'Test Deutsch', localService: true, default: true, voiceURI: 'de' },
      { lang: 'en-GB', name: 'Test English', localService: true, default: false, voiceURI: 'en' },
    ];
    type U = { text: string; onend?: () => void; onerror?: () => void };
    let current: U | null = null;
    const synth = Object.assign(new EventTarget(), {
      getVoices: () => voices,
      speak(u: U) {
        spoken.push(u.text);
        current = u;
        setTimeout(() => {
          if (current === u) {
            current = null;
            u.onend?.();
          }
        }, 8000);
      },
      cancel() {
        const u = current;
        current = null;
        u?.onerror?.();
      },
    });
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    w.SpeechSynthesisUtterance = class {
      text: string;
      constructor(text: string) {
        this.text = text;
      }
    };
  });
}

const spoken = (page: Page) =>
  page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);

test('Klavi reads tasks and explanations aloud – automatically for Kids, switchable', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await fakeSpeech(page);
  await signUpWithEmail(page, uniqueEmail('voice'), 'Familie Stimme');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Noa');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  // Kids hear the start-up questions too
  await expect.poll(() => spoken(page)).toContain('Worauf spielst du?');
  await skipSetup(page);
  await page.evaluate(() => {
    (window as unknown as { __spoken: string[] }).__spoken.length = 0;
  });

  // Kids profile: the first explanation is read on its own
  await page.getByRole('link', { name: 'Erste Lektion starten' }).click();
  await expect(page.getByTestId('theory-text')).toContainText('So sitzt du gut');
  await expect.poll(() => spoken(page)).toEqual([expect.stringContaining('So sitzt du gut')]);
  const button = page.getByTestId('read-aloud');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  // tap: stop; tap again: read again
  await button.click();
  await expect(button).toHaveAttribute('aria-label', 'Vorlesen');
  await button.click();
  await expect.poll(async () => (await spoken(page)).length).toBe(2);
  await audit(page);

  // the task of the exercise too
  await startLesson(page);
  await expect.poll(async () => (await spoken(page)).at(-1)).toMatch(/^Finde das/);

  // switched off in the profile: nothing is read by itself, the button stays
  await page.goto('/profile');
  const toggle = page.getByRole('switch', { name: 'Klavi liest vor' });
  await expect(toggle).toBeChecked();
  await toggle.click({ force: true });
  await expect(toggle).not.toBeChecked();
  const before = (await spoken(page)).length;
  await page.goto('/');
  await page
    .getByRole('link', { name: /Weiter|Erste Lektion|Wo ist das C/ })
    .first()
    .click();
  await startLesson(page);
  await expect(page.getByTestId('read-aloud').last()).toBeVisible();
  await page.waitForTimeout(500);
  expect((await spoken(page)).length).toBe(before);
});
