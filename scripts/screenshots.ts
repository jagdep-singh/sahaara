import 'dotenv/config';

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

import { prisma } from '../lib/db';

const base = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const output = path.join(process.cwd(), 'docs', 'screenshots');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 360, height: 800 }, locale: 'hi-IN' });

async function shot(name: string, url: string) {
  await page.goto(`${base}${url}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
}

await shot('home', '/hi');
await shot('scheme', '/hi/schemes/state-widow-pension');
await shot('finder', '/hi/eligibility');
await page.locator('input[type="number"]').fill('45');
for (const [name, value] of [['maritalStatus', 'widow'], ['hasBplCard', 'yes'], ['isShgMember', 'no'], ['pregnancy', 'no']]) {
  await page.getByRole('button', { name: 'आगे' }).click();
  await page.locator(`input[name="${name}"][value="${value}"]`).click();
}
await page.getByRole('button', { name: 'आगे' }).click();
await page.locator('input[name="district"][value="Bhopal"]').click();
await page.getByRole('button', { name: 'नतीजे देखें' }).click();
await page.waitForLoadState('domcontentloaded');
await page.screenshot({ path: path.join(output, 'finder-result.png'), fullPage: true });
await shot('donate-step-1', '/hi/donate');
await page.getByRole('button', { name: 'आगे' }).click();
await page.screenshot({ path: path.join(output, 'donate-step-2.png'), fullPage: true });
const receipt = await prisma.receipt.findFirst({ orderBy: { issuedAt: 'desc' }, select: { publicToken: true } });
if (receipt) await shot('receipt', `/hi/receipt/${receipt.publicToken}`);
await shot('admin-login', '/admin/login');
await browser.close();
await prisma.$disconnect();
console.log(`Screenshots written to ${output}`);
