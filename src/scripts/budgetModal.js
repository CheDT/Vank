// BUDGET SETTING & MANAGEMENT MODAL CONTROLLER

export class BudgetModal {
  constructor(state) {
    this.state = state;
    this.modalEl = document.getElementById('budget-modal');
    this.formEl = document.getElementById('budget-form');

    if (!this.modalEl || !this.formEl) return;

    this.categorySelect = document.getElementById('budget-category-select');
    this.customGroup = document.getElementById('budget-custom-category-group');
    this.customInput = document.getElementById('budget-custom-category');
    this.limitInput = document.getElementById('budget-limit-input');
    this.currencySymbolEl = document.getElementById('budget-currency-symbol');

    this.bindEvents();
  }

  bindEvents() {
    // Toggle custom category input
    if (this.categorySelect) {
      this.categorySelect.addEventListener('change', () => {
        if (this.categorySelect.value === '__custom__') {
          if (this.customGroup) this.customGroup.style.display = 'block';
          if (this.customInput) this.customInput.focus();
        } else {
          if (this.customGroup) this.customGroup.style.display = 'none';
          // Check if this category already has a budget set and prefill limit
          const existing = (this.state.budgets || []).find(
            b => b.category.toLowerCase() === this.categorySelect.value.toLowerCase()
          );
          if (existing && this.limitInput) {
            this.limitInput.value = existing.limit;
          }
        }
      });
    }

    // Close triggers
    const closeTriggers = this.modalEl.querySelectorAll('.budget-modal-close-trigger');
    closeTriggers.forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    // Submit handler
    this.formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalEl.classList.contains('active')) {
        this.close();
      }
    });
  }

  open(prefilledCategory = null) {
    if (!this.modalEl) return;

    const cur = this.state.userProfile.currency || '₱';
    if (this.currencySymbolEl) {
      this.currencySymbolEl.textContent = cur;
    }

    // Collect all standard categories + any custom ones from transactions
    const defaultCats = [
      'Cloud & Tech',
      'Client Revenue',
      'Groceries',
      'Meals & Meetings',
      'Payroll & Salary',
      'Commute & Travel',
      'Equipment & Office',
      'Education & Books',
      'General'
    ];

    const txCats = (this.state.transactions || []).map(t => t.category).filter(Boolean);
    const allUniqueCats = Array.from(new Set([...defaultCats, ...txCats]));

    if (this.categorySelect) {
      this.categorySelect.innerHTML = allUniqueCats.map(cat => {
        const isSelected = prefilledCategory && prefilledCategory.toLowerCase() === cat.toLowerCase();
        return `<option value="${cat}" ${isSelected ? 'selected' : ''}>${cat}</option>`;
      }).join('') + '<option value="__custom__">+ Custom Category...</option>';
    }

    if (this.customGroup) this.customGroup.style.display = 'none';
    if (this.customInput) this.customInput.value = '';

    // Check if selected category already has a limit
    const activeCat = prefilledCategory || (this.categorySelect ? this.categorySelect.value : '');
    const existing = (this.state.budgets || []).find(
      b => b.category.toLowerCase() === activeCat.toLowerCase()
    );

    if (this.limitInput) {
      this.limitInput.value = existing ? existing.limit : '';
    }

    this.modalEl.classList.add('active');
    setTimeout(() => {
      if (this.limitInput && !this.limitInput.value) {
        this.limitInput.focus();
      }
    }, 100);
  }

  close() {
    if (this.modalEl) {
      this.modalEl.classList.remove('active');
    }
  }

  handleSubmit() {
    let category = this.categorySelect ? this.categorySelect.value : '';
    if (category === '__custom__') {
      category = this.customInput ? this.customInput.value.trim() : '';
      if (!category) {
        alert('Please enter a custom category name.');
        if (this.customInput) this.customInput.focus();
        return;
      }
    }

    const limit = parseFloat(this.limitInput ? this.limitInput.value : 0);
    if (!limit || limit <= 0) {
      alert('Please enter a valid monthly limit in Pesos.');
      if (this.limitInput) this.limitInput.focus();
      return;
    }

    this.state.setBudget({ category, limit });
    this.close();
  }
}
