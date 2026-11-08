import { test, expect } from '@playwright/test';
import { seededState, transaction } from './fixtures.js';

export function searchFeedbackState() {
  const state = seededState();
  state.virtualBanks.push({
    ...state.virtualBanks[0], id: 'bank-personal', name: 'GCash',
    classification: 'personal', brand: 'gcash', isPrimary: false
  });
  state.transactions = [
    transaction({ id: 'lunch-business', description: 'Office lunch', type: 'expense', amount: 250, category: 'General', memo: null }),
    transaction({ id: 'lunch-personal', description: 'Office lunch personal', type: 'expense', amount: 150,
      category: 'General', account: 'GCash', bankId: 'bank-personal', classification: 'personal', memo: '' }),
    transaction({ id: 'lunch-refund', description: 'Office lunch refund', amount: 100, category: 'General', memo: '' }),
    transaction({ id: 'office-supplies', description: 'Office supplies', type: 'expense', amount: 75,
      category: 'Equipment & Office', memo: 'paper' })
  ];
  return state;
}

export function registerSearchFeedbackTests({ seed, startPath = '/', browserOnly = false }) {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    test.describe(`Testing feedback at ${viewport.width}px`, () => {
      test.use({ viewport });
      let errors, apiRequests;
      test.beforeEach(async ({ page, request }) => {
        errors = [];
        apiRequests = [];
        page.on('pageerror', error => errors.push(error.message));
        if (browserOnly) page.on('request', request => {
          if (new URL(request.url()).pathname.includes('/api/')) apiRequests.push(request.url());
        });
        await seed({ page, request }, searchFeedbackState());
        await page.goto(startPath);
        await expect(page.locator('#overview')).toBeVisible();
      });
      test.afterEach(() => {
        expect(errors).toEqual([]);
        if (browserOnly) expect(apiRequests).toEqual([]);
      });

      test('finds existing transactions regardless of capitalization or outer spaces', async ({ page }) => {
        const search = page.locator('#global-search-input');
        for (const query of ['Office lunch', 'OFFICE LUNCH', 'oFfIcE LuNcH', '  office lunch  ']) {
          await search.fill(query);
          await expect(page.locator('#ledger')).toBeVisible();
          await expect(page.locator('#ledger-table-body tr')).toHaveCount(3);
          await expect(page.locator('tr[data-id="lunch-business"]')).toContainText('-₱250.00');
          await expect(page.locator('#ledger-empty-state')).toBeHidden();
        }
      });

      test('shows no matches and restores saved transactions when search is cleared', async ({ page }) => {
        await page.locator('#global-search-input').fill('no-such-transaction');
        await expect(page.locator('#ledger-table-body tr')).toHaveCount(0);
        await expect(page.locator('#ledger-count-tag')).toHaveText('0 entries');
        await expect(page.locator('#ledger-empty-state')).toContainText('No matching transactions');
        await page.locator('#global-search-input').fill('');
        await expect(page.locator('#ledger-table-body tr')).toHaveCount(4);
        await page.reload();
        await expect(page.locator('#ledger-table-body tr')).toHaveCount(4);
      });

      test('combines search with type, category and card filters and restores excluded matches', async ({ page }) => {
        await page.locator('#global-search-input').fill('office');
        await page.locator('.filter-btn[data-filter="expense"]').click();
        await expect(page.locator('#ledger-table-body tr')).toHaveCount(3);
        await page.locator('tr[data-id="lunch-business"] .chip-category').click();
        await expect(page.locator('#ledger-table-body tr')).toHaveCount(2);
        await page.locator('tr[data-id="lunch-personal"] .chip-account').click();
        await expect(page.locator('#ledger-table-body tr')).toHaveCount(1);
        await expect(page.locator('tr[data-id="lunch-personal"]')).toBeVisible();
        await expect(page.locator('[data-clear-filter="bank"]')).toContainText('GCash');
        await page.locator('.filter-btn[data-filter="income"]').click();
        await expect(page.locator('#ledger-empty-state')).toContainText('No matching transactions');
        await page.locator('[data-clear-filter="bank"]').click();
        await expect(page.locator('#ledger-table-body tr')).toHaveCount(1);
        await expect(page.locator('tr[data-id="lunch-refund"]')).toBeVisible();
        await page.locator('[data-clear-filter="category"]').click();
        await page.locator('.filter-btn[data-filter="all"]').click();
        await expect(page.locator('#ledger-table-body tr')).toHaveCount(4);
      });

      test('returns from Ledger to Overview using the visible navigation', async ({ page }) => {
        await page.locator('#global-search-input').fill('Office lunch');
        await expect(page.locator('#ledger')).toBeVisible();
        const selector = viewport.width < 760 ? '.mobile-dock-btn' : '.rail-link';
        await page.locator(`${selector}[data-page="overview"]`).click();
        await expect(page.locator('#overview')).toBeVisible();
        await expect(page.locator('.workspace-page:visible')).toHaveCount(1);
        await expect(page).toHaveURL(/#overview$/);
        await page.reload();
        await expect(page.locator('#overview')).toBeVisible();
      });
    });
  }
}
