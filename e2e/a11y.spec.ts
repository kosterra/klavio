import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

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

test('key screens have no WCAG 2.1 AA violations (Kids and Classic)', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });

  await page.goto('/welcome');
  await audit(page);

  await page.getByRole('button', { name: 'Neues Konto' }).click();
  await page.getByLabel('Wie heisst du?').fill(`A11y ${Date.now()}`);
  await audit(page);
  await page.getByRole('button', { name: 'Passkey erstellen' }).click();
  await page.getByRole('heading', { name: 'Deine Wiederherstellungscodes' }).waitFor();
  await audit(page);
  await page.getByRole('button', { name: 'Ich habe die Codes gesichert' }).click();

  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Kim');
  await audit(page);
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await page.getByRole('heading', { name: 'Hallo Kim!' }).waitFor();
  await audit(page);

  await page.goto('/account');
  await page.getByRole('heading', { name: 'Passkeys' }).waitFor();
  await audit(page);

  // Classic mode
  await page.goto('/profiles');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Max');
  await page.getByRole('dialog').getByText('Classic', { exact: true }).click();
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await page.getByRole('heading', { name: 'Hallo Max!' }).waitFor();
  await audit(page);
  await audit(await page.goto('/profiles').then(() => page));
});
