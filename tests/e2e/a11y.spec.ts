import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import 'dotenv/config';
import pg from 'pg';

const WCAG_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
];

async function expectNoViolations(
  page: import('@playwright/test').Page,
  path: string
) {
  await page.goto(path);
  await expect(page.locator('main')).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();

  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.map((node) => node.target),
    }))
  ).toEqual([]);
}

test.describe('axe-core WCAG 2.2 AA scans', () => {
  const staticPaths = [
    ['/hi', 'Hindi home'],
    ['/en', 'English home'],
    ['/hi/eligibility', 'Hindi finder'],
    ['/hi/donate', 'Hindi donate'],
    ['/hi/schemes/state-widow-pension', 'Hindi scheme detail'],
    ['/admin/login', 'Admin login'],
  ] as const;

  for (const [path, label] of staticPaths) {
    test(`${label} (${path})`, async ({ page }) => {
      await expectNoViolations(page, path);
    });
  }

  test('Hindi receipt', async ({ page }) => {
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
    });
    await client.connect();

    let token: string | undefined;
    try {
      const result = await client.query<{ publicToken: string }>(
        'select "publicToken" from receipt order by "issuedAt" desc limit 1'
      );
      token = result.rows[0]?.publicToken;
    } finally {
      await client.end();
    }

    expect(token, 'seed at least one receipt before running a11y tests').toBeTruthy();
    await expectNoViolations(page, `/hi/receipt/${token}`);
  });
});
