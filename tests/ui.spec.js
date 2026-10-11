import { test, expect } from '@playwright/test';
import { seededState, STORAGE_KEY } from './helpers/fixtures.js';

test.beforeEach(async ({ request }) => {
  const response = await request.post('/api/state', { data: seededState() });
  expect(response.ok()).toBe(true);
});

async function serverState(request) {
  const response = await request.get('/api/state');
  expect(response.ok()).toBe(true);
  return response.json();
}
async function addExpense(page, description = 'Office lunch', amount = '250') {
  await page.locator('.open-add-modal-btn:visible').first().click();
  await page.locator('#tx-amount').fill(amount);
  await page.locator('#tx-description').fill(description);
  await page.locator('#tx-category').selectOption('General');
  await page.locator('#tx-account').selectOption('Maya');
  await page.locator('#tx-date').fill('2026-10-10');
  await page.locator('#tx-memo').fill('team lunch');
  await expect(page.locator('#tx-amount')).toHaveValue(amount);
  await expect(page.locator('#tx-description')).toHaveValue(description);
  await page.locator('#transaction-modal button[type="submit"]').click();
  await expect(page.locator('#transaction-modal')).not.toHaveClass(/active/);
}

test.describe('Frontend and real backend integration', () => {
  test('loads the dashboard and opens the transaction form', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page).toHaveTitle(/Vank/);
    await expect(page.locator('#overview')).toBeVisible();
    await expect(page.locator('.cards-shelf-title')).toHaveText('Banks');
    await page.locator('.rail-link[data-page="ledger"]').click();
    await expect(page.locator('.ledger-heading')).toContainText('Ledger');
    await expect(page.locator('#ledger-count-tag')).toHaveText('0 entries');
    await page.locator('.open-add-modal-btn:visible').first().click();
    await expect(page.locator('#modal-title-text')).toHaveText('Add Transaction');
    expect(errors).toEqual([]);
  });

  test('adds, reloads, edits and deletes a transaction through the backend', async ({ page, request }) => {
    await page.goto('/');
    await addExpense(page);
    await expect.poll(async () => (await serverState(request)).transactions[0]?.amount).toBe(250);
    await page.reload();
    await page.locator('.rail-link[data-page="ledger"]').click();
    const row = page.locator('#ledger-table-body tr').filter({ hasText: 'Office lunch' });
    await expect(row).toContainText('-₱250.00');
    await row.locator('.edit-tx-btn').click();
    await page.locator('#tx-amount').fill('300');
    await page.locator('#transaction-modal button[type="submit"]').click();
    await expect.poll(async () => (await serverState(request)).transactions[0]?.amount).toBe(300);
    await page.reload();
    await expect(row).toContainText('-₱300.00');
    page.once('dialog', dialog => dialog.accept());
    await row.locator('.delete-tx-btn').click();
    await expect.poll(async () => (await serverState(request)).transactions.length).toBe(0);
    await page.reload();
    await expect(page.locator('#ledger-count-tag')).toHaveText('0 entries');
  });

  test('saves a budget and shows its limit and spending after reload', async ({ page, request }) => {
    await page.goto('/#ledger');
    await page.locator('.open-add-budget-btn:visible').first().click();
    await page.locator('#budget-category-select').selectOption('General');
    await page.locator('#budget-limit-input').fill('5000');
    await page.locator('#budget-modal button[type="submit"]').click();
    await addExpense(page);
    await expect.poll(async () => (await serverState(request)).budgets[0]?.spent).toBe(250);
    await page.reload();
    const budget = page.locator('.budget-card-item').filter({ hasText: 'General' }).first();
    await expect(budget).toContainText('5,000');
    await expect(budget).toContainText('250');
  });

  test('creates a virtual card and preserves its opening balance', async ({ page, request }) => {
    await page.goto('/');
    await page.locator('.open-add-bank-trigger').first().click();
    await page.locator('#new-bank-holder').fill('Test User');
    await page.locator('#new-bank-name').fill('Savings card');
    await page.locator('#new-bank-balance').fill('1000');
    await expect(page.locator('#new-bank-holder')).toHaveValue('Test User');
    await expect(page.locator('#new-bank-name')).toHaveValue('Savings card');
    await page.locator('#bank-modal-submit-btn').click();
    await expect.poll(async () => (await serverState(request)).virtualBanks.find(bank => bank.name === 'Savings card')?.balance).toBe(1000);
    await page.reload();
    await expect(page.locator('#virtual-cards-rack')).toContainText('Savings card');
    expect((await serverState(request)).transactions.filter(tx => tx.description.includes('Opening Deposit'))).toHaveLength(1);
  });

  test('persists planner settings, recurring bills and savings goals', async ({ page, request }) => {
    await page.goto('/#planning');
    await page.locator('#planner-savings-target').fill('10000');
    await page.locator('#planner-settings-form button[type="submit"]').click();
    await page.locator('#planner-recurring-name').fill('Internet');
    await page.locator('#planner-recurring-amount').fill('1500');
    await page.locator('#planner-recurring-form button[type="submit"]').click();
    await page.locator('#planner-goal-name').fill('Emergency fund');
    await page.locator('#planner-goal-target').fill('10000');
    await page.locator('#planner-goal-current').fill('500');
    await page.locator('#planner-goal-form button[type="submit"]').click();
    await expect.poll(async () => (await serverState(request)).plannerGoals.length).toBe(1);
    await page.reload();
    await expect(page.locator('#planner-savings-target')).toHaveValue('10000');
    await expect(page.locator('#planner-dashboard')).toContainText('Internet');
    await expect(page.locator('#planner-dashboard')).toContainText('Emergency fund');
    const saved = await serverState(request);
    expect(saved.recurringPlans[0].amount).toBe(1500);
    expect(saved.plannerGoals[0].currentAmount).toBe(500);
  });

  test('filters transactions and keeps the add form usable on a phone viewport', async ({ page }) => {
    await page.goto('/#ledger');
    await addExpense(page);
    await page.locator('.filter-btn[data-filter="income"]').click();
    await expect(page.locator('#ledger-count-tag')).toHaveText('0 entries');
    await page.locator('.filter-btn[data-filter="expense"]').click();
    await expect(page.locator('#ledger-count-tag')).toHaveText('1 entries');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.open-add-modal-btn:visible').first().click();
    await expect(page.locator('#transaction-modal')).toHaveClass(/active/);
    await expect(page.locator('#tx-amount')).toBeVisible();
  });

  test('keeps offline edits after reload without changing backend data', async ({ page, request }) => {
    await page.addInitScript(({ state, key }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
    }, { state: seededState(), key: STORAGE_KEY });
    await page.route('**/api/**', route => route.abort());
    await page.goto('/');
    await addExpense(page, 'Offline lunch');
    await page.reload();
    await page.locator('.rail-link[data-page="ledger"]').click();
    await expect(page.locator('#ledger-table-body')).toContainText('Offline lunch');
    expect((await serverState(request)).transactions).toEqual([]);
  });

  test('navigates all four pages on desktop and phone, including browser history', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#overview')).toBeVisible();
    for (const name of ['banks', 'ledger', 'planning']) {
      await page.locator(`.rail-link[data-page="${name}"]`).click();
      await expect(page.locator(`#${name}`)).toBeVisible();
      await expect(page.locator('.workspace-page:visible')).toHaveCount(1);
      await expect(page).toHaveURL(new RegExp(`#${name}$`));
    }
    await page.goBack();
    await expect(page.locator('#ledger')).toBeVisible();
    await page.reload();
    await expect(page.locator('#ledger')).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    for (const name of ['overview', 'banks', 'planning', 'ledger']) {
      await page.locator(`.mobile-dock-btn[data-page="${name}"]`).click();
      await expect(page.locator(`#${name}`)).toBeVisible();
      await expect(page.locator('.workspace-page:visible')).toHaveCount(1);
    }
  });
});
