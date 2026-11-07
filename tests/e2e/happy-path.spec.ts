import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

function uniquePhone() {
  return `98765${String(Date.now()).slice(-5)}`;
}

test('finder → results → callback request', async ({ page }) => {
  await page.goto('/hi/eligibility');

  await expect(
    page.getByRole('heading', { name: 'पात्रता जाँच' })
  ).toBeVisible();

  await page.locator('#finder-age').fill('45');
  await page.getByRole('button', { name: 'आगे' }).click();

  await page.locator('#finder-maritalStatus-widow').check();
  await page.getByRole('button', { name: 'आगे' }).click();

  await page.locator('#finder-hasBplCard-yes').check();
  await page.getByRole('button', { name: 'आगे' }).click();

  await page.locator('#finder-isShgMember-no').check();
  await page.getByRole('button', { name: 'आगे' }).click();

  await page.locator('#finder-pregnancy-no').check();
  await page.getByRole('button', { name: 'आगे' }).click();

  await page.locator('#finder-district-Bhopal').check();
  await page.getByRole('button', { name: 'नतीजे देखें' }).click();

  await expect(
    page.getByRole('heading', { name: 'आपके लिए संभावित योजनाएँ' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'राज्य विधवा पेंशन' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'विधवा पुनर्विवाह अनुदान' })
  ).toBeVisible();

  await page.locator('#callback-name').fill('ई2ई कॉलबैक');
  await page.locator('#callback-phone').fill(uniquePhone());
  await page.locator('#callback-consent').check();
  await page.getByRole('button', { name: 'कॉल-बैक माँगें' }).click();

  await expect(
    page.getByText('धन्यवाद। हम जल्द आपको कॉल करेंगे।')
  ).toBeVisible();
});

test('donate → test payment → receipt → PDF download', async ({ page }) => {
  await page.goto('/hi/donate');

  await expect(
    page.getByRole('heading', { name: 'दान करें' })
  ).toBeVisible();

  await page.getByRole('button', { name: 'आगे' }).click();

  await page.locator('#donate-name').fill('ई2ई दानदाता');
  await page
    .locator('#donate-email')
    .fill(`e2e-${Date.now()}@example.com`);
  await page.locator('#donate-phone').fill(uniquePhone());
  await page.locator('#donate-pan').fill('ABCDE1234F');
  await page.locator('#donate-consent').check();
  await page.getByRole('button', { name: 'जाँच लें' }).click();

  await expect(
    page.getByRole('heading', { name: 'भुगतान' })
  ).toBeVisible();
  await expect(page.getByText('₹500')).toBeVisible();

  await page.getByRole('button', { name: 'भुगतान करें' }).click();
  await page.waitForURL(/\/hi\/donate\/pay\/[^/]+$/);

  await page
    .getByRole('button', { name: 'सफल भुगतान (भारतीय कार्ड)' })
    .click();

  await page.waitForURL(/\/hi\/receipt\/[^/]+$/);
  await expect(
    page.getByRole('heading', { name: 'आपकी रसीद' })
  ).toBeVisible();
  await expect(page.getByText(/^80G\/\d{4}-\d{2}\/\d{6}$/)).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page
    .getByRole('link', {
      name: 'रसीद और 80G प्रमाणपत्र डाउनलोड करें (PDF)',
    })
    .click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(
    /^receipt-\d{6}\.pdf$/
  );
  const path = await download.path();
  expect(path).toBeTruthy();
  const bytes = await readFile(path!);
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
});
