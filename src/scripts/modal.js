// CASHEW-STYLE ADD / EDIT TRANSACTION CONTROLLER

export class TransactionModal {
  constructor(state) {
    this.state = state;
    this.modalEl = document.getElementById('transaction-modal');
    this.formEl = document.getElementById('transaction-form');
    this.editingId = null;

    // Form inputs
    this.typeExpenseBtn = document.getElementById('flow-btn-expense');
    this.typeIncomeBtn = document.getElementById('flow-btn-income');
    this.amountInput = document.getElementById('tx-amount');
    this.descriptionInput = document.getElementById('tx-description');
    this.categorySelect = document.getElementById('tx-category');
    this.accountSelect = document.getElementById('tx-account');
    this.dateInput = document.getElementById('tx-date');
    this.memoInput = document.getElementById('tx-memo');
    this.clientInput = document.getElementById('tx-client');
    this.taxDeductibleCheck = document.getElementById('tx-tax-deductible');
    this.currencySymbolEl = document.getElementById('modal-currency-symbol');
    this.modalTitle = document.getElementById('modal-title-text');

    // Classification cards
    this.cardBusiness = document.getElementById('choice-class-business');
    this.cardPersonal = document.getElementById('choice-class-personal');

    this.currentType = 'expense';
    this.currentClassification = 'personal';

    this.bindEvents();
  }

  bindEvents() {
    // Flow switch: Expense vs Income
    this.typeExpenseBtn.addEventListener('click', () => this.setType('expense'));
    this.typeIncomeBtn.addEventListener('click', () => this.setType('income'));

    // Classification: Business vs Personal
    this.cardBusiness.addEventListener('click', () => this.setClassification('business'));
    this.cardPersonal.addEventListener('click', () => this.setClassification('personal'));

    // Close buttons
    const closeBtns = this.modalEl.querySelectorAll('.modal-close-trigger');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    // Form submit
    this.formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalEl.classList.contains('active')) {
        this.close();
      }
    });
  }

  setType(type) {
    this.currentType = type;
    if (type === 'income') {
      this.typeIncomeBtn.classList.add('active', 'income');
      this.typeExpenseBtn.classList.remove('active', 'expense');
    } else {
      this.typeExpenseBtn.classList.add('active', 'expense');
      this.typeIncomeBtn.classList.remove('active', 'income');
    }
  }

  setClassification(classification) {
    this.currentClassification = classification;
    if (classification === 'business') {
      this.cardBusiness.classList.add('selected', 'business');
      this.cardPersonal.classList.remove('selected', 'personal');
      // Show client input and tax-deductible container
      const bizRow = document.getElementById('biz-specific-fields');
      if (bizRow) bizRow.style.display = 'flex';
    } else {
      this.cardPersonal.classList.add('selected', 'personal');
      this.cardBusiness.classList.remove('selected', 'business');
      const bizRow = document.getElementById('biz-specific-fields');
      if (bizRow) bizRow.style.display = 'none';
      if (this.taxDeductibleCheck) this.taxDeductibleCheck.checked = false;
    }
  }

  populateBankAccounts(selectedAccountName = null, selectedBankId = null) {
    if (!this.accountSelect) return;
    const banks = this.state.virtualBanks || [];
    this.accountSelect.innerHTML = banks.map(bank => {
      const isSelected = (selectedBankId && bank.id === selectedBankId) ||
                         (selectedAccountName && bank.name === selectedAccountName);
      const network = (bank.network || 'card').toUpperCase();
      const last4 = bank.last4 || '4829';
      return `<option value="${bank.name}" data-bank-id="${bank.id}" ${isSelected ? 'selected' : ''}>${bank.name} (${network} ••${last4})</option>`;
    }).join('');
  }

  open(editId = null) {
    this.editingId = editId;
    this.currencySymbolEl.textContent = this.state.userProfile.currency || '₱';

    if (editId) {
      const tx = this.state.transactions.find(t => t.id === editId);
      if (tx) {
        this.modalTitle.textContent = 'Edit Transaction';
        this.setType(tx.type);
        this.setClassification(tx.classification);
        this.amountInput.value = tx.amount;
        this.descriptionInput.value = tx.description;
        this.categorySelect.value = tx.category;
        this.populateBankAccounts(tx.account, tx.bankId);
        this.accountSelect.value = tx.account;
        this.dateInput.value = tx.date;
        this.memoInput.value = tx.memo || '';
        this.clientInput.value = tx.client || '';
        this.taxDeductibleCheck.checked = !!tx.taxDeductible;
      }
    } else {
      this.modalTitle.textContent = 'Add Transaction';
      this.formEl.reset();
      this.dateInput.value = new Date().toISOString().split('T')[0];
      this.setType('expense');
      
      // Default to active workspace preference
      if (this.state.activeWorkspace === 'business') {
        this.setClassification('business');
      } else {
        this.setClassification('personal');
      }

      const activeBankId = this.state.activeVirtualBankId !== 'all' ? this.state.activeVirtualBankId : null;
      this.populateBankAccounts(null, activeBankId);
      if (!activeBankId && this.state.virtualBanks && this.state.virtualBanks.length > 0) {
        const match = this.state.virtualBanks.find(b => b.classification === this.currentClassification) || this.state.virtualBanks[0];
        if (match) this.accountSelect.value = match.name;
      }
    }

    this.modalEl.classList.add('active');
    setTimeout(() => this.amountInput.focus(), 80);
  }

  close() {
    this.modalEl.classList.remove('active');
    this.editingId = null;
  }

  handleSubmit() {
    const amountVal = parseFloat(this.amountInput.value);
    if (!amountVal || amountVal <= 0) {
      alert('Please enter a valid transaction amount.');
      this.amountInput.focus();
      return;
    }

    const description = this.descriptionInput.value.trim();
    if (!description) {
      alert('Please enter a description for the transaction.');
      this.descriptionInput.focus();
      return;
    }

    const selectedOption = this.accountSelect.options[this.accountSelect.selectedIndex];
    const bankId = selectedOption ? selectedOption.dataset.bankId : null;

    const txData = {
      type: this.currentType,
      amount: amountVal,
      description: description,
      category: this.categorySelect.value,
      account: this.accountSelect.value,
      bankId: bankId,
      date: this.dateInput.value || new Date().toISOString().split('T')[0],
      classification: this.currentClassification,
      taxDeductible: this.currentClassification === 'business' ? this.taxDeductibleCheck.checked : false,
      client: this.currentClassification === 'business' ? this.clientInput.value : '',
      memo: this.memoInput.value
    };

    if (this.editingId) {
      this.state.updateTransaction(this.editingId, txData);
    } else {
      this.state.addTransaction(txData);
    }

    this.close();
  }
}
