import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { StateManager, state } from './state.js';
import { api } from './api.js';
import { seededState, transaction, STORAGE_KEY } from '../../tests/helpers/fixtures.js';

vi.mock('./api.js', () => ({
  api: { loadState: vi.fn(async () => null), saveState: vi.fn(async () => ({ ok: true })) }
}));

const managers = [];
async function createManager() {
  const manager = new StateManager();
  managers.push(manager);
  await manager.ready;
  return manager;
}

beforeAll(async () => { await state.ready; await state.pendingSave; });
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  api.loadState.mockResolvedValue(seededState());
  api.saveState.mockResolvedValue({ ok: true });
});
afterEach(async () => {
  await Promise.all(managers.splice(0).map(manager => manager.pendingSave));
});

describe('StateManager integration', () => {
  it('loads server data and caches it for offline use', async () => {
    const saved = seededState();
    saved.transactions = [transaction()];
    api.loadState.mockResolvedValue(saved);
    const manager = await createManager();
    expect(manager.userProfile.name).toBe('Test User');
    expect(manager.virtualBanks[0].balance).toBe(5000);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).transactions).toHaveLength(1);
  });

  it('shows cached balances immediately while the server request is pending', async () => {
    const cached = seededState();
    cached.transactions = [transaction()];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    let release;
    api.loadState.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    const manager = new StateManager();
    managers.push(manager);
    expect(manager.hasLoadedData).toBe(true);
    expect(manager.dataStatus).toBe('loading');
    expect(manager.virtualBanks[0].balance).toBe(5000);
    const updated = seededState();
    updated.transactions = [transaction({ amount: 6000 })];
    release(updated);
    await manager.ready;
    expect(manager.dataStatus).toBe('ready');
    expect(manager.virtualBanks[0].balance).toBe(6000);
  });

  it('retries an offline snapshot without reloading or adding another transaction', async () => {
    const manager = await createManager();
    api.saveState.mockRejectedValueOnce(new Error('offline'));
    manager.addTransaction(transaction());
    await manager.pendingSave;
    expect(manager.saveStatus).toBe('local');
    expect(localStorage.getItem(`${STORAGE_KEY}_pending`)).toBe('1');
    await manager.retrySync();
    expect(manager.saveStatus).toBe('saved');
    expect(manager.connectionStatus).toBe('connected');
    expect(manager.transactions).toHaveLength(1);
    expect(api.saveState.mock.lastCall[0].transactions).toHaveLength(1);
    expect(api.loadState).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(`${STORAGE_KEY}_pending`)).toBeNull();
  });

  it('syncs pending browser edits after reload instead of replacing them with older server data', async () => {
    const cached = seededState();
    cached.transactions = [transaction()];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    localStorage.setItem(`${STORAGE_KEY}_pending`, '1');
    const manager = await createManager();
    expect(manager.transactions).toHaveLength(1);
    expect(manager.virtualBanks[0].balance).toBe(5000);
    expect(api.saveState.mock.lastCall[0].transactions[0].description).toBe('Client payment');
    expect(manager.saveStatus).toBe('saved');
    expect(localStorage.getItem(`${STORAGE_KEY}_pending`)).toBeNull();
  });

  it('keeps new edits when an older refresh response arrives after their save', async () => {
    const manager = await createManager();
    let release;
    api.loadState.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    const refresh = manager.retrySync();
    expect(manager.dataStatus).toBe('refreshing');
    manager.addTransaction(transaction());
    await manager.pendingSave;
    release(seededState());
    await refresh;
    expect(manager.transactions).toHaveLength(1);
    expect(manager.virtualBanks[0].balance).toBe(5000);
    expect(manager.dataStatus).toBe('ready');
  });

  it('does not claim a local save when both browser storage and the server fail', async () => {
    const manager = await createManager();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    api.saveState.mockRejectedValueOnce(new Error('offline'));
    manager.addTransaction(transaction());
    await manager.pendingSave;
    expect(manager.saveStatus).toBe('error');
    expect(manager.browserSaveAvailable).toBe(false);
    expect(manager.unsyncedChanges).toBe(true);
    expect(manager.transactions).toHaveLength(1);
  });

  it('adds income, updates the card balance and saves a complete snapshot', async () => {
    const manager = await createManager();
    manager.addTransaction(transaction({ amount: '5000' }));
    await manager.pendingSave;
    expect(manager.getMetrics().totalIncome).toBe(5000);
    expect(manager.virtualBanks[0].balance).toBe(5000);
    expect(api.saveState.mock.lastCall[0].transactions[0].amount).toBe(5000);
  });

  it('recalculates balances and budgets when expenses are edited and deleted', async () => {
    const manager = await createManager();
    manager.setBudget({ category: 'Cloud & Tech', limit: 12000 });
    const first = manager.addTransaction(transaction({ type: 'expense', amount: 2500, category: 'Cloud & Tech', taxDeductible: true }));
    const second = manager.addTransaction(transaction({ type: 'expense', amount: 7500, category: 'Cloud & Tech', taxDeductible: true }));
    expect(manager.budgets[0].spent).toBe(10000);
    expect(manager.getMetrics().taxDeductibleTotal).toBe(10000);
    manager.updateTransaction(first.id, { amount: 1000 });
    manager.deleteTransaction(second.id);
    expect(manager.budgets[0].spent).toBe(1000);
    expect(manager.virtualBanks[0].balance).toBe(-1000);
  });

  it('keeps opening deposits from being counted twice', async () => {
    const manager = await createManager();
    const bank = manager.addVirtualBank({ name: 'GCash', initialBalance: 1000 });
    expect(bank.balance).toBe(1000);
    manager.addTransaction(transaction({ bankId: bank.id, account: bank.name, type: 'expense', amount: 250 }));
    expect(bank.balance).toBe(750);
  });

  it('filters the ledger and metrics by transaction type', async () => {
    const manager = await createManager();
    manager.addTransaction(transaction());
    manager.addTransaction(transaction({ type: 'expense', amount: 250 }));
    manager.setFilter({ type: 'expense' });
    expect(manager.getFilteredTransactions()).toHaveLength(1);
    expect(manager.getMetrics().totalIncome).toBe(0);
    expect(manager.getMetrics().totalExpense).toBe(250);
  });

  it('saves planner settings, recurring plans and goals', async () => {
    const manager = await createManager();
    manager.setPlannerSettings({ savingsTarget: 10000 });
    manager.addRecurringPlan({ name: 'Internet', amount: 1500 });
    manager.addPlannerGoal({ name: 'Emergency fund', targetAmount: 10000 });
    await manager.pendingSave;
    const saved = api.saveState.mock.lastCall[0];
    expect(saved.plannerSettings.savingsTarget).toBe(10000);
    expect(saved.recurringPlans[0].name).toBe('Internet');
    expect(saved.plannerGoals[0].targetAmount).toBe(10000);
  });

  it('loads browser data when the API is unavailable', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seededState()));
    api.loadState.mockRejectedValueOnce(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const manager = await createManager();
    expect(manager.userProfile.name).toBe('Test User');
    expect(manager.transactions).toEqual([]);
  });

  it('keeps failed saves in browser storage without an unhandled rejection', async () => {
    const manager = await createManager();
    api.saveState.mockRejectedValueOnce(new Error('offline'));
    manager.addTransaction(transaction());
    await expect(manager.pendingSave).resolves.toBeUndefined();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).transactions[0].amount).toBe(5000);
  });

  it('starts a fresh profile when neither server nor browser data exists', async () => {
    api.loadState.mockResolvedValueOnce(null);
    const manager = await createManager();
    expect(manager.userProfile.onboardingComplete).toBe(false);
    expect(manager.transactions).toEqual([]);
    expect(api.saveState).toHaveBeenCalledTimes(1);
  });

  it('remains usable when browser storage is blocked', async () => {
    api.loadState.mockRejectedValueOnce(new Error('offline'));
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const manager = await createManager();
    expect(manager.userProfile.onboardingComplete).toBe(false);
    expect(api.saveState).toHaveBeenCalledTimes(1);
  });

  it('sends immutable snapshots in edit order', async () => {
    const manager = await createManager();
    let release;
    let releaseSecond;
    api.saveState.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    api.saveState.mockImplementationOnce(() => new Promise(resolve => { releaseSecond = resolve; }));
    const tx = manager.addTransaction(transaction({ amount: 100 }));
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    manager.updateTransaction(tx.id, { amount: 250 });
    expect(api.saveState).toHaveBeenCalledTimes(1);
    expect(api.saveState.mock.calls[0][0].transactions[0].amount).toBe(100);
    release({ ok: true });
    await vi.waitFor(() => expect(releaseSecond).toBeTypeOf('function'));
    expect(manager.saveStatus).toBe('saving');
    releaseSecond({ ok: true });
    await manager.pendingSave;
    expect(manager.saveStatus).toBe('saved');
    expect(api.saveState.mock.calls[1][0].transactions[0].amount).toBe(250);
  });
});
