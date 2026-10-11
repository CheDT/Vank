import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { renderLedger } from './ledger.js';
import { StateManager, state } from './state.js';
import { api } from './api.js';
import { seededState, transaction } from '../../tests/helpers/fixtures.js';

vi.mock('./api.js', () => ({
  api: { loadState: vi.fn(async () => null), saveState: vi.fn(async () => ({ ok: true })) }
}));

let manager;
beforeAll(async () => { await state.ready; await state.pendingSave; });
beforeEach(async () => {
  localStorage.clear();
  document.body.innerHTML = '<table><tbody id="ledger-table-body"></tbody></table><div id="ledger-empty-state"></div><span id="ledger-count-tag"></span>';
  api.loadState.mockResolvedValue(seededState());
  manager = new StateManager();
  await manager.ready;
});
afterEach(async () => { await manager.pendingSave; });

function render() {
  renderLedger(manager, document.getElementById('ledger-table-body'), document.getElementById('ledger-count-tag'));
}

describe('Ledger UI rendering', () => {
  it('renders transaction descriptions, amounts and the row count', () => {
    manager.transactions = [transaction()];
    render();
    expect(document.getElementById('ledger-count-tag').textContent).toBe('1 entries');
    expect(document.getElementById('ledger-table-body').textContent).toContain('+₱5,000.00');
    expect(document.querySelector('.description-title').textContent.trim()).toBe('Client payment');
    expect(document.getElementById('ledger-empty-state').style.display).toBe('none');
  });

  it('shows the empty state when a filter excludes all transactions', () => {
    manager.transactions = [transaction()];
    manager.setFilter({ type: 'expense' });
    render();
    expect(document.getElementById('ledger-count-tag').textContent).toBe('0 entries');
    expect(document.getElementById('ledger-table-body').innerHTML).toBe('');
    expect(document.getElementById('ledger-empty-state').style.display).toBe('flex');
  });

  it('renders user descriptions as text instead of executable HTML', () => {
    manager.transactions = [transaction({ description: '<img src=x onerror=alert(1)>' })];
    render();
    expect(document.querySelector('.description-title').textContent.trim()).toBe('<img src=x onerror=alert(1)>');
    expect(document.querySelector('#ledger-table-body img')).toBeNull();
  });
});
