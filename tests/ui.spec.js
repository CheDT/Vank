import { test, expect } from '@playwright/test';

const seededState = {
  userProfile: {
    name: 'Test User',
    email: 'test@example.com',
    workspaceName: 'Vank',
    workspaceMode: 'hybrid',
    currency: '₱',
    currencyCode: 'PHP',
    onboardingComplete: true,
    tutorialDismissed: true
  },
  activeWorkspace: 'all',
  activeVirtualBankId: 'all',
  transactions: [],
  budgets: [],
  virtualBanks: [
    {
      id: 'bank-primary',
      name: 'Maya',
      network: 'visa',
      classification: 'business',
      gradient: 'gradient-emerald',
      initialBalance: 0,
      balance: 0,
      brand: 'maya',
      cardHolder: 'Test User',
      last4: '9104'
    }
  ],
  plannerSettings: {},
  recurringPlans: [],
  plannerGoals: []
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((state) => {
    localStorage.setItem('gworkspace_tracker_state_v4_virtual_banks', JSON.stringify(state));
  }, seededState);
});

test.describe('Vank frontend', () => {
  test('loads the dashboard and shows the ledger', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Vank/);
    await expect(page.locator('.cards-shelf-title')).toHaveText('Virtual Banks');
    await expect(page.locator('.ledger-heading')).toContainText('Ledger');
    await expect(page.locator('#ledger-count-tag')).toContainText(/entries/i);
  });

  test('opens the add transaction modal from the header action', async ({ page }) => {
    await page.goto('/');
    await page.locator('.open-add-modal-btn').first().click();

    await expect(page.locator('#transaction-modal')).toHaveClass(/active/);
    await expect(page.locator('#modal-title-text')).toHaveText('Add Transaction');
  });

  test('adds a transaction from the modal and updates the ledger UI', async ({ page }) => {
    await page.goto('/');
    await page.locator('.open-add-modal-btn').first().click();

    await page.locator('#tx-amount').fill('250');
    await page.locator('#tx-description').fill('Office lunch');
    await page.locator('#tx-category').selectOption('General');
    await page.locator('#tx-account').selectOption('Maya');
    await page.locator('#tx-date').fill('2026-10-10');
    await page.locator('#tx-memo').fill('team lunch');
    await page.locator('#transaction-form button[type="submit"]').click();

    await expect(page.locator('#transaction-modal')).not.toHaveClass(/active/);
    const officeLunchEntry = page.locator('#ledger-table-body .description-title', { hasText: 'Office lunch' }).first();
    await expect(officeLunchEntry).toBeVisible();
    await expect(page.locator('#ledger-table-body')).toContainText('Office lunch');
  });

  test('opens the budget modal and shows the new category limit', async ({ page }) => {
    await page.goto('/');
    await page.locator('.open-add-budget-btn').first().click();

    await expect(page.locator('#budget-modal')).toHaveClass(/active/);
    await page.locator('#budget-category-select').selectOption('General');
    await page.locator('#budget-limit-input').fill('5000');
    await page.locator('#budget-form button[type="submit"]').click();

    await expect(page.locator('#budget-modal')).not.toHaveClass(/active/);
    const generalBudget = page.locator('.budget-card-item').filter({ hasText: 'General' }).first();
    await expect(generalBudget).toContainText('General');
    await expect(generalBudget).toContainText('5,000');
  });
});
