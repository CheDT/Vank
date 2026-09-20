// TRANSACTION LEDGER COMPONENT (BLACK & WHITE MONOCHROME & PESOS)

export function renderLedger(state, tableBodyEl, countEl) {
  if (!tableBodyEl) return;

  const transactions = state.getFilteredTransactions();
  const currency = state.userProfile.currency || '₱';

  if (countEl) {
    countEl.textContent = `${transactions.length} entries`;
  }

  const emptyStateEl = document.getElementById('ledger-empty-state');
  if (transactions.length === 0) {
    tableBodyEl.innerHTML = '';
    if (emptyStateEl) emptyStateEl.style.display = 'flex';
    return;
  }

  if (emptyStateEl) emptyStateEl.style.display = 'none';

  tableBodyEl.innerHTML = transactions.map(tx => {
    const isIncome = tx.type === 'income';
    const amountPrefix = isIncome ? '+' : '-';
    const amountClass = isIncome ? 'income' : 'expense';
    const formattedDate = formatDateHuman(tx.date);

    return `
      <tr data-id="${tx.id}">
        <!-- DATE -->
        <td class="cell-date">
          ${formattedDate}
        </td>

        <!-- DESCRIPTION & MEMO -->
        <td>
          <div class="cell-description">
            <span class="description-title" title="${escapeHtml(tx.description)}">
              ${escapeHtml(tx.description)}
            </span>
            ${tx.memo ? `<span class="description-memo">${escapeHtml(tx.memo)}</span>` : ''}
          </div>
        </td>

        <!-- CLASSIFICATION: BUSINESS VS PERSONAL -->
        <td>
          <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
            <span class="badge-classification ${tx.classification}">
              ${tx.classification === 'business' ? 'BIZ' : 'PERS'}
            </span>
            ${tx.taxDeductible ? `
              <span class="badge-tax" title="Tax Deductible Business Expense">
                TAX DED.
              </span>
            ` : ''}
            ${tx.client ? `
              <span style="font-size: 10px; color: var(--mono-500); font-weight: 500;">
                [${escapeHtml(tx.client)}]
              </span>
            ` : ''}
          </div>
        </td>

        <!-- CATEGORY CHIP WITH MONOCHROME SVG -->
        <td>
          <span class="chip-category ${state.filter.category === tx.category ? 'active' : ''}" data-category="${escapeHtml(tx.category)}" role="button" tabindex="0" title="${state.filter.category === tx.category ? 'Click to clear category filter' : `Filter by category ${escapeHtml(tx.category)}`}">
            ${getCategorySvg(tx.category)}
            <span>${escapeHtml(tx.category)}</span>
          </span>
        </td>

        <!-- ACCOUNT -->
        <td>
          <span class="chip-account ${state.activeVirtualBankId && state.activeVirtualBankId === tx.bankId ? 'active' : ''}" data-account="${escapeHtml(tx.account)}" data-bank-id="${tx.bankId || ''}" role="button" tabindex="0" title="Filter by bank card ${escapeHtml(tx.account)}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="opacity: 0.7; flex-shrink: 0;">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
            <span class="chip-account-name">${escapeHtml(tx.account)}</span>
          </span>
        </td>

        <!-- AMOUNT -->
        <td class="cell-amount ${amountClass}">
          ${amountPrefix}${currency}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>

        <!-- ROW ACTIONS -->
        <td>
          <div class="row-actions">
            <button class="btn-icon-subtle edit-tx-btn" data-id="${tx.id}" title="Edit">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-icon-subtle duplicate-tx-btn" data-id="${tx.id}" title="Duplicate">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button class="btn-icon-subtle delete delete-tx-btn" data-id="${tx.id}" title="Delete">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function formatDateHuman(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${months[monthIdx] || parts[1]} ${parseInt(parts[2], 10)}`;
}

// Clean Monochrome SVGs (Zero Emojis)
function getCategorySvg(cat) {
  const common = 'width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"';
  switch (cat) {
    case 'Cloud & Tech':
      return `<svg ${common}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`;
    case 'Client Revenue':
      return `<svg ${common}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    case 'Groceries':
      return `<svg ${common}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
    case 'Meals & Meetings':
      return `<svg ${common}><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>`;
    case 'Payroll & Salary':
      return `<svg ${common}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`;
    case 'Commute & Travel':
      return `<svg ${common}><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8M12 17v4M7 8h10"/></svg>`;
    case 'Equipment & Office':
      return `<svg ${common}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
    case 'Education & Books':
      return `<svg ${common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/></svg>`;
    default:
      return `<svg ${common}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
