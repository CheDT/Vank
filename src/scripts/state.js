import { detectBankBrand } from './bankLogos.js';

// STATE MANAGEMENT & LOCAL STORAGE PERSISTENCE (PESOS & MONOCHROME)

const STORAGE_KEY = 'gworkspace_tracker_state_v4_virtual_banks';

// Authentic human transactions in Philippine Pesos (₱)
const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-101',
    date: '2026-09-18',
    description: 'AWS Cloud Infrastructure - ap-southeast-1',
    memo: 'Production cluster & S3 storage tier',
    type: 'expense',
    amount: 8450.00,
    category: 'Cloud & Tech',
    account: 'BDO Business Checking',
    classification: 'business',
    taxDeductible: true,
    client: 'Internal Infra'
  },
  {
    id: 'tx-102',
    date: '2026-09-17',
    description: 'Client Retainer - Design Systems Phase 2',
    memo: 'Direct bank transfer invoice #904',
    type: 'income',
    amount: 85000.00,
    category: 'Client Revenue',
    account: 'BDO Business Checking',
    classification: 'business',
    taxDeductible: false,
    client: 'Acme Studio'
  },
  {
    id: 'tx-103',
    date: '2026-09-16',
    description: 'Landers Superstore - Weekly Groceries',
    memo: 'Pantry staples, produce & home supplies',
    type: 'expense',
    amount: 4850.50,
    category: 'Groceries',
    account: 'Personal Savings',
    classification: 'personal',
    taxDeductible: false,
    client: null
  },
  {
    id: 'tx-104',
    date: '2026-09-15',
    description: 'Yardstick Coffee - Client Discovery Session',
    memo: 'Coffee & snacks with design candidate',
    type: 'expense',
    amount: 680.00,
    category: 'Meals & Meetings',
    account: 'GCash Wallet',
    classification: 'business',
    taxDeductible: true,
    client: 'Talent Acquisition'
  },
  {
    id: 'tx-105',
    date: '2026-09-14',
    description: 'Salary / Engineering Dividend',
    memo: 'Bi-weekly direct compensation payout',
    type: 'income',
    amount: 65000.00,
    category: 'Payroll & Salary',
    account: 'Personal Savings',
    classification: 'personal',
    taxDeductible: false,
    client: null
  },
  {
    id: 'tx-106',
    date: '2026-09-12',
    description: 'GitHub Enterprise - Annual Organization',
    memo: 'Developer seats & Actions runner credits',
    type: 'expense',
    amount: 5200.00,
    category: 'Cloud & Tech',
    account: 'BDO Business Checking',
    classification: 'business',
    taxDeductible: true,
    client: 'Engineering'
  },
  {
    id: 'tx-107',
    date: '2026-09-10',
    description: 'Beep Card & Grab Rides Transit',
    memo: 'Monthly urban commute & Grab car fares',
    type: 'expense',
    amount: 2450.00,
    category: 'Commute & Travel',
    account: 'GCash Wallet',
    classification: 'personal',
    taxDeductible: false,
    client: null
  },
  {
    id: 'tx-108',
    date: '2026-09-08',
    description: 'Ergonomic Monitor Arm & Keyboard',
    memo: 'Studio workstation asset purchase',
    type: 'expense',
    amount: 6800.00,
    category: 'Equipment & Office',
    account: 'BDO Business Checking',
    classification: 'business',
    taxDeductible: true,
    client: 'Hardware Asset'
  },
  {
    id: 'tx-109',
    date: '2026-09-05',
    description: 'Technical Subscriptions & Research',
    memo: 'Architecture newsletters & books',
    type: 'expense',
    amount: 1400.00,
    category: 'Education & Books',
    account: 'Personal Savings',
    classification: 'personal',
    taxDeductible: false,
    client: null
  },
  {
    id: 'tx-110',
    date: '2026-09-02',
    description: 'Freelance Advisory - System Audit',
    memo: 'Architecture consultation invoice #18',
    type: 'income',
    amount: 24000.00,
    category: 'Client Revenue',
    account: 'BDO Business Checking',
    bankId: 'bank-demo-1',
    classification: 'business',
    taxDeductible: false,
    client: 'Hyperion Labs'
  }
];

export const DEMO_BUDGETS = [
  { category: 'Cloud & Tech', limit: 18000, spent: 0 },
  { category: 'Meals & Meetings', limit: 5000, spent: 0 },
  { category: 'Groceries', limit: 16000, spent: 0 },
  { category: 'Equipment & Office', limit: 12000, spent: 0 }
];

class StateManager {
  constructor() {
    this.listeners = [];
    this.activeVirtualBankId = 'all';
    this.plannerSettings = this.defaultPlannerSettings();
    this.recurringPlans = [];
    this.plannerGoals = [];
    this.loadState();
  }

  defaultPlannerSettings() {
    return {
      monthlyIncomeTarget: 0,
      monthlyExpenseTarget: 0,
      savingsTarget: 0,
      alertThreshold: 80
    };
  }

  loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.userProfile = parsed.userProfile || this.defaultProfile();
        this.activeWorkspace = parsed.activeWorkspace || 'all';
        this.activeVirtualBankId = parsed.activeVirtualBankId || 'all';
        this.transactions = parsed.transactions || [];
        this.budgets = parsed.budgets || [];
        this.virtualBanks = parsed.virtualBanks || this.defaultVirtualBanks();
        this.plannerSettings = { ...this.defaultPlannerSettings(), ...(parsed.plannerSettings || {}) };
        this.recurringPlans = parsed.recurringPlans || [];
        this.plannerGoals = parsed.plannerGoals || [];
        this.filter = {
          search: '',
          category: 'all',
          account: 'all',
          classification: 'all',
          type: 'all'
        };
        this.recalculateBankBalances();
        this.recalculateBudgets();
        return;
      } catch (e) {
        console.error('Failed to parse saved state, resetting', e);
      }
    }
    
    // Default initial state (Clean Blank for New Profile with exactly 1 Virtual Bank and NO built-in budgets)
    this.userProfile = this.defaultProfile(true);
    this.activeWorkspace = 'all';
    this.activeVirtualBankId = 'all';
    this.virtualBanks = this.defaultVirtualBanks();
    this.transactions = []; // Completely blank ledger
    this.budgets = []; // Zero built-in budgets (user adds their own)
    this.filter = {
      search: '',
      category: 'all',
      account: 'all',
      classification: 'all',
      type: 'all'
    };
    this.recalculateBankBalances();
    this.saveState();
  }

  defaultProfile(isFresh = true) {
    return {
      name: '',
      email: '',
      workspaceName: 'Vank',
      workspaceMode: 'hybrid',
      currency: '₱',
      currencyCode: 'PHP',
      onboardingComplete: !isFresh,
      tutorialDismissed: false
    };
  }

  defaultVirtualBanks(name = 'Maya', network = 'visa', classification = 'business', gradient = 'gradient-emerald', initialBalance = 0, brand = 'maya', cardHolder = '') {
    return [
      {
        id: 'bank-primary',
        name: name || 'Maya',
        network: network || 'visa',
        brand: brand || detectBankBrand(name),
        classification: classification || 'business',
        gradient: gradient || 'gradient-emerald',
        cardHolder: cardHolder || '',
        last4: '4829',
        initialBalance: parseFloat(initialBalance) || 0,
        balance: parseFloat(initialBalance) || 0,
        isPrimary: true
      }
    ];
  }

  startBlankProfile() {
    this.userProfile = this.defaultProfile(true);
    this.activeVirtualBankId = 'all';
    this.virtualBanks = this.defaultVirtualBanks();
    this.transactions = [];
    this.budgets = []; // Blank budgets
    this.plannerSettings = this.defaultPlannerSettings();
    this.recurringPlans = [];
    this.plannerGoals = [];
    this.recalculateBankBalances();
    this.saveState();
  }

  createNewProfile(profileData) {
    this.userProfile = {
      name: profileData.name || 'User',
      email: profileData.email || '',
      workspaceName: profileData.workspaceName || 'Vank',
      workspaceMode: profileData.workspaceMode || 'hybrid',
      currency: profileData.currency || '₱',
      currencyCode: profileData.currencyCode || 'PHP',
      onboardingComplete: true
    };

    const initialBankName = profileData.bankName || 'Maya';
    const initialNetwork = profileData.bankNetwork || 'visa';
    const initialGradient = profileData.bankGradient || 'gradient-emerald';
    const initialBalance = parseFloat(profileData.openingBalance) || 0;
    const cardHolder = profileData.cardHolder || profileData.name || 'User';

    // Single initial virtual bank
    const detectedBrand = profileData.bankBrand || detectBankBrand(initialBankName);
    this.virtualBanks = [
      {
        id: 'bank-' + Date.now().toString(36),
        name: initialBankName,
        network: initialNetwork,
        brand: detectedBrand,
        classification: profileData.workspaceMode === 'personal' ? 'personal' : 'business',
        gradient: initialGradient,
        cardHolder: cardHolder,
        last4: Math.floor(1000 + Math.random() * 9000).toString(),
        initialBalance: initialBalance,
        balance: initialBalance,
        isPrimary: true
      }
    ];

    this.activeVirtualBankId = 'all';
    this.transactions = [];
    this.budgets = [];
    this.plannerSettings = this.defaultPlannerSettings();
    this.recurringPlans = [];
    this.plannerGoals = [];

    if (initialBalance > 0) {
      this.transactions.push({
        id: 'tx-init-' + Date.now().toString(36),
        date: new Date().toISOString().split('T')[0],
        description: 'Opening Liquidity Buffer',
        memo: `Initial deposit on ${initialBankName}`,
        type: 'income',
        amount: initialBalance,
        category: 'General',
        account: initialBankName,
        bankId: this.virtualBanks[0].id,
        classification: profileData.workspaceMode === 'personal' ? 'personal' : 'business',
        taxDeductible: false,
        client: null
      });
    }

    this.recalculateBudgets();
    this.recalculateBankBalances();
    this.saveState();
  }

  addVirtualBank(bankData) {
    const brand = bankData.brand || detectBankBrand(bankData.name);
    const newBank = {
      id: 'bank-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3),
      name: bankData.name.trim() || 'Virtual Card',
      network: bankData.network || 'visa',
      brand: brand,
      classification: bankData.classification || 'business',
      gradient: bankData.gradient || 'gradient-obsidian',
      cardHolder: bankData.cardHolder ? bankData.cardHolder.trim() : (this.userProfile.name || ''),
      last4: bankData.last4 || Math.floor(1000 + Math.random() * 9000).toString(),
      initialBalance: parseFloat(bankData.initialBalance) || 0,
      balance: parseFloat(bankData.initialBalance) || 0,
      isPrimary: false
    };

    this.virtualBanks.push(newBank);

    if (newBank.initialBalance > 0) {
      this.transactions.unshift({
        id: 'tx-init-' + Date.now().toString(36),
        date: new Date().toISOString().split('T')[0],
        description: `Opening Deposit - ${newBank.name}`,
        memo: `Virtual Card Setup [•••• ${newBank.last4}]`,
        type: 'income',
        amount: newBank.initialBalance,
        category: 'General',
        account: newBank.name,
        bankId: newBank.id,
        classification: newBank.classification,
        taxDeductible: false,
        client: null
      });
    }

    this.recalculateBudgets();
    this.recalculateBankBalances();
    this.saveState();
    return newBank;
  }

  updateVirtualBank(bankId, updatedData) {
    const bank = this.virtualBanks.find(b => b.id === bankId);
    if (!bank) return null;

    const oldName = bank.name;

    if (updatedData.name !== undefined && updatedData.name.trim()) {
      bank.name = updatedData.name.trim();
    }
    if (updatedData.brand !== undefined) {
      bank.brand = updatedData.brand;
    }
    if (updatedData.network !== undefined) {
      bank.network = updatedData.network;
    }
    if (updatedData.classification !== undefined) {
      bank.classification = updatedData.classification;
    }
    if (updatedData.gradient !== undefined) {
      bank.gradient = updatedData.gradient;
    }
    if (updatedData.cardHolder !== undefined) {
      bank.cardHolder = updatedData.cardHolder.trim();
    }

    // Sync transaction account names if the card nickname was updated
    if (bank.name !== oldName) {
      this.transactions.forEach(tx => {
        if (tx.bankId === bankId || tx.account === oldName) {
          tx.account = bank.name;
        }
      });
    }

    // Update initial balance / starting value
    if (updatedData.initialBalance !== undefined) {
      const newInitBal = parseFloat(updatedData.initialBalance) || 0;
      bank.initialBalance = newInitBal;

      const initTx = this.transactions.find(tx => 
        ((tx.id && String(tx.id).startsWith('tx-init-')) || 
         (tx.description && (tx.description.toLowerCase().includes('opening liquidity') || tx.description.toLowerCase().includes('opening deposit')))) &&
        (tx.bankId === bankId || tx.account === bank.name || tx.account === oldName)
      );

      if (initTx) {
        initTx.amount = newInitBal;
        initTx.account = bank.name;
        initTx.bankId = bank.id;
      } else if (newInitBal > 0) {
        this.transactions.unshift({
          id: 'tx-init-' + Date.now().toString(36),
          date: new Date().toISOString().split('T')[0],
          description: `Opening Deposit - ${bank.name}`,
          memo: `Virtual Card Setup [•••• ${bank.last4}]`,
          type: 'income',
          amount: newInitBal,
          category: 'General',
          account: bank.name,
          bankId: bank.id,
          classification: bank.classification,
          taxDeductible: false,
          client: null
        });
      }
    }

    this.recalculateBudgets();
    this.recalculateBankBalances();
    this.saveState();
    return bank;
  }

  deleteVirtualBank(bankId) {
    if (this.virtualBanks.length <= 1) {
      alert('You must keep at least 1 Virtual Bank.');
      return false;
    }
    const bankToDelete = this.virtualBanks.find(b => b.id === bankId);
    if (!bankToDelete) return false;

    this.virtualBanks = this.virtualBanks.filter(b => b.id !== bankId);
    if (this.activeVirtualBankId === bankId) {
      this.activeVirtualBankId = 'all';
    }
    
    // Safely unassign any transactions that belonged to this deleted bank
    this.transactions = this.transactions.map(tx => {
      if (tx.bankId === bankId) {
        return { ...tx, bankId: null, account: 'Unassigned Bank' };
      }
      return tx;
    });

    this.recalculateBankBalances();
    this.saveState();
    return true;
  }

  setActiveVirtualBank(bankId) {
    this.activeVirtualBankId = bankId;
    this.notify();
  }

  recalculateBankBalances() {
    if (!this.virtualBanks) return;
    this.virtualBanks.forEach(bank => {
      // Check if there is an opening deposit transaction in the ledger for this bank
      const hasInitTx = this.transactions.some(tx => 
        ((tx.id && String(tx.id).startsWith('tx-init-')) || 
         (tx.description && (tx.description.toLowerCase().includes('opening liquidity') || tx.description.toLowerCase().includes('opening deposit')))) &&
        (tx.bankId === bank.id || tx.account === bank.name)
      );

      // If an opening transaction exists in the ledger, start from 0 so the opening deposit transaction is not counted twice!
      // If NO opening transaction exists in the ledger (e.g. demo data or direct bank initial balance), start from bank.initialBalance.
      let current = hasInitTx ? 0 : (bank.initialBalance || 0);

      this.transactions.forEach(tx => {
        const isThisBank = tx.bankId === bank.id || 
                           tx.account === bank.name || 
                           (!tx.bankId && bank.isPrimary && (!tx.account || tx.account === 'Consolidated' || tx.account === 'Unassigned Bank'));
        if (isThisBank) {
          if (tx.type === 'income') {
            current += tx.amount;
          } else if (tx.type === 'expense') {
            current -= tx.amount;
          }
        }
      });
      bank.balance = current;
    });
  }

  clearAllTransactions() {
    this.transactions = [];
    this.virtualBanks.forEach(b => {
      b.balance = b.initialBalance || 0;
    });
    this.recalculateBudgets();
    this.recalculateBankBalances();
    this.saveState();
  }

  saveState() {
    const toSave = {
      userProfile: this.userProfile,
      activeWorkspace: this.activeWorkspace,
      activeVirtualBankId: this.activeVirtualBankId,
      transactions: this.transactions,
      budgets: this.budgets,
      virtualBanks: this.virtualBanks,
      plannerSettings: this.plannerSettings,
      recurringPlans: this.recurringPlans,
      plannerGoals: this.plannerGoals
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  setFilter(updates) {
    this.filter = { ...this.filter, ...updates };
    this.notify();
  }

  setActiveWorkspace(workspace) {
    this.activeWorkspace = workspace;
    if (workspace === 'business') {
      this.filter.classification = 'business';
    } else if (workspace === 'personal') {
      this.filter.classification = 'personal';
    } else {
      this.filter.classification = 'all';
    }
    this.notify();
  }

  addTransaction(txData) {
    const bank = this.virtualBanks.find(b => b.id === txData.bankId || b.name === txData.account) || this.virtualBanks[0];
    const newTx = {
      id: 'tx-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      date: txData.date || new Date().toISOString().split('T')[0],
      description: txData.description.trim(),
      memo: txData.memo ? txData.memo.trim() : '',
      type: txData.type,
      amount: parseFloat(txData.amount) || 0,
      category: txData.category || 'General',
      account: bank ? bank.name : (txData.account || 'Primary Digital Debit'),
      bankId: bank ? bank.id : (this.virtualBanks[0] ? this.virtualBanks[0].id : null),
      classification: txData.classification || (bank ? bank.classification : 'personal'),
      taxDeductible: !!txData.taxDeductible,
      client: txData.client ? txData.client.trim() : null
    };

    this.transactions.unshift(newTx);
    this.recalculateBudgets();
    this.recalculateBankBalances();
    this.saveState();
    return newTx;
  }

  deleteTransaction(id) {
    this.transactions = this.transactions.filter(tx => tx.id !== id);
    this.recalculateBudgets();
    this.recalculateBankBalances();
    this.saveState();
  }

  updateTransaction(id, updatedData) {
    const index = this.transactions.findIndex(tx => tx.id === id);
    if (index !== -1) {
      const bank = this.virtualBanks.find(b => b.id === updatedData.bankId || b.name === updatedData.account);
      this.transactions[index] = {
        ...this.transactions[index],
        ...updatedData,
        account: bank ? bank.name : this.transactions[index].account,
        bankId: bank ? bank.id : this.transactions[index].bankId,
        amount: parseFloat(updatedData.amount)
      };
      this.recalculateBudgets();
      this.recalculateBankBalances();
      this.saveState();
    }
  }

  recalculateBudgets() {
    this.budgets.forEach(b => {
      const totalSpent = this.transactions
        .filter(t => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, t) => sum + t.amount, 0);
      b.spent = totalSpent;
    });
  }

  setBudget(budgetData) {
    const category = (budgetData.category || '').trim();
    const limit = Math.max(0, parseFloat(budgetData.limit) || 0);
    if (!category || limit <= 0) return false;

    const existingIdx = this.budgets.findIndex(b => b.category.toLowerCase() === category.toLowerCase());
    if (existingIdx !== -1) {
      this.budgets[existingIdx].limit = limit;
      this.budgets[existingIdx].category = category;
    } else {
      this.budgets.push({ category, limit, spent: 0 });
    }

    this.recalculateBudgets();
    this.saveState();
    return true;
  }

  deleteBudget(category) {
    if (!category) return;
    this.budgets = this.budgets.filter(b => b.category.toLowerCase() !== category.toLowerCase());
    this.recalculateBudgets();
    this.saveState();
  }

  setPlannerSettings(updates) {
    this.plannerSettings = {
      ...this.defaultPlannerSettings(),
      ...this.plannerSettings,
      ...updates
    };
    this.saveState();
  }

  addRecurringPlan(planData) {
    const name = (planData.name || '').trim();
    const amount = Math.max(0, parseFloat(planData.amount) || 0);
    if (!name || amount <= 0) return null;

    const nextDue = planData.nextDue || new Date().toISOString().split('T')[0];
    const recurringPlan = {
      id: 'plan-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      name,
      amount,
      category: planData.category || 'General',
      kind: planData.kind === 'income' ? 'income' : 'expense',
      frequency: planData.frequency || 'monthly',
      nextDue,
      active: planData.active !== false
    };

    this.recurringPlans.unshift(recurringPlan);
    this.saveState();
    return recurringPlan;
  }

  toggleRecurringPlan(planId) {
    const plan = this.recurringPlans.find(item => item.id === planId);
    if (!plan) return null;
    plan.active = !plan.active;
    this.saveState();
    return plan;
  }

  deleteRecurringPlan(planId) {
    this.recurringPlans = this.recurringPlans.filter(item => item.id !== planId);
    this.saveState();
  }

  addPlannerGoal(goalData) {
    const name = (goalData.name || '').trim();
    const targetAmount = Math.max(0, parseFloat(goalData.targetAmount) || 0);
    if (!name || targetAmount <= 0) return null;

    const plannerGoal = {
      id: 'goal-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      name,
      targetAmount,
      currentAmount: Math.max(0, parseFloat(goalData.currentAmount) || 0),
      dueDate: goalData.dueDate || '',
      category: goalData.category || 'Savings'
    };

    this.plannerGoals.unshift(plannerGoal);
    this.saveState();
    return plannerGoal;
  }

  updatePlannerGoal(goalId, updates) {
    const goal = this.plannerGoals.find(item => item.id === goalId);
    if (!goal) return null;

    if (updates.name !== undefined && updates.name.trim()) goal.name = updates.name.trim();
    if (updates.targetAmount !== undefined) goal.targetAmount = Math.max(0, parseFloat(updates.targetAmount) || 0);
    if (updates.currentAmount !== undefined) goal.currentAmount = Math.max(0, parseFloat(updates.currentAmount) || 0);
    if (updates.dueDate !== undefined) goal.dueDate = updates.dueDate;
    if (updates.category !== undefined) goal.category = updates.category;

    this.saveState();
    return goal;
  }

  deletePlannerGoal(goalId) {
    this.plannerGoals = this.plannerGoals.filter(item => item.id !== goalId);
    this.saveState();
  }

  updateProfile(profileData) {
    this.userProfile = { ...this.userProfile, ...profileData };
    this.saveState();
  }

  getFilteredTransactions() {
    return this.transactions.filter(tx => {
      // Filter by active virtual bank card if selected
      if (this.activeVirtualBankId && this.activeVirtualBankId !== 'all') {
        const activeBank = this.virtualBanks.find(b => b.id === this.activeVirtualBankId);
        if (activeBank && tx.bankId !== this.activeVirtualBankId && tx.account !== activeBank.name) {
          return false;
        }
      }
      if (this.filter.classification !== 'all' && tx.classification !== this.filter.classification) {
        return false;
      }
      if (this.filter.type !== 'all' && tx.type !== this.filter.type) {
        return false;
      }
      if (this.filter.category !== 'all' && tx.category !== this.filter.category) {
        return false;
      }
      if (this.filter.account !== 'all' && tx.account !== this.filter.account) {
        return false;
      }
      if (this.filter.search && this.filter.search.trim()) {
        const q = this.filter.search.toLowerCase().trim();
        const matchesDesc = tx.description.toLowerCase().includes(q);
        const matchesMemo = tx.memo.toLowerCase().includes(q);
        const matchesCat = tx.category.toLowerCase().includes(q);
        const matchesAcc = tx.account.toLowerCase().includes(q);
        const matchesClient = tx.client && tx.client.toLowerCase().includes(q);
        if (!matchesDesc && !matchesMemo && !matchesCat && !matchesAcc && !matchesClient) {
          return false;
        }
      }
      return true;
    });
  }

  getMetrics() {
    const activeTx = this.getFilteredTransactions();
    
    let totalIncome = 0;
    let totalExpense = 0;
    let businessExpense = 0;
    let personalExpense = 0;
    let taxDeductibleTotal = 0;

    activeTx.forEach(tx => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount;
        if (tx.classification === 'business') {
          businessExpense += tx.amount;
          if (tx.taxDeductible) {
            taxDeductibleTotal += tx.amount;
          }
        } else {
          personalExpense += tx.amount;
        }
      }
    });

    const netCashflow = totalIncome - totalExpense;
    const totalBurn = businessExpense + personalExpense;
    const businessPercent = totalBurn > 0 ? Math.round((businessExpense / totalBurn) * 100) : 50;
    const personalPercent = totalBurn > 0 ? 100 - businessPercent : 50;

    return {
      totalIncome,
      totalExpense,
      netCashflow,
      businessExpense,
      personalExpense,
      taxDeductibleTotal,
      businessPercent,
      personalPercent,
      transactionCount: activeTx.length
    };
  }

  resetDemoData() {
    this.userProfile = {
      name: 'Felix Vance',
      email: 'felix@apexstudio.ph',
      workspaceName: 'Apex Studio & Personal',
      workspaceMode: 'hybrid',
      currency: '₱',
      currencyCode: 'PHP',
      onboardingComplete: true
    };
    this.activeVirtualBankId = 'all';
    this.virtualBanks = [
      {
        id: 'bank-demo-1',
        name: 'BDO',
        network: 'visa',
        brand: 'bdo',
        classification: 'business',
        gradient: 'gradient-obsidian',
        cardHolder: 'Felix Vance',
        last4: '8821',
        initialBalance: 120000,
        balance: 184200.00,
        isPrimary: true
      },
      {
        id: 'bank-demo-2',
        name: 'Maya',
        network: 'mastercard',
        brand: 'maya',
        classification: 'personal',
        gradient: 'gradient-midnight',
        cardHolder: 'Felix Vance',
        last4: '3419',
        initialBalance: 40000,
        balance: 65400.00,
        isPrimary: false
      },
      {
        id: 'bank-demo-3',
        name: 'GCash',
        network: 'visa',
        brand: 'gcash',
        classification: 'personal',
        gradient: 'gradient-platinum',
        cardHolder: 'Felix Vance',
        last4: '6102',
        initialBalance: 15000,
        balance: 14500.00,
        isPrimary: false
      }
    ];
    this.transactions = INITIAL_TRANSACTIONS.map(tx => {
      let bankId = 'bank-demo-1';
      if (tx.account === 'Personal Savings') bankId = 'bank-demo-2';
      if (tx.account === 'GCash Wallet') bankId = 'bank-demo-3';
      return { ...tx, bankId };
    });
    this.budgets = DEMO_BUDGETS.map(b => ({ ...b }));
    this.plannerSettings = {
      monthlyIncomeTarget: 170000,
      monthlyExpenseTarget: 68000,
      savingsTarget: 42000,
      alertThreshold: 80
    };
    this.recurringPlans = [
      { id: 'plan-demo-1', name: 'Internet & Cloud', amount: 3200, category: 'Cloud & Tech', kind: 'expense', frequency: 'monthly', nextDue: new Date().toISOString().split('T')[0], active: true },
      { id: 'plan-demo-2', name: 'Client Retainer', amount: 45000, category: 'Client Revenue', kind: 'income', frequency: 'monthly', nextDue: new Date().toISOString().split('T')[0], active: true },
      { id: 'plan-demo-3', name: 'Gym + Wellness', amount: 1800, category: 'Personal', kind: 'expense', frequency: 'monthly', nextDue: new Date().toISOString().split('T')[0], active: true }
    ];
    this.plannerGoals = [
      { id: 'goal-demo-1', name: 'Emergency Fund', targetAmount: 120000, currentAmount: 42000, dueDate: '', category: 'Savings' },
      { id: 'goal-demo-2', name: 'New Laptop Upgrade', targetAmount: 85000, currentAmount: 26000, dueDate: '', category: 'Equipment' }
    ];
    this.recalculateBudgets();
    this.recalculateBankBalances();
    this.saveState();
  }
}

export const state = new StateManager();
