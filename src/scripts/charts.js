const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

export function renderAnalytics(state, container) {
  if (!container) return;
  const currency = state.userProfile.currency || '₱';
  const totals = {};
  state.getFilteredTransactions().filter(tx => tx.type === 'expense').forEach(tx => {
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  });
  const categories = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const max = categories[0]?.[1] || 1;
  const money = amount => `${currency}${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  container.innerHTML = `
    <section class="chart-card" aria-label="Spending by category">
      <div class="chart-header"><h3 class="chart-title">Spending by category</h3></div>
      <div class="category-breakdown-list">
        ${categories.map(([category, amount]) => `
          <div class="breakdown-row ${state.filter.category === category ? 'active' : ''}" data-category="${escapeHtml(category)}" role="button" tabindex="0" aria-label="Filter by ${escapeHtml(category)}">
            <div class="breakdown-info"><span class="breakdown-name">${escapeHtml(category)}</span><span class="breakdown-amount">${money(amount)}</span></div>
            <div class="breakdown-track"><div class="breakdown-bar" style="width: ${Math.round(amount / max * 100)}%"></div></div>
          </div>`).join('') || '<p class="chart-empty-state">Add an expense to see spending by category.</p>'}
      </div>
    </section>
    <section class="chart-card" aria-label="Budgets">
      <div class="chart-header"><h3 class="chart-title">Budgets</h3><button type="button" class="btn-pill btn-outline open-add-budget-btn">+ Budget</button></div>
      <div class="budget-list">
        ${(state.budgets || []).map(budget => {
          const percent = Math.min(100, Math.round(budget.spent / budget.limit * 100));
          return `<div class="budget-card-item ${state.filter.category === budget.category ? 'active' : ''}" data-category="${escapeHtml(budget.category)}" role="button" tabindex="0" aria-label="Filter by ${escapeHtml(budget.category)}">
            <div class="budget-card-header"><span class="budget-category-label">${escapeHtml(budget.category)}</span>
              <button type="button" class="btn-icon-subtle delete-budget-trigger" data-category="${escapeHtml(budget.category)}" aria-label="Remove ${escapeHtml(budget.category)} budget" title="Remove budget">×</button>
            </div>
            <div class="budget-limit-stat">${money(budget.spent)} of ${money(budget.limit)}${budget.spent >= budget.limit ? ' · Limit reached' : ''}</div>
            <div class="budget-progress-track"><div class="budget-progress-bar" style="width: ${percent}%"></div></div>
          </div>`;
        }).join('') || '<p class="chart-empty-state">Set a budget to track a category’s spending limit.</p>'}
      </div>
    </section>`;
}
