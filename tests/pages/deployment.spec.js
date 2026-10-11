import { test, expect } from '@playwright/test';
import { seededState, STORAGE_KEY } from '../helpers/fixtures.js';

async function cachedProfile(page) {
  await page.addInitScript(({ key, state }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
  }, { key: STORAGE_KEY, state: seededState() });
}

function diagnostics(page) {
  const apiRequests = [], errors = [], failedResources = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname.includes('/api/')) apiRequests.push(request.url());
  });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:') && response.status() >= 400) failedResources.push(response.url());
  });
  return { apiRequests, errors, failedResources };
}

test('built Pages assets render the compact rail and all phone routes without an API', async ({ page }) => {
  const observed = diagnostics(page);
  await cachedProfile(page);
  await page.goto('./');
  await expect(page.locator('#overview')).toBeVisible();
  await expect(page.locator('.nav-rail')).toHaveCSS('width', '64px');
  await expect(page.locator('.rail-link svg').first()).toHaveCSS('width', '21px');
  const assets = await page.locator('link[rel="stylesheet"], script[type="module"]').evaluateAll(elements =>
    elements.map(element => element.getAttribute('href') || element.getAttribute('src')));
  expect(assets.some(url => /\/assets\/.*-[\w-]+\.css$/.test(url))).toBe(true);
  expect(assets.some(url => /\/assets\/.*-[\w-]+\.js$/.test(url))).toBe(true);
  expect(assets.some(url => url.includes('/src/'))).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const destination of ['banks', 'ledger', 'planning', 'overview']) {
    await page.locator(`.mobile-dock-btn[data-page="${destination}"]`).click();
    await expect(page.locator(`#${destination}`)).toBeVisible();
  }
  expect(observed).toEqual({ apiRequests: [], errors: [], failedResources: [] });
});

test('Pages transactions save on the device and survive a reload without backend requests', async ({ page }) => {
  const observed = diagnostics(page);
  await cachedProfile(page);
  await page.goto('./#ledger');
  await page.locator('.open-add-modal-btn:visible').first().click();
  await page.locator('#tx-amount').fill('250');
  await page.locator('#tx-description').fill('Pages lunch');
  await page.locator('#tx-account').selectOption('Maya');
  await page.locator('#transaction-modal button[type="submit"]').click();
  await expect(page.locator('#transaction-modal')).not.toHaveClass(/active/);
  await expect(page.locator('#save-feedback-text')).toHaveText('Saved on this device');
  await expect(page.locator('#save-feedback-retry')).toBeHidden();
  await expect(page.locator('#app-status')).toBeHidden();
  await page.reload();
  await expect(page.locator('#ledger-table-body')).toContainText('Pages lunch');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).transactions[0].amount, STORAGE_KEY)).toBe(250);
  expect(observed).toEqual({ apiRequests: [], errors: [], failedResources: [] });
});

test('a first-time Pages visitor completes onboarding and keeps the profile after reload', async ({ page }) => {
  const observed = diagnostics(page);
  await page.goto('./');
  await expect(page.locator('#onboarding-overlay')).toBeVisible();
  await page.locator('#onboard-name-input').fill('Pages User');
  for (let step = 1; step <= 5; step++) {
    await expect(page.locator(`#step-${step}`)).toBeVisible();
    if (step === 4) await page.locator('#onboard-card-holder-input').fill('Pages User');
    await page.locator('#btn-onboard-next').click();
  }
  await expect(page.locator('#onboarding-overlay')).toBeHidden();
  await page.reload();
  await expect(page.locator('#overview')).toBeVisible();
  await expect(page.locator('#user-avatar-btn')).toHaveText('PU');
  await expect(page.locator('#onboarding-overlay')).toBeHidden();
  expect(observed).toEqual({ apiRequests: [], errors: [], failedResources: [] });
});
