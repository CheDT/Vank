import { state } from './state.js';
import { OnboardingWizard } from './onboarding.js';
import { TransactionModal } from './modal.js';
import { BankModal } from './bankModal.js';
import { BudgetModal } from './budgetModal.js';
import { TutorialGuide } from './tutorial.js';
import { WorkspaceController } from './workspace.js';
import { PlannerPanel } from './planner.js';
import { renderLedger } from './ledger.js';
import { renderAnalytics } from './charts.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Subsystems
  const onboarding = new OnboardingWizard(state);
  const modal = new TransactionModal(state);
  const bankModal = new BankModal(state);
  const budgetModal = new BudgetModal(state);
  const workspace = new WorkspaceController(state, onboarding, bankModal);
  const planner = new PlannerPanel(state, budgetModal);
  const tutorial = new TutorialGuide(state, modal, bankModal, budgetModal);

  // Auto-launch conversational onboarding for fresh users
  if (!state.userProfile.onboardingComplete) {
    setTimeout(() => onboarding.show(1), 300);
  }

  // 2. Elements Cache
  const ledgerTableBody = document.getElementById('ledger-table-body');
  const ledgerCountEl = document.getElementById('ledger-count-tag');
  const analyticsContainer = document.getElementById('analytics-container');

  // Summary Metrics Elements
  const statNetBalance = document.getElementById('metric-net-balance');
  const statCashIn = document.getElementById('metric-cash-in');
  const statCashOut = document.getElementById('metric-cash-out');
  const statTaxDeductible = document.getElementById('metric-tax-deductible');
  const plannerContainer = document.getElementById('planner-dashboard');

  // Filter Segmented Buttons in Ledger Header
  const segmentedFilterBtns = document.querySelectorAll('.filter-btn[data-filter]');
  segmentedFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      segmentedFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.dataset.filter;
      if (filterVal === 'all') {
        state.setFilter({ classification: 'all', type: 'all' });
      } else if (filterVal === 'business') {
        state.setFilter({ classification: 'business', type: 'all' });
      } else if (filterVal === 'personal') {
        state.setFilter({ classification: 'personal', type: 'all' });
      } else if (filterVal === 'income') {
        state.setFilter({ type: 'income', classification: 'all' });
      } else if (filterVal === 'expense') {
        state.setFilter({ type: 'expense', classification: 'all' });
      }
    });
  });

  // FAB / Add Transaction Triggers
  const openModalBtns = document.querySelectorAll('.open-add-modal-btn');
  openModalBtns.forEach(btn => {
    btn.addEventListener('click', () => modal.open());
  });

  // Table Row Action Delegations (Edit, Duplicate, Delete, Category Filter, Bank Filter)
  ledgerTableBody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-tx-btn');
    if (editBtn) {
      const id = editBtn.dataset.id;
      modal.open(id);
      return;
    }

    const duplicateBtn = e.target.closest('.duplicate-tx-btn');
    if (duplicateBtn) {
      const id = duplicateBtn.dataset.id;
      const original = state.transactions.find(t => t.id === id);
      if (original) {
        state.addTransaction({
          ...original,
          description: `${original.description} (Copy)`,
          date: new Date().toISOString().split('T')[0]
        });
      }
      return;
    }

    const deleteBtn = e.target.closest('.delete-tx-btn');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (confirm('Delete this transaction permanently?')) {
        state.deleteTransaction(id);
      }
      return;
    }

    // Click Category Chip to Filter / Toggle
    const categoryChip = e.target.closest('.chip-category');
    if (categoryChip) {
      const cat = categoryChip.dataset.category;
      if (cat) {
        if (state.filter.category === cat) {
          state.setFilter({ category: 'all' });
        } else {
          state.setFilter({ category: cat });
        }
      }
      return;
    }

    // Click Account Chip to Filter by Card / Toggle
    const accountChip = e.target.closest('.chip-account');
    if (accountChip) {
      const bankId = accountChip.dataset.bankId;
      const bankName = accountChip.dataset.account;
      const bank = (state.virtualBanks || []).find(b => (bankId && b.id === bankId) || b.name === bankName);
      if (bank) {
        if (state.activeVirtualBankId === bank.id) {
          state.setActiveVirtualBank('all');
        } else {
          state.setActiveVirtualBank(bank.id);
        }
      }
      return;
    }
  });

  // Category Breakdown & Budget Triggers
  document.addEventListener('click', (e) => {
    if (e.target.closest('.open-add-budget-btn')) {
      budgetModal.open();
      return;
    }

    const delBudgetBtn = e.target.closest('.delete-budget-trigger');
    if (delBudgetBtn) {
      const cat = delBudgetBtn.dataset.category;
      if (confirm(`Remove monthly budget limit for "${cat}"?`)) {
        state.deleteBudget(cat);
      }
      return;
    }

    // Click Category Breakdown Row to Filter / Toggle
    const breakdownRow = e.target.closest('.breakdown-row');
    if (breakdownRow) {
      const cat = breakdownRow.dataset.category;
      if (cat) {
        if (state.filter.category === cat) {
          state.setFilter({ category: 'all' });
        } else {
          state.setFilter({ category: cat });
        }
      }
      return;
    }

    // Click Budget Card Item to Filter by Category
    const budgetCardItem = e.target.closest('.budget-card-item');
    if (budgetCardItem && !e.target.closest('.delete-budget-trigger')) {
      const cat = budgetCardItem.dataset.category;
      if (cat) {
        if (state.filter.category === cat) {
          state.setFilter({ category: 'all' });
        } else {
          state.setFilter({ category: cat });
        }
      }
      return;
    }
  });

  // Re-open Tutorial Guide trigger in Account Popover
  const showGuideBtn = document.getElementById('btn-show-guide');
  if (showGuideBtn) {
    showGuideBtn.addEventListener('click', () => {
      const popover = document.getElementById('account-popover');
      if (popover) popover.classList.remove('active');
      tutorial.show();
    });
  }

  // Keyboard Shortcuts: 'n' for new transaction
  window.addEventListener('keydown', (e) => {
    const isModalOpen = document.querySelector('.modal-backdrop.active') || document.querySelector('.onboarding-overlay.active');
    const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    
    if (e.key.toLowerCase() === 'n' && !isModalOpen && !isInputActive) {
      e.preventDefault();
      modal.open();
    }
  });

  // 3. Central Render Loop
  function updateUI() {
    const metrics = state.getMetrics();
    const currency = state.userProfile.currency || '₱';

    // Update Tactical Top Metrics
    if (statNetBalance) {
      const isPositive = metrics.netCashflow >= 0;
      statNetBalance.textContent = `${isPositive ? '+' : '-'}${currency}${Math.abs(metrics.netCashflow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      statNetBalance.style.color = isPositive ? '#ffffff' : '#d4d4d8';
    }

    if (statCashIn) {
      statCashIn.textContent = `+${currency}${metrics.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }

    if (statCashOut) {
      statCashOut.textContent = `-${currency}${metrics.totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }

    if (statTaxDeductible) {
      statTaxDeductible.textContent = `${currency}${metrics.taxDeductibleTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }

    // Render Ledger & Charts
    renderLedger(state, ledgerTableBody, ledgerCountEl);
    renderAnalytics(state, analyticsContainer);
    planner.render(plannerContainer);
    workspace.render();
  }

  // Subscribe to state updates
  state.subscribe(updateUI);

  // Initial render
  updateUI();
});
