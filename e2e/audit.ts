import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** axe-core WCAG 2.1 AA check of the current page. */
export async function audit(page: Page) {
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
