import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from './state.js';

describe('StateManager integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds income transactions and updates bank balances', () => {
    const manager = new StateManager();
    manager.virtualBanks = [
      {
        id: 'bank-1',
        name: 'Maya',
        network: 'visa',
        brand: 'maya',
        classification: 'business',
        gradient: 'gradient-emerald',
        cardHolder: 'User',
        last4: '1234',
        initialBalance: 0,
        balance: 0,
        isPrimary: true
      }
    ];

    manager.addTransaction({
      description: 'Client payment',
      memo: 'invoice #104',
      type: 'income',
      amount: '5000',
      category: 'Client Revenue',
      account: 'Maya',
      bankId: 'bank-1',
      classification: 'business',
      taxDeductible: false,
      client: 'Acme Studio'
    });

    expect(manager.transactions[0].description).toBe('Client payment');
    expect(manager.getMetrics().totalIncome).toBe(5000);
    expect(manager.virtualBanks[0].balance).toBe(5000);
  });

  it('calculates budget burn from expense transactions', () => {
    const manager = new StateManager();
    manager.virtualBanks = [
      {
        id: 'bank-1',
        name: 'Maya',
        network: 'visa',
        brand: 'maya',
        classification: 'business',
        gradient: 'gradient-emerald',
        cardHolder: 'User',
        last4: '1234',
        initialBalance: 0,
        balance: 0,
        isPrimary: true
      }
    ];
    manager.budgets = [{ category: 'Cloud & Tech', limit: 12000, spent: 0 }];

    manager.addTransaction({
      description: 'AWS',
      memo: 'monthly hosting',
      type: 'expense',
      amount: '2500',
      category: 'Cloud & Tech',
      account: 'Maya',
      bankId: 'bank-1',
      classification: 'business',
      taxDeductible: true,
      client: 'Internal Infra'
    });

    manager.addTransaction({
      description: 'GitHub Enterprise',
      memo: 'team seats',
      type: 'expense',
      amount: '7500',
      category: 'Cloud & Tech',
      account: 'Maya',
      bankId: 'bank-1',
      classification: 'business',
      taxDeductible: true,
      client: 'Engineering'
    });

    expect(manager.budgets[0].spent).toBe(10000);
    expect(manager.getMetrics().totalExpense).toBe(10000);
    expect(manager.getMetrics().taxDeductibleTotal).toBe(10000);
  });
});
