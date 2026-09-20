function formatCurrency(currency, value) {
  return `${currency}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(dateValue) {
  const parsed = parseDate(dateValue);
  if (!parsed) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return Math.round((target - start) / 86400000);
}

export class PlannerPanel {
  constructor(state, budgetModal) {
    this.state = state;
    this.budgetModal = budgetModal;
    this.container = document.getElementById('planner-dashboard');

    this.bindEvents();
  }

  bindEvents() {
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'planner-settings-form') {
        e.preventDefault();
        const formData = new FormData(e.target);
        this.state.setPlannerSettings({
          monthlyIncomeTarget: parseFloat(formData.get('monthlyIncomeTarget')) || 0,
          monthlyExpenseTarget: parseFloat(formData.get('monthlyExpenseTarget')) || 0,
          savingsTarget: parseFloat(formData.get('savingsTarget')) || 0,
          alertThreshold: Math.max(0, Math.min(100, parseFloat(formData.get('alertThreshold')) || 80))
        });
      }

      if (e.target.id === 'planner-recurring-form') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const created = this.state.addRecurringPlan({
          name: formData.get('name'),
          amount: formData.get('amount'),
          category: formData.get('category'),
          kind: formData.get('kind'),
          frequency: formData.get('frequency'),
          nextDue: formData.get('nextDue')
        });
        if (created) e.target.reset();
      }

      if (e.target.id === 'planner-goal-form') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const created = this.state.addPlannerGoal({
          name: formData.get('name'),
          targetAmount: formData.get('targetAmount'),
          currentAmount: formData.get('currentAmount'),
          dueDate: formData.get('dueDate'),
          category: formData.get('category')
        });
        if (created) e.target.reset();
      }
    });

    document.addEventListener('click', (e) => {
      const budgetBtn = e.target.closest('[data-planner-budget]');
      if (budgetBtn) {
        if (this.budgetModal) this.budgetModal.open();
        return;
      }

      const recurringToggle = e.target.closest('[data-recurring-toggle]');
      if (recurringToggle) {
        this.state.toggleRecurringPlan(recurringToggle.dataset.recurringToggle);
        return;
      }

      const recurringDelete = e.target.closest('[data-recurring-delete]');
      if (recurringDelete) {
        this.state.deleteRecurringPlan(recurringDelete.dataset.recurringDelete);
        return;
      }

      const goalDelete = e.target.closest('[data-goal-delete]');
      if (goalDelete) {
        this.state.deletePlannerGoal(goalDelete.dataset.goalDelete);
        return;
      }
    });
  }

  render(container = this.container) {
    if (!container) return;

    const currency = this.state.userProfile.currency || '₱';
    const transactions = this.state.transactions || [];
    const budgets = this.state.budgets || [];
    const recurringPlans = [...(this.state.recurringPlans || [])].sort((a, b) => {
      const aDate = parseDate(a.nextDue)?.getTime() || 0;
      const bDate = parseDate(b.nextDue)?.getTime() || 0;
      return aDate - bDate;
    });
    const goals = this.state.plannerGoals || [];
    const settings = { ...this.state.defaultPlannerSettings(), ...(this.state.plannerSettings || {}) };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const thisMonthTx = transactions.filter(tx => {
      const txDate = parseDate(tx.date);
      return txDate && txDate >= startOfMonth && txDate < nextMonth;
    });

    const actualIncome = thisMonthTx.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const actualExpense = thisMonthTx.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    const plannedRecurringIncome = recurringPlans.filter(plan => plan.active !== false && plan.kind === 'income').reduce((sum, plan) => sum + plan.amount, 0);
    const plannedRecurringExpense = recurringPlans.filter(plan => plan.active !== false && plan.kind !== 'income').reduce((sum, plan) => sum + plan.amount, 0);
    const totalBankBalance = (this.state.virtualBanks || []).reduce((sum, bank) => sum + (bank.balance || 0), 0);
    const projectedBalance = totalBankBalance + plannedRecurringIncome - plannedRecurringExpense;
    const savingsGoalRemaining = Math.max(0, settings.savingsTarget - Math.max(0, totalBankBalance));

    const budgetAlerts = budgets
      .filter(budget => budget.limit > 0 && budget.spent / budget.limit >= (settings.alertThreshold / 100))
      .slice(0, 3)
      .map(budget => ({
        title: `${budget.category} budget at ${Math.round((budget.spent / budget.limit) * 100)}%`,
        detail: `${formatCurrency(currency, budget.spent)} spent of ${formatCurrency(currency, budget.limit)} limit`
      }));

    const dueSoon = recurringPlans
      .filter(plan => plan.active !== false)
      .map(plan => ({ ...plan, dueIn: daysUntil(plan.nextDue) }))
      .filter(plan => plan.dueIn !== null && plan.dueIn <= 30)
      .slice(0, 5);

    const goalRows = goals.map(goal => {
      const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      return `
        <div class="planner-list-item">
          <div class="planner-list-item-head">
            <div>
              <h4 class="planner-item-title">${goal.name}</h4>
              <div class="planner-item-meta">${goal.category || 'Savings'} · Due ${goal.dueDate || 'Flexible'}</div>
            </div>
            <button type="button" class="planner-mini-btn" data-goal-delete="${goal.id}">Delete</button>
          </div>
          <div class="planner-progress"><div class="planner-progress-bar" style="width:${progress}%"></div></div>
          <div class="planner-item-meta">${formatCurrency(currency, goal.currentAmount)} / ${formatCurrency(currency, goal.targetAmount)} · ${formatCurrency(currency, remaining)} left</div>
        </div>`;
    }).join('');

    const recurringRows = recurringPlans.map(plan => {
      const dueLabel = plan.nextDue ? `${plan.nextDue}${plan.kind === 'income' ? ' · income' : ' · bill'}` : plan.frequency;
      return `
        <div class="planner-list-item">
          <div class="planner-list-item-head">
            <div>
              <h4 class="planner-item-title">${plan.name}</h4>
              <div class="planner-item-meta">${plan.category || 'General'} · ${dueLabel}</div>
            </div>
            <button type="button" class="planner-mini-btn" data-recurring-delete="${plan.id}">Delete</button>
          </div>
          <div class="planner-pill-row">
            <span class="planner-pill">${plan.active === false ? 'Paused' : 'Active'}</span>
            <span class="planner-pill">${plan.frequency}</span>
            <span class="planner-pill">${formatCurrency(currency, plan.amount)}</span>
          </div>
          <div class="planner-item-actions">
            <button type="button" class="planner-mini-btn" data-recurring-toggle="${plan.id}">${plan.active === false ? 'Resume' : 'Pause'}</button>
          </div>
        </div>`;
    }).join('');

    container.innerHTML = `
      <article class="planner-hero">
        <div class="planner-hero-head">
          <div>
            <div class="planner-kicker">Planner mode</div>
            <h2 class="planner-title">Vank planning dashboard</h2>
            <p class="planner-subtitle">Set monthly targets, track recurring bills, map goals, and watch the next 30 days before they hit your ledger.</p>
          </div>
          <div class="planner-hero-actions">
            <button type="button" class="btn-pill btn-outline" data-planner-budget>Budgets</button>
            <button type="button" class="btn-pill btn-primary" data-planner-budget>Set Budget</button>
          </div>
        </div>

        <div class="planner-summary-grid">
          <div class="planner-summary-tile">
            <div class="planner-summary-label">Projected balance</div>
            <div class="planner-summary-value">${formatCurrency(currency, projectedBalance)}</div>
            <div class="planner-summary-note">After recurring items</div>
          </div>
          <div class="planner-summary-tile">
            <div class="planner-summary-label">This month income</div>
            <div class="planner-summary-value">${formatCurrency(currency, actualIncome + plannedRecurringIncome)}</div>
            <div class="planner-summary-note">${formatCurrency(currency, actualIncome)} actual + recurring</div>
          </div>
          <div class="planner-summary-tile">
            <div class="planner-summary-label">This month expense</div>
            <div class="planner-summary-value">${formatCurrency(currency, actualExpense + plannedRecurringExpense)}</div>
            <div class="planner-summary-note">${formatCurrency(currency, actualExpense)} actual + recurring</div>
          </div>
          <div class="planner-summary-tile">
            <div class="planner-summary-label">Savings target left</div>
            <div class="planner-summary-value">${formatCurrency(currency, savingsGoalRemaining)}</div>
            <div class="planner-summary-note">Goal: ${formatCurrency(currency, settings.savingsTarget)}</div>
          </div>
        </div>
      </article>

      <div class="planner-grid">
        <article class="planner-card planner-overview-card">
          <h3>Plan this month</h3>
          <p>Set the numbers you want Vank to plan against.</p>
          <form id="planner-settings-form">
            <div class="planner-form-grid">
              <div class="planner-field">
                <label for="planner-income-target">Monthly income target</label>
                <input id="planner-income-target" name="monthlyIncomeTarget" type="number" min="0" step="0.01" value="${settings.monthlyIncomeTarget || ''}" placeholder="0.00">
              </div>
              <div class="planner-field">
                <label for="planner-expense-target">Monthly expense target</label>
                <input id="planner-expense-target" name="monthlyExpenseTarget" type="number" min="0" step="0.01" value="${settings.monthlyExpenseTarget || ''}" placeholder="0.00">
              </div>
              <div class="planner-field">
                <label for="planner-savings-target">Savings target</label>
                <input id="planner-savings-target" name="savingsTarget" type="number" min="0" step="0.01" value="${settings.savingsTarget || ''}" placeholder="0.00">
              </div>
              <div class="planner-field">
                <label for="planner-alert-threshold">Alert threshold %</label>
                <input id="planner-alert-threshold" name="alertThreshold" type="number" min="1" max="100" step="1" value="${settings.alertThreshold || 80}">
              </div>
            </div>
            <div class="planner-form-actions">
              <button type="submit" class="btn-pill btn-primary">Save plan</button>
            </div>
          </form>
        </article>

        <article class="planner-card planner-recurring-card">
          <h3>Recurring bills & income</h3>
          <p>Add the items that should repeat in your plan.</p>
          <form id="planner-recurring-form">
            <div class="planner-form-grid">
              <div class="planner-field">
                <label for="planner-recurring-name">Name</label>
                <input id="planner-recurring-name" name="name" type="text" placeholder="Internet bill">
              </div>
              <div class="planner-field">
                <label for="planner-recurring-amount">Amount</label>
                <input id="planner-recurring-amount" name="amount" type="number" min="0" step="0.01" placeholder="0.00">
              </div>
              <div class="planner-field">
                <label for="planner-recurring-kind">Type</label>
                <select id="planner-recurring-kind" name="kind">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div class="planner-field">
                <label for="planner-recurring-frequency">Frequency</label>
                <select id="planner-recurring-frequency" name="frequency">
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly" selected>Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div class="planner-field">
                <label for="planner-recurring-date">Next due</label>
                <input id="planner-recurring-date" name="nextDue" type="date">
              </div>
              <div class="planner-field">
                <label for="planner-recurring-category">Category</label>
                <input id="planner-recurring-category" name="category" type="text" placeholder="Utilities">
              </div>
            </div>
            <div class="planner-form-actions">
              <button type="submit" class="btn-pill btn-primary">Add item</button>
            </div>
          </form>
          <div class="planner-list">
            ${recurringRows || '<div class="planner-empty-state">No recurring items yet. Add bills, subscriptions, or planned income here.</div>'}
          </div>
        </article>

        <article class="planner-card planner-goals-card">
          <h3>Goals</h3>
          <p>Track savings goals and short-term targets.</p>
          <form id="planner-goal-form">
            <div class="planner-form-grid">
              <div class="planner-field">
                <label for="planner-goal-name">Goal name</label>
                <input id="planner-goal-name" name="name" type="text" placeholder="Emergency fund">
              </div>
              <div class="planner-field">
                <label for="planner-goal-target">Target amount</label>
                <input id="planner-goal-target" name="targetAmount" type="number" min="0" step="0.01" placeholder="0.00">
              </div>
              <div class="planner-field">
                <label for="planner-goal-current">Current saved</label>
                <input id="planner-goal-current" name="currentAmount" type="number" min="0" step="0.01" placeholder="0.00">
              </div>
              <div class="planner-field">
                <label for="planner-goal-date">Target date</label>
                <input id="planner-goal-date" name="dueDate" type="date">
              </div>
              <div class="planner-field" style="grid-column: 1 / -1;">
                <label for="planner-goal-category">Category</label>
                <input id="planner-goal-category" name="category" type="text" placeholder="Savings">
              </div>
            </div>
            <div class="planner-form-actions">
              <button type="submit" class="btn-pill btn-primary">Add goal</button>
            </div>
          </form>
          <div class="planner-list">
            ${goalRows || '<div class="planner-empty-state">No goals yet. Add a savings goal or a purchase target.</div>'}
          </div>
        </article>

        <article class="planner-card planner-alerts-card">
          <h3>Upcoming & alerts</h3>
          <p>Watch due dates, risks, and planning gaps.</p>
          <div class="planner-alert-list">
            ${dueSoon.length ? dueSoon.map(item => `
              <div class="planner-alert">
                <strong>${item.name}</strong><br>
                Due in ${item.dueIn} day${item.dueIn === 1 ? '' : 's'} · ${formatCurrency(currency, item.amount)}
              </div>`).join('') : '<div class="planner-empty-state">No recurring items are due in the next 30 days.</div>'}
            ${budgetAlerts.length ? budgetAlerts.map(alert => `
              <div class="planner-alert">
                <strong>${alert.title}</strong><br>
                ${alert.detail}
              </div>`).join('') : ''}
            ${budgetAlerts.length ? '' : '<div class="planner-empty-state">Budgets are currently below the alert threshold.</div>'}
          </div>
        </article>
      </div>
    `;
  }
}