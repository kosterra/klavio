import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { addVirtualAuthenticator, signUpWithEmail, uniqueEmail } from './helpers';

async function audit(page: Page) {
  // let Mantine transitions finish so colours are final
  await page.waitForTimeout(400);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  const summary = result.violations.map((v) => ({
    id: v.id,
    nodes: v.nodes.map(
      (n) => `${n.target.join(' ')} — ${n.failureSummary?.split('\n')[1]?.trim()}`,
    ),
  }));
  expect(summary).toEqual([]);
}

test('key screens have no WCAG 2.1 AA violations (Kids and Classic)', async ({ page, context }) => {
  await addVirtualAuthenticator(context, page);

  await page.goto('/welcome');
  await audit(page);

  await page.goto('/register');
  await page.getByRole('heading', { name: 'Konto erstellen' }).waitFor();
  await audit(page);

  await signUpWithEmail(page, uniqueEmail('a11y'), 'A11y');
  await audit(page); // profile picker incl. passkey hint

  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Kim');
  await audit(page);
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await page.getByRole('heading', { name: 'Hallo Kim!' }).waitFor();
  await audit(page);

  await page.goto('/account');
  await page.getByText('Noch kein Passkey eingerichtet.').waitFor();
  await audit(page);
  await page.getByRole('button', { name: 'Passkey hinzufügen' }).click();
  await page.getByRole('button', { name: /^Löschen:/ }).waitFor();
  await page.getByRole('button', { name: 'Ändern' }).click();
  await audit(page);

  // Classic mode
  await page.goto('/profiles');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Max');
  await page.getByRole('dialog').getByText('Classic', { exact: true }).click();
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await page.getByRole('heading', { name: 'Hallo Max!' }).waitFor();
  await audit(page);
  await page.goto('/account');
  await page.getByRole('heading', { name: 'Passkeys' }).waitFor();
  await audit(page);
});
