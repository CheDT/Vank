import { test, expect } from '@playwright/test';
import { seededState, transaction, STORAGE_KEY } from './helpers/fixtures.js';

function workspaceData() {
  const data = seededState();
  data.transactions = [transaction()];
  data.virtualBanks.push({ ...data.virtualBanks[0], id: 'bank-bdo', name: 'BDO', brand: 'bdo', initialBalance: 2000, balance: 2000, isPrimary: false });
  return data;
}

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

async function settle(page, selector) {
  await expect.poll(() => page.locator(selector).evaluate(el => getComputedStyle(el).opacity)).toBe('1');
}

test.beforeEach(async ({ request }) => {
  await request.post('/api/state', { data: workspaceData() });
});

test('keeps navigation available during initial loading without showing zero balances', async ({ page }) => {
  const gate = deferred();
  await page.route('**/api/state', async route => {
    await gate.promise;
    await route.continue();
  });
  await page.goto('/');
  await expect(page.locator('#workspace-loading')).toBeVisible();
  await expect(page.locator('#workspace-progress')).toBeVisible();
  await expect(page.locator('#metric-cash-in')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Add entry', exact: true })).toBeDisabled();
  await page.locator('.rail-link[data-page="ledger"]').click();
  await expect(page).toHaveURL(/#ledger$/);
  await expect(page.locator('.loading-bank')).toBeHidden();
  await expect(page.locator('#app-status')).toContainText('Loading workspace');
  await page.screenshot({ path: 'test-results/ui-preview/workspace-loading.png' });
  gate.resolve();
  await expect(page.locator('#ledger-table-body')).toContainText('Client payment');
  await expect(page.locator('#workspace-progress')).toBeHidden();
  await expect(page.locator('#workspace-loading')).toBeHidden();
});

test('shows cached balances while loading and then replaces them with server values', async ({ page }) => {
  const gate = deferred();
  await page.addInitScript(({ data, key }) => localStorage.setItem(key, JSON.stringify(data)), { data: workspaceData(), key: STORAGE_KEY });
  await page.route('**/api/state', async route => {
    await gate.promise;
    const data = workspaceData();
    data.transactions[0].amount = 6000;
    await route.fulfill({ json: data });
  });
  await page.goto('/');
  await expect(page.locator('#overview')).toBeVisible();
  await expect(page.locator('#metric-cash-in')).toHaveText('+₱5,000.00');
  await expect(page.locator('#workspace-loading')).toBeHidden();
  await expect(page.locator('#workspace-progress')).toBeVisible();
  gate.resolve();
  await expect(page.locator('#metric-cash-in')).toHaveText('+₱6,000.00');
  await expect(page.locator('#workspace-progress')).toBeHidden();
});

test('shows a real pending save, keeps button width stable and prevents duplicate transactions', async ({ page, request }) => {
  const gate = deferred();
  let saves = 0;
  await page.goto('/');
  await expect(page.locator('#overview')).toBeVisible();
  await page.route('**/api/state', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    saves++;
    await gate.promise;
    await route.continue();
  });
  await page.getByRole('button', { name: 'Add entry', exact: true }).click();
  await page.locator('#tx-amount').fill('250');
  await page.locator('#tx-description').fill('Lunch');
  const save = page.locator('#transaction-modal [type="submit"]');
  const before = await save.boundingBox();
  await save.click();
  await expect(save).toBeDisabled();
  await expect(save).toHaveAttribute('aria-busy', 'true');
  await expect(save).toHaveText('Saving…');
  await expect(page.locator('#transaction-modal')).toBeVisible();
  await expect(page.locator('#save-feedback')).toContainText('Saving…');
  expect((await save.boundingBox()).width).toBe(before.width);
  await page.locator('#transaction-form').evaluate(form => form.requestSubmit());
  expect(saves).toBe(1);
  gate.resolve();
  await expect(page.locator('#transaction-modal')).toBeHidden();
  await expect(page.locator('#save-feedback')).toContainText('Saved');
  const saved = await (await request.get('/api/state')).json();
  expect(saved.transactions.filter(tx => tx.description === 'Lunch')).toHaveLength(1);
});

test('labels offline saves accurately and retries without reloading or discarding a form draft', async ({ page, request }) => {
  let offline = true;
  await page.goto('/');
  await expect(page.locator('#overview')).toBeVisible();
  await page.route('**/api/state', route => {
    if (offline && route.request().method() === 'POST') return route.fulfill({ status: 503, json: { error: 'Unavailable' } });
    return route.continue();
  });
  await page.getByRole('button', { name: 'Add entry', exact: true }).click();
  await page.locator('#tx-amount').fill('100');
  await page.locator('#tx-description').fill('Offline entry');
  await page.getByRole('button', { name: 'Save transaction', exact: true }).click();
  await expect(page.locator('#transaction-modal')).toBeHidden();
  await expect(page.locator('#save-feedback')).toContainText('Saved on this device');
  expect((await (await request.get('/api/state')).json()).transactions).toHaveLength(1);
  await page.evaluate(() => { window.feedbackTestMarker = 'same page'; });
  await page.getByRole('button', { name: 'Add entry', exact: true }).click();
  await page.locator('#tx-description').fill('Keep this draft');
  offline = false;
  await page.locator('#save-feedback-retry').click();
  await expect(page.locator('#save-feedback')).toContainText('Saved');
  await expect(page.locator('#tx-description')).toHaveValue('Keep this draft');
  expect(await page.evaluate(() => window.feedbackTestMarker)).toBe('same page');
  const saved = await (await request.get('/api/state')).json();
  expect(saved.transactions.filter(tx => tx.description === 'Offline entry')).toHaveLength(1);
});

test('refreshes in place while retaining balances, the selected page and unsaved fields', async ({ page }) => {
  const gate = deferred();
  await page.goto('/#planning');
  await page.locator('#planner-goal-name').fill('Keep my goal draft');
  await page.route('**/api/state', async route => {
    if (route.request().method() !== 'GET') return route.continue();
    await gate.promise;
    const data = workspaceData();
    data.transactions[0].amount = 6000;
    await route.fulfill({ json: data });
  });
  await page.locator('#user-avatar-btn').click();
  await page.locator('#account-popover .refresh-data-trigger').click();
  await expect(page.locator('#app-status')).toContainText('Refreshing workspace');
  await expect(page.locator('#planning')).toBeVisible();
  await expect(page.locator('#planner-goal-name')).toHaveValue('Keep my goal draft');
  await expect(page.locator('#metric-cash-in')).toHaveText('+₱5,000.00');
  gate.resolve();
  await expect(page.locator('#workspace-progress')).toBeHidden();
  await expect(page.locator('#planner-goal-name')).toHaveValue('Keep my goal draft');
  await expect(page.locator('#metric-cash-in')).toHaveText('+₱6,000.00');
  await expect(page).toHaveURL(/#planning$/);
});

test('planner saves retain other drafts and keep their pending button visible', async ({ page, request }) => {
  const gate = deferred();
  await page.goto('/#planning');
  await page.locator('#planner-goal-name').fill('Trip');
  await page.locator('#planner-goal-target').fill('10000');
  await page.route('**/api/state', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    await gate.promise;
    await route.continue();
  });
  await page.locator('#planner-savings-target').fill('5000');
  const save = page.locator('#planner-settings-form [type="submit"]');
  await save.click();
  await expect(save).toHaveText('Saving…');
  await expect(save).toBeDisabled();
  await page.locator('#planner-goal-current').fill('100');
  gate.resolve();
  await expect(save).toHaveText('Save plan');
  await expect(page.locator('#planner-goal-name')).toHaveValue('Trip');
  await expect(page.locator('#planner-goal-current')).toHaveValue('100');
  await page.locator('#planner-goal-form [type="submit"]').click();
  await expect.poll(async () => (await (await request.get('/api/state')).json()).plannerGoals.length).toBe(1);
});

test('uses the shared spacing and comfortable phone controls while retaining compact card menus', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('#overview-transactions')).toContainText('Client payment');
  expect(await page.locator('.workspace-viewport').evaluate(el => getComputedStyle(el).paddingLeft)).toBe('24px');
  await settle(page, '#overview');
  await page.screenshot({ path: 'test-results/ui-preview/workspace-desktop.png' });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const add = page.getByRole('button', { name: 'Add entry', exact: true });
    const bounds = await add.boundingBox();
    expect(bounds.width).toBe(48);
    expect(bounds.height).toBe(48);
    expect(await page.locator('.workspace-viewport').evaluate(el => getComputedStyle(el).paddingLeft)).toBe('16px');
    const menu = page.locator('.is-front .btn-card-menu');
    expect((await menu.boundingBox()).width).toBe(28);
    expect(await menu.evaluate(el => getComputedStyle(el, '::after').width)).toBe('48px');
    await settle(page, '#overview');
    await page.screenshot({ path: `test-results/ui-preview/workspace-phone-${width}.png` });
    await add.click();
    await expect(page.locator('#transaction-modal')).toBeVisible();
    expect(await page.locator('#tx-description').evaluate(el => getComputedStyle(el).fontSize)).toBe('16px');
    expect((await page.locator('#tx-description').boundingBox()).height).toBeGreaterThanOrEqual(48);
    await settle(page, '#transaction-modal');
    await settle(page, '#transaction-modal .modal-container');
    await page.screenshot({ path: `test-results/ui-preview/workspace-form-${width}.png` });
    await page.keyboard.press('Escape');
  }
  expect(errors).toEqual([]);
});

test('keeps loading and saving perceivable when reduced motion disables their animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const loading = deferred();
  const saving = deferred();
  await page.route('**/api/state', async route => {
    await (route.request().method() === 'GET' ? loading.promise : saving.promise);
    await route.continue();
  });
  await page.goto('/');
  await expect(page.locator('#workspace-progress')).toBeVisible();
  expect(await page.locator('#workspace-progress').evaluate(el => getComputedStyle(el, '::after').animationName)).toBe('none');
  await expect(page.locator('#app-status')).toContainText('Loading workspace');
  loading.resolve();
  await expect(page.locator('#overview')).toBeVisible();
  await page.getByRole('button', { name: 'Add entry', exact: true }).click();
  await page.locator('#tx-amount').fill('100');
  await page.locator('#tx-description').fill('Reduced motion entry');
  const submit = page.locator('#transaction-modal [type="submit"]');
  await submit.click();
  await expect(submit).toHaveText('Saving…');
  expect(await submit.locator('.button-spinner').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  saving.resolve();
  await expect(page.locator('#transaction-modal')).toBeHidden();
  await expect(page.locator('#save-feedback')).toContainText('Saved');
});

test('shows a recoverable error when both saving destinations fail', async ({ page, request }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new Error('Browser storage blocked for this test'); };
  });
  await page.goto('/');
  await expect(page.locator('#overview')).toBeVisible();
  let unavailable = true;
  await page.route('**/api/state', route => {
    if (unavailable && route.request().method() === 'POST') return route.fulfill({ status: 503, json: { error: 'Unavailable' } });
    return route.continue();
  });
  await page.getByRole('button', { name: 'Add entry', exact: true }).click();
  await page.locator('#tx-amount').fill('100');
  await page.locator('#tx-description').fill('Recover this entry');
  await page.locator('#transaction-modal [type="submit"]').click();
  await expect(page.locator('#transaction-modal')).toBeHidden();
  await expect(page.locator('#save-feedback')).toContainText('Couldn’t save');
  await expect(page.locator('#app-status')).toContainText('Keep this tab open and retry');
  unavailable = false;
  await page.locator('#save-feedback-retry').click();
  await expect(page.locator('#save-feedback')).toContainText('Saved');
  const saved = await (await request.get('/api/state')).json();
  expect(saved.transactions.filter(tx => tx.description === 'Recover this entry')).toHaveLength(1);
});
