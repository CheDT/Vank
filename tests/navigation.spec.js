import { test, expect } from '@playwright/test';
import { seededState, transaction } from './helpers/fixtures.js';

function populatedState() {
  const data = seededState();
  data.virtualBanks.push(
    { ...data.virtualBanks[0], id: 'bank-bdo', name: 'BDO Business', brand: 'bdo', gradient: 'gradient-obsidian', initialBalance: 2000, balance: 2000, isPrimary: false },
    { ...data.virtualBanks[0], id: 'bank-personal', name: 'Personal savings', classification: 'personal', brand: 'gcash', gradient: 'gradient-midnight', initialBalance: 500, balance: 500, isPrimary: false }
  );
  data.transactions = [transaction(), transaction({ id: 'tx-expense', type: 'expense', amount: 250, category: 'General', description: 'A long transaction description that should wrap naturally on a narrow phone screen', taxDeductible: true })];
  return data;
}

test.beforeEach(async ({ request }) => {
  expect((await request.post('/api/state', { data: populatedState() })).ok()).toBe(true);
});

async function navigate(page, tab) {
  await page.locator(`.rail-link[data-page="${tab}"]:visible, .mobile-dock-btn[data-page="${tab}"]:visible`).click();
  await expect(page.locator(`#${tab}`)).toBeVisible();
  await expect(page.locator('.workspace-page:visible')).toHaveCount(1);
}

async function checkOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}

test('opens Overview by default and keeps every tab on its own page', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#overview')).toBeVisible();
  await expect(page.locator('#ledger')).toBeHidden();
  await expect(page.locator('#planning')).toBeHidden();
  await expect(page.locator('[id*="tutorial"], #btn-show-guide, #mobile-action-guide')).toHaveCount(0);
  for (const tab of ['banks', 'ledger', 'planning']) await navigate(page, tab);
  await page.reload();
  await expect(page.locator('#planning')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#ledger')).toBeVisible();
  await page.locator('#brand-home-link').click();
  await expect(page.locator('#overview')).toBeVisible();
  expect(errors).toEqual([]);
});

test('keeps the compact cards centered and moves them when clicked or keyboard activated', async ({ page }) => {
  await page.goto('/');
  const front = page.locator('#virtual-cards-rack .debit-card.is-front');
  await expect(front).toHaveAttribute('data-bank-id', 'bank-primary');
  await expect(front.locator('.card-emv-chip')).toBeVisible();
  await expect(front.locator('.visa-logo-svg')).toBeVisible();
  await expect(front.locator('.card-holder-name')).toHaveText('TEST USER');
  await expect(front.locator('.card-balance-label')).toHaveText('Balance');
  const centered = () => page.locator('#virtual-cards-rack').evaluate(rack => {
    const bounds = rack.getBoundingClientRect();
    const cards = [...rack.querySelectorAll('.debit-card')].map(card => card.getBoundingClientRect());
    return Math.abs((Math.min(...cards.map(card => card.left)) + Math.max(...cards.map(card => card.right))) / 2 - (bounds.left + bounds.right) / 2);
  });
  await expect.poll(centered).toBeLessThan(2);
  const before = await page.locator('[data-bank-id="bank-primary"]').first().evaluate(card => card.style.transform);
  await front.click();
  await expect(front).toHaveAttribute('data-bank-id', 'bank-bdo');
  expect(await page.locator('[data-bank-id="bank-primary"]').first().evaluate(card => card.style.transform)).not.toBe(before);
  await expect.poll(centered).toBeLessThan(2);
  await front.focus();
  await page.keyboard.press('Enter');
  await expect(front).toHaveAttribute('data-bank-id', 'bank-personal');
  await page.locator('#btn-all-cards-view').click();
  await expect(page.locator('#ledger-count-tag')).toHaveText('2 entries');
});

test('keeps the account at the rail bottom and returns focus when dismissed', async ({ page }) => {
  await page.goto('/');
  const account = page.locator('#user-avatar-btn');
  const bounds = await account.boundingBox();
  expect(bounds.y).toBeGreaterThan(page.viewportSize().height - 80);
  await account.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#account-popover')).toBeVisible();
  await expect(page.locator('#btn-repersonalize')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#account-popover')).toBeHidden();
  await expect(account).toBeFocused();
  const home = page.locator('.rail-link[data-page="overview"]');
  await home.focus();
  expect(await home.evaluate(link => getComputedStyle(link).outlineStyle)).not.toBe('none');
});

test('reflows all pages at phone, tablet and desktop widths without horizontal overflow', async ({ page }) => {
  await page.goto('/');
  for (const width of [320, 390, 600, 760, 820, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const tab of ['overview', 'banks', 'ledger', 'planning']) {
      await navigate(page, tab);
      await checkOverflow(page);
    }
  }
});

test('mobile account opens, traps keyboard focus and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#mobile-dock-menu-btn').click();
  await expect(page.locator('#mobile-app-menu-sheet')).toBeVisible();
  await expect(page.locator('#btn-close-mobile-menu')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#mobile-action-clear')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#btn-close-mobile-menu')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-app-menu-sheet')).toBeHidden();
  await expect(page.locator('#mobile-dock-menu-btn')).toBeFocused();
  await checkOverflow(page);
});

test('mobile dock expands only the selected destination and slides its indicator', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  const dock = page.locator('#mobile-bottom-dock');
  const buttons = dock.locator('.mobile-dock-btn');
  const indicator = dock.locator('.mobile-dock-indicator');
  const indicatorMatches = () => dock.evaluate(nav => {
    const selected = nav.querySelector('.active').getBoundingClientRect();
    const background = nav.querySelector('.mobile-dock-indicator').getBoundingClientRect();
    return Math.abs(selected.left - background.left) + Math.abs(selected.width - background.width);
  });
  await expect.poll(indicatorMatches).toBeLessThan(2);
  const initialPosition = await indicator.evaluate(el => el.style.transform);
  for (const tab of ['banks', 'ledger', 'planning', 'overview']) {
    await navigate(page, tab);
    await expect(dock.locator('.active')).toHaveCount(1);
    await expect.poll(indicatorMatches).toBeLessThan(2);
    const dimensions = await buttons.evaluateAll(items => items.map(item => ({
      active: item.classList.contains('active'), width: item.getBoundingClientRect().width,
      labelOpacity: getComputedStyle(item.querySelector('.dock-label')).opacity,
      radius: getComputedStyle(item).borderRadius
    })));
    for (const item of dimensions) {
      expect(item.labelOpacity).toBe(item.active ? '1' : '0');
      expect(item.width).toBe(item.active ? dimensions.find(i => i.active).width : 48);
      if (!item.active) expect(item.radius).toBe('50%');
    }
    await checkOverflow(page);
  }
  await navigate(page, 'ledger');
  await expect.poll(() => indicator.evaluate(el => el.style.transform)).not.toBe(initialPosition);
  await page.getByRole('button', { name: 'More', exact: true }).click();
  await expect(page.locator('#mobile-account-title')).toHaveText('More');
});

test('mobile dock hides scrolling down and returns scrolling up', async ({ page, request }) => {
  const data = populatedState();
  data.transactions = Array.from({ length: 24 }, (_, index) => transaction({ id: `scroll-${index}`, description: `Transaction ${index}` }));
  await request.post('/api/state', { data });
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('/#ledger');
  const dock = page.locator('#mobile-bottom-dock');
  await expect(page.locator('#ledger-count-tag')).toHaveText('24 entries');
  await page.mouse.move(200, 300);
  await page.mouse.wheel(0, 500);
  await expect(dock).toHaveClass(/dock-hidden/);
  expect(await dock.evaluate(el => el.inert)).toBe(true);
  await page.mouse.wheel(0, -120);
  await expect(dock).not.toHaveClass(/dock-hidden/);
  expect(await dock.evaluate(el => el.inert)).toBe(false);
  await navigate(page, 'overview');
  await expect(dock).not.toHaveClass(/dock-hidden/);
});

test('mobile forms fill the screen and keep actions visible while the fields scroll', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  for (const [trigger, modal] of [
    ['.header-right .open-add-modal-btn', '#transaction-modal'],
    ['#cards-section .open-add-bank-trigger', '#add-bank-modal'],
    ['#virtual-cards-rack .is-front .btn-card-menu', '#add-bank-modal'],
    ['#mobile-app-menu-sheet .open-add-budget-btn', '#budget-modal']
  ]) {
    if (modal === '#budget-modal') await page.locator('#mobile-dock-menu-btn').click();
    await page.locator(trigger).click();
    const dialog = page.locator(modal);
    await expect(dialog).toBeVisible();
    await expect.poll(() => dialog.locator('.modal-container').boundingBox()).toEqual({ x: 0, y: 0, width: 320, height: 640 });
    await dialog.locator('.modal-body').evaluate(body => { body.scrollTop = body.scrollHeight; });
    const footer = await dialog.locator('.modal-footer').boundingBox();
    expect(footer.y + footer.height).toBe(640);
    expect(await dialog.locator('.modal-container').evaluate(container => container.scrollWidth - container.clientWidth)).toBeLessThanOrEqual(1);
    await expect(dialog.locator('.modal-footer button[type="submit"]')).toBeVisible();
    expect(await dialog.locator('.modal-close-btn').evaluate(button => getComputedStyle(button).borderRadius)).toBe('50%');
    await checkOverflow(page);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    if (modal === '#budget-modal') await expect(page.locator('#mobile-dock-menu-btn')).toBeFocused();
  }
});

test('mobile cards stay centered, compact and cycle with reduced motion enabled', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const front = page.locator('#virtual-cards-rack .is-front');
  await expect(front).toHaveAttribute('data-bank-id', 'bank-primary');
  const bounds = await front.boundingBox();
  expect(bounds.width).toBeLessThanOrEqual(320);
  expect(bounds.height).toBeLessThanOrEqual(200);
  expect(Math.abs(bounds.x + bounds.width / 2 - 160)).toBeLessThan(2);
  await front.click();
  await expect(front).toHaveAttribute('data-bank-id', 'bank-bdo');
  expect(await front.evaluate(card => getComputedStyle(card).transitionDuration)).toBe('0s');
});

test('profile setup keeps each step usable on a phone and saves the chosen bank', async ({ page, request }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await page.locator('#mobile-dock-menu-btn').click();
  await page.locator('#mobile-action-setup').click();
  const setup = page.locator('#onboarding-overlay');
  await expect(setup).toBeVisible();
  await page.locator('#onboard-name-input').fill('Phone User');
  for (let step = 1; step <= 5; step++) {
    await expect(page.locator(`#step-${step}`)).toBeVisible();
    await checkOverflow(page);
    const actions = await page.locator('.onboarding-center-actions').boundingBox();
    expect(actions.y + actions.height).toBe(640);
    if (step === 2) await page.locator('[data-mode="personal"]').click();
    if (step === 4) {
      await page.locator('.onboard-bank-brand-btn[data-brand="bdo"]').click();
      await page.locator('#onboard-card-holder-input').fill('Phone User');
    }
    await page.locator('#btn-onboard-next').click();
  }
  await expect(setup).toBeHidden();
  await expect.poll(async () => (await (await request.get('/api/state')).json()).userProfile.name).toBe('Phone User');
  await expect(page.locator('.debit-card.is-front .card-holder-name')).toHaveText('PHONE USER');
});

test('page and dialog entrances stay smooth and honor reduced motion', async ({ page }) => {
  await page.goto('/');
  await navigate(page, 'banks');
  expect(await page.locator('#banks').evaluate(el => getComputedStyle(el).animationName)).toBe('view-enter');
  await expect.poll(() => page.locator('#banks').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  await page.locator('.header-right .open-add-modal-btn').click();
  expect(await page.locator('#transaction-modal .modal-container').evaluate(el => getComputedStyle(el).animationName)).toBe('surface-enter');
  await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await navigate(page, 'planning');
  expect(await page.locator('#planning').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.locator('.header-right .open-add-modal-btn').click();
  expect(await page.locator('#transaction-modal .modal-container').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await expect(page.locator('#tx-amount')).toBeVisible();
});

test('search opens the ledger, workspace filters work and export downloads real rows', async ({ page }) => {
  await page.goto('/');
  await page.locator('#global-search-input').fill('Client payment');
  await expect(page.locator('#ledger')).toBeVisible();
  await expect(page.locator('#ledger-count-tag')).toHaveText('1 entries');
  const downloaded = page.waitForEvent('download');
  await page.locator('#btn-export-csv').click();
  expect((await downloaded).suggestedFilename()).toMatch(/^vank-ledger-/);
  await page.locator('#global-search-input').fill('');
  await page.locator('#btn-workspace-dropdown').click();
  await page.locator('[data-workspace="personal"]').click();
  await expect(page.locator('#ledger-empty-state')).toContainText('No matching transactions');
  await page.locator('#btn-workspace-dropdown').click();
  await page.locator('[data-workspace="all"]').click();
  await expect(page.locator('#ledger-count-tag')).toHaveText('2 entries');
});

test('bank management, profile setup and account data actions retain their behavior', async ({ page, request }) => {
  await page.goto('/#banks');
  await page.locator('[data-manage-bank="bank-primary"]').click();
  await expect(page.locator('#add-bank-modal')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#add-bank-modal')).toBeHidden();
  await page.locator('#user-avatar-btn').click();
  await page.locator('#btn-repersonalize').click();
  await expect(page.locator('#onboarding-overlay')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#onboarding-overlay')).toBeHidden();
  await page.locator('#user-avatar-btn').click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#btn-clear-transactions').click();
  await expect.poll(async () => (await (await request.get('/api/state')).json()).transactions.length).toBe(0);
  await page.locator('#user-avatar-btn').click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#btn-reset-demo').click();
  await expect.poll(async () => (await (await request.get('/api/state')).json()).transactions.length).toBeGreaterThan(0);
  await page.locator('#user-avatar-btn').click();
  await page.locator('#btn-new-profile').click();
  await expect(page.locator('#onboarding-overlay')).toBeVisible();
  await expect.poll(async () => (await (await request.get('/api/state')).json()).transactions.length).toBe(0);
});

test('shows the offline state and its retry control without losing cached records', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#overview-transactions')).toContainText('Client payment');
  await page.route('**/api/**', route => route.abort());
  await page.reload();
  await expect(page.locator('#app-status')).toContainText('Can’t reach the local server');
  await expect(page.locator('#app-status button')).toHaveText('Retry');
  await expect(page.locator('#overview-transactions')).toContainText('Client payment');
  await page.locator('#app-status button').click();
  await expect(page.locator('#overview-transactions')).toContainText('Client payment');
});
