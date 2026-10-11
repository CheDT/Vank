export const STORAGE_KEY = 'gworkspace_tracker_state_v4_virtual_banks';

export function seededState() {
  return {
    userProfile: {
      name: 'Test User', email: 'test@example.com', workspaceName: 'Vank',
      workspaceMode: 'hybrid', currency: '₱', currencyCode: 'PHP',
      onboardingComplete: true, tutorialDismissed: true
    },
    activeWorkspace: 'all', activeVirtualBankId: 'all',
    transactions: [], budgets: [],
    virtualBanks: [{
      id: 'bank-primary', name: 'Maya', network: 'visa', classification: 'business',
      gradient: 'gradient-emerald', initialBalance: 0, balance: 0,
      brand: 'maya', cardHolder: 'Test User', last4: '9104', isPrimary: true
    }],
    plannerSettings: {}, recurringPlans: [], plannerGoals: []
  };
}

export function transaction(overrides = {}) {
  return {
    id: 'tx-test', date: '2026-10-10', description: 'Client payment',
    memo: 'Invoice', type: 'income', amount: 5000, category: 'Client Revenue',
    account: 'Maya', bankId: 'bank-primary', classification: 'business',
    taxDeductible: false, client: 'Acme', ...overrides
  };
}
