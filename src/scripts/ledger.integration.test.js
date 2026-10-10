import { describe, it, expect, beforeEach } from 'vitest';
import { renderLedger } from './ledger.js';
import { StateManager } from './state.js';

describe('Ledger UI rendering', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div>
        <table><tbody id="ledger-table-body"></tbody></table>
        <div id="ledger-empty-state" style="display:none"></div>
        <span id="ledger-count-tag"></span>
      </div>
    `;
    localStorage.clear();
  });

  it('renders transaction rows and count for the active ledger state', () => {
    const state = new StateManager();
    state.userProfile = { ...state.userProfile, currency: '₱' };
    state.virtualBanks = [{
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
    }];
    state.transactions = [{
      id: 'tx-1',
      date: '2026-10-10',
      description: 'Client payment',
      memo: 'invoice #104',
      type: 'income',
      amount: 5000,
      category: 'Client Revenue',
      account: 'Maya',
      bankId: 'bank-1',
      classification: 'business',
      taxDeductible: false,
      client: 'Acme Studio'
    }];

    const tableBody = document.getElementById('ledger-table-body');
    const countEl = document.getElementById('ledger-count-tag');

    renderLedger(state, tableBody, countEl);

    expect(countEl.textContent).toBe('1 entries');
    expect(tableBody.innerHTML).toContain('Client payment');
    expect(tableBody.innerHTML).toContain('+₱5,000.00');
  });

  it('renders empty state when ledger is filtered to no transactions', () => {
    const state = new StateManager();
    state.transactions = [];
    state.filter = { ...state.filter, classification: 'business' };

    const tableBody = document.getElementById('ledger-table-body');
    const countEl = document.getElementById('ledger-count-tag');

    renderLedger(state, tableBody, countEl);

    expect(countEl.textContent).toBe('0 entries');
    expect(tableBody.innerHTML).toBe('');
  });
});
