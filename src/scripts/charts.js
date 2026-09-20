// HIGH-CONTRAST MONOCHROME CHARTS & BUDGETS (PESOS)

export function renderAnalytics(state, containerEl) {
  if (!containerEl) return;

  const metrics = state.getMetrics();
  const currency = state.userProfile.currency || '₱';
  const activeTx = state.getFilteredTransactions();

  // 1. Compute Category Breakdown
  const categoryTotals = {};
  activeTx
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const maxCatAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;

  // 2. Compute Weekly / Period Inflow vs Outflow
  const timeBuckets = [
    { label: 'W-1', in: 0, out: 0 },
    { label: 'W-2', in: 0, out: 0 },
    { label: 'W-3', in: 0, out: 0 },
    { label: 'W-4', in: 0, out: 0 }
  ];

  activeTx.forEach((t, idx) => {
    const bucketIdx = Math.min(3, Math.floor(idx / 3));
    if (t.type === 'income') {
      timeBuckets[3 - bucketIdx].in += t.amount;
    } else {
      timeBuckets[3 - bucketIdx].out += t.amount;
    }
  });

  const maxVal = Math.max(
    ...timeBuckets.map(b => Math.max(b.in, b.out)),
    10000
  );

  containerEl.innerHTML = `
    <!-- CAPITAL ALLOCATION GAUGE -->
    <div class="chart-card">
      <div class="chart-header">
        <div class="chart-title-group">
          <span class="chart-title">Capital Split</span>
          <span class="chart-subtitle">Biz vs Pers</span>
        </div>
        <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">
          ${metrics.businessPercent}% / ${metrics.personalPercent}%
        </span>
      </div>

      <div class="ratio-meter-container">
        <div class="ratio-bar-track">
          <div class="ratio-fill-business" style="width: ${metrics.businessPercent}%; background: var(--mono-black);">
            ${metrics.businessPercent > 14 ? metrics.businessPercent + '%' : ''}
          </div>
          <div class="ratio-fill-personal" style="width: ${metrics.personalPercent}%; background: var(--mono-300); color: var(--mono-black);">
            ${metrics.personalPercent > 14 ? metrics.personalPercent + '%' : ''}
          </div>
        </div>

        <div class="ratio-legend">
          <div class="ratio-legend-item">
            <span class="legend-swatch" style="background: var(--mono-black);"></span>
            <span>Business: <strong>${currency}${metrics.businessExpense.toLocaleString('en-US', { minimumFractionDigits: 0 })}</strong></span>
          </div>
          <div class="ratio-legend-item">
            <span class="legend-swatch" style="background: var(--mono-400);"></span>
            <span>Personal: <strong>${currency}${metrics.personalExpense.toLocaleString('en-US', { minimumFractionDigits: 0 })}</strong></span>
          </div>
        </div>
      </div>
    </div>

    <!-- MONOCHROME CASH FLOW VELOCITY (SVG BARS) -->
    <div class="chart-card">
      <div class="chart-header">
        <div class="chart-title-group">
          <span class="chart-title">Cash Flow</span>
          <span class="chart-subtitle">Volume</span>
        </div>
        <div style="display: flex; gap: 8px; font-size: 10px; font-weight: 700;">
          <span style="color: var(--mono-black);">■ IN</span>
          <span style="color: var(--mono-400);">■ OUT</span>
        </div>
      </div>

      <div class="cashflow-chart-wrapper">
        <svg class="svg-chart-container" viewBox="0 0 320 120" preserveAspectRatio="none">
          <defs>
            <linearGradient id="inflowGradientMono" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#09090b" />
              <stop offset="100%" stop-color="#27272a" />
            </linearGradient>
            <linearGradient id="outflowGradientMono" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#a1a1aa" />
              <stop offset="100%" stop-color="#d4d4d8" />
            </linearGradient>
          </defs>

          <!-- Guide lines -->
          <line x1="10" y1="20" x2="310" y2="20" class="chart-axis-line" />
          <line x1="10" y1="55" x2="310" y2="55" class="chart-axis-line" />
          <line x1="10" y1="95" x2="310" y2="95" stroke="var(--border-subtle)" stroke-width="1" />

          <!-- Bars for each time bucket -->
          ${timeBuckets.map((b, i) => {
            const xBase = 30 + i * 74;
            const inHeight = Math.max(4, Math.round((b.in / maxVal) * 75));
            const outHeight = Math.max(4, Math.round((b.out / maxVal) * 75));
            const yIn = 95 - inHeight;
            const yOut = 95 - outHeight;

            return `
              <g class="chart-bar-group">
                <rect x="${xBase}" y="${yIn}" width="20" height="${inHeight}" rx="4" fill="url(#inflowGradientMono)">
                  <title>${b.label} In: ${currency}${b.in.toFixed(2)}</title>
                </rect>
                <rect x="${xBase + 24}" y="${yOut}" width="20" height="${outHeight}" rx="4" fill="url(#outflowGradientMono)">
                  <title>${b.label} Out: ${currency}${b.out.toFixed(2)}</title>
                </rect>
                <text x="${xBase + 22}" y="112" class="chart-label-text">${b.label}</text>
              </g>
            `;
          }).join('')}
        </svg>
      </div>
    </div>

    <!-- SPENDING BY CATEGORY BREAKDOWN -->
    <div class="chart-card">
      <div class="chart-header">
        <div class="chart-title-group">
          <span class="chart-title">Categories</span>
          <span class="chart-subtitle">Top</span>
        </div>
      </div>

      <div class="category-breakdown-list">
        ${sortedCategories.length === 0 ? `
          <div style="font-size: 11px; color: var(--text-tertiary); padding: 8px 0;">No records.</div>
        ` : sortedCategories.map(([cat, amt]) => {
          const barWidth = Math.round((amt / maxCatAmount) * 100);
          const isCatActive = state.filter.category === cat;
          return `
            <div class="breakdown-row ${isCatActive ? 'active' : ''}" data-category="${cat}" role="button" tabindex="0" title="${isCatActive ? 'Click to clear category filter' : `Filter transactions by ${cat}`}">
              <div class="breakdown-info">
                <span class="breakdown-name">${cat}</span>
                <span class="breakdown-amount">${currency}${amt.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
              </div>
              <div class="breakdown-track">
                <div class="breakdown-bar" style="width: ${barWidth}%; background: var(--mono-black);"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- CASHEW BUDGET LIMITS -->
    <div class="chart-card">
      <div class="chart-header">
        <div class="chart-title-group">
          <span class="chart-title">Budgets</span>
          <span class="chart-subtitle">Limits</span>
        </div>
        <button type="button" class="btn-pill btn-outline open-add-budget-btn" style="padding: 3px 9px; font-size: 11px;" title="Set Category Budget">
          <span>+</span>
          <span>Budget</span>
        </button>
      </div>

      <div class="budget-list">
        ${(!state.budgets || state.budgets.length === 0) ? `
          <div class="budget-empty-box" style="padding: 18px 12px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px;">
            <div style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">No spending limits</div>
            <div style="font-size: 11px; color: var(--text-tertiary);">Set category caps to control burn.</div>
            <button type="button" class="btn-pill btn-primary open-add-budget-btn" style="margin-top: 4px; font-size: 11px; padding: 4px 12px;">+ Set Budget</button>
          </div>
        ` : state.budgets.map(b => {
          const pct = Math.min(100, Math.round((b.spent / b.limit) * 100));
          const isOver = pct >= 100;
          const isCatActive = state.filter.category === b.category;
          return `
            <div class="budget-card-item ${isCatActive ? 'active' : ''}" data-category="${b.category}" role="button" tabindex="0" title="${isCatActive ? 'Click to clear category filter' : `Filter transactions by ${b.category}`}">
              <div class="budget-card-header">
                <span class="budget-category-label">${b.category}</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="budget-limit-stat ${isOver ? 'over-limit' : ''}">
                    ${currency}${b.spent.toLocaleString()} / ${currency}${b.limit.toLocaleString()}
                  </span>
                  <button type="button" class="btn-icon-subtle delete-budget-trigger" data-category="${b.category}" title="Delete Budget" style="font-size: 11px; padding: 0 4px; color: var(--text-tertiary); cursor: pointer; border: none; background: none; line-height: 1;">✕</button>
                </div>
              </div>
              <div class="budget-progress-track">
                <div class="budget-progress-bar ${isOver ? 'over-limit' : ''}" style="width: ${pct}%;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
