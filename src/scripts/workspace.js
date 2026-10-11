import { getBankLogoSvg, detectBankBrand } from './bankLogos.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

export class WorkspaceController {
  constructor(state, onboardingWizard, bankModal) {
    this.state = state;
    this.onboarding = onboardingWizard;
    this.bankModal = bankModal;
    this.workspaceSelectBtn = document.getElementById('btn-workspace-dropdown');
    this.workspaceDropdown = document.getElementById('workspace-dropdown-menu');
    this.workspaceLabel = document.getElementById('current-workspace-label');
    this.searchInput = document.getElementById('global-search-input');
    this.searchChipsContainer = document.getElementById('search-chips-container');
    this.userAvatarBtn = document.getElementById('user-avatar-btn');
    this.accountPopover = document.getElementById('account-popover');
    this.virtualCardsRack = document.getElementById('virtual-cards-rack');
    this.btnAllCardsView = document.getElementById('btn-all-cards-view');
    this.allCardsViewText = document.getElementById('all-cards-view-text');
    this.mobileMenuSheet = document.getElementById('mobile-app-menu-sheet');
    this.mobileDockMenuBtn = document.getElementById('mobile-dock-menu-btn');
    this.mobileDock = document.getElementById('mobile-bottom-dock');
    this.dockIndicator = this.mobileDock.querySelector('.mobile-dock-indicator');
    this.mobileBanksRack = document.getElementById('mobile-menu-banks-rack');
    this.bindEvents();
    this.setPage(location.hash.slice(1) || 'overview', false);
    this.render();
  }

  bindEvents() {
    this.workspaceSelectBtn.addEventListener('click', event => {
      event.stopPropagation();
      this.togglePopover(this.workspaceDropdown, this.workspaceSelectBtn);
    });
    this.userAvatarBtn.addEventListener('click', event => {
      event.stopPropagation();
      this.togglePopover(this.accountPopover, this.userAvatarBtn);
    });
    [this.workspaceDropdown, this.accountPopover].forEach(menu => {
      menu.addEventListener('click', event => event.stopPropagation());
    });
    document.querySelectorAll('[data-workspace], [data-mobile-ws]').forEach(button => {
      button.addEventListener('click', () => {
        this.state.setActiveWorkspace(button.dataset.workspace || button.dataset.mobileWs);
        this.closePopovers();
      });
    });
    document.addEventListener('click', () => this.closePopovers());

    this.mobileDockMenuBtn.addEventListener('click', () => this.openMobileMenu());
    document.getElementById('btn-close-mobile-menu').addEventListener('click', () => this.closeMobileMenu());
    document.querySelectorAll('.refresh-data-trigger').forEach(button => {
      button.addEventListener('click', () => {
        this.closePopovers();
        this.closeMobileMenu(false);
        this.state.retrySync();
      });
    });
    this.mobileMenuSheet.addEventListener('click', event => {
      if (event.target === this.mobileMenuSheet) this.closeMobileMenu();
    });

    document.querySelectorAll('[data-page]').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        this.setPage(link.dataset.page);
        if (link.classList.contains('skip-link')) document.getElementById('main-content').focus();
      });
    });
    window.addEventListener('popstate', () => this.setPage(location.hash.slice(1) || 'overview', false));
    window.addEventListener('hashchange', () => this.setPage(location.hash.slice(1) || 'overview', false));
    window.addEventListener('resize', () => {
      this.closePopovers();
      if (window.innerWidth > 760) this.closeMobileMenu(false);
      this.applyStackPositions(false);
      this.showMobileDock();
    });
    const dockObserver = new ResizeObserver(() => this.updateDockIndicator());
    this.mobileDock.querySelectorAll('.mobile-dock-btn').forEach(button => dockObserver.observe(button));
    this.mobileDock.addEventListener('focusin', () => this.showMobileDock());
    this.lastScrollY = window.scrollY;
    this.scrollTravel = 0;
    window.addEventListener('scroll', () => {
      if (window.innerWidth > 760 || this.mobileMenuSheet.classList.contains('active')) return;
      const y = Math.max(0, window.scrollY);
      const delta = y - this.lastScrollY;
      this.lastScrollY = y;
      this.scrollTravel = Math.sign(delta) === Math.sign(this.scrollTravel) ? this.scrollTravel + delta : delta;
      if (y < 40 || this.scrollTravel < -8) this.showMobileDock();
      else if (y > 80 && this.scrollTravel > 8 && !this.mobileDock.querySelector(':focus-visible')) {
        this.mobileDock.classList.add('dock-hidden');
        this.mobileDock.inert = true;
      }
    }, { passive: true });

    this.searchInput.addEventListener('input', event => {
      if (event.target.value && this.page !== 'ledger') this.setPage('ledger');
      this.state.setFilter({ search: event.target.value });
    });
    document.addEventListener('keydown', event => {
      const activeElement = document.activeElement;
      const typing = activeElement.matches('input, textarea, select, [contenteditable="true"]');
      if (event.key === '/' && !typing && !document.querySelector('.modal-backdrop.active, .onboarding-overlay.active')) {
        event.preventDefault();
        this.searchInput.focus();
      }
      if (event.key === 'Escape') {
        if (this.mobileMenuSheet.classList.contains('active')) this.closeMobileMenu();
        else this.closePopovers(true);
      }
      if (event.key === 'Tab' && this.mobileMenuSheet.classList.contains('active')) {
        this.trapFocus(event, this.mobileMenuSheet);
      }
      // Legacy data controls use role="button"; give them native button keys.
      if ((event.key === 'Enter' || event.key === ' ') && activeElement.matches('[role="button"]')) {
        event.preventDefault();
        activeElement.click();
      }
    });

    document.addEventListener('click', event => {
      if (event.target.closest('.open-add-bank-trigger')) {
        event.preventDefault();
        this.closeMobileMenu(false);
        this.bankModal.open();
      } else if (event.target.closest('.open-add-budget-btn, .open-add-modal-btn')) {
        this.closeMobileMenu(false);
      }
    });
    this.virtualCardsRack.addEventListener('click', event => {
      const manage = event.target.closest('.btn-card-menu');
      if (manage) {
        this.bankModal.open(manage.dataset.bankId);
        return;
      }
      const card = event.target.closest('[data-bank-id]');
      if (card) {
        const banks = this.state.virtualBanks || [];
        const id = card.dataset.bankId;
        if (id === this.frontBankId && banks.length > 1) {
          const next = (banks.findIndex(bank => bank.id === id) + 1) % banks.length;
          this.state.setActiveVirtualBank(banks[next].id);
        } else {
          this.state.setActiveVirtualBank(id);
        }
      }
    });
    document.getElementById('bank-management-list').addEventListener('click', event => {
      const button = event.target.closest('[data-manage-bank]');
      if (button) this.bankModal.open(button.dataset.manageBank);
    });
    this.mobileBanksRack.addEventListener('click', event => {
      const card = event.target.closest('[data-mobile-bank-id]');
      if (card) {
        this.selectBank(card.dataset.mobileBankId);
        this.closeMobileMenu();
      }
    });
    this.btnAllCardsView.addEventListener('click', () => this.state.setActiveVirtualBank('all'));
    this.searchChipsContainer.addEventListener('click', event => {
      const button = event.target.closest('[data-clear-filter]');
      if (button?.dataset.clearFilter === 'category') this.state.setFilter({ category: 'all' });
      if (button?.dataset.clearFilter === 'bank') this.state.setActiveVirtualBank('all');
    });

    const bindAction = (ids, action) => ids.forEach(id => {
      document.getElementById(id).addEventListener('click', () => {
        this.closePopovers();
        this.closeMobileMenu(false);
        action();
      });
    });
    bindAction(['btn-repersonalize', 'mobile-action-setup'], () => this.onboarding.show(1));
    bindAction(['btn-new-profile', 'mobile-action-new-profile'], () => {
      this.state.startBlankProfile();
      this.onboarding.show(1, true);
    });
    bindAction(['btn-reset-demo', 'mobile-action-demo'], () => {
      if (confirm('Replace your current profile with sample demo data?')) this.state.resetDemoData();
    });
    bindAction(['btn-clear-transactions', 'mobile-action-clear'], () => {
      if (confirm('Permanently delete all transactions?')) this.state.clearAllTransactions();
    });
    bindAction(['btn-export-csv', 'mobile-action-export'], () => this.exportToCSV());
  }

  togglePopover(menu, trigger) {
    const opening = !menu.classList.contains('active');
    this.closePopovers();
    if (opening) {
      menu.classList.add('active');
      trigger.setAttribute('aria-expanded', 'true');
      this.popoverTrigger = trigger;
      menu.querySelector('button')?.focus();
    }
  }

  closePopovers(restoreFocus = false) {
    this.workspaceDropdown.classList.remove('active');
    this.accountPopover.classList.remove('active');
    this.workspaceSelectBtn.setAttribute('aria-expanded', 'false');
    this.userAvatarBtn.setAttribute('aria-expanded', 'false');
    if (restoreFocus) this.popoverTrigger?.focus();
  }

  openMobileMenu() {
    this.closePopovers();
    this.showMobileDock();
    this.returnFocus = document.activeElement;
    this.renderMobileMenuBanks();
    this.mobileMenuSheet.classList.add('active');
    this.mobileDockMenuBtn.setAttribute('aria-expanded', 'true');
    this.setDockSelection(this.mobileDockMenuBtn);
    document.querySelector('.workspace-header').inert = true;
    document.querySelector('.workspace-body').inert = true;
    document.querySelector('.mobile-bottom-dock').inert = true;
    document.body.classList.add('menu-open');
    document.getElementById('btn-close-mobile-menu').focus();
  }

  closeMobileMenu(restoreFocus = true) {
    if (!this.mobileMenuSheet.classList.contains('active')) return;
    this.mobileMenuSheet.classList.remove('active');
    this.mobileDockMenuBtn.setAttribute('aria-expanded', 'false');
    this.setDockSelection(this.mobileDock.querySelector(`[data-page="${this.page}"]`));
    document.querySelector('.workspace-header').inert = false;
    document.querySelector('.workspace-body').inert = false;
    document.querySelector('.mobile-bottom-dock').inert = false;
    document.body.classList.remove('menu-open');
    if (restoreFocus) this.returnFocus?.focus();
    else if (this.mobileMenuSheet.contains(document.activeElement)) this.mobileDockMenuBtn.focus();
  }

  showMobileDock() {
    this.mobileDock.classList.remove('dock-hidden');
    if (!this.mobileMenuSheet.classList.contains('active')) this.mobileDock.inert = false;
  }

  setDockSelection(selected) {
    this.mobileDock.querySelectorAll('.mobile-dock-btn').forEach(button => {
      button.classList.toggle('active', button === selected);
    });
    requestAnimationFrame(() => this.updateDockIndicator());
  }

  updateDockIndicator() {
    const active = this.mobileDock.querySelector('.mobile-dock-btn.active');
    if (!active || !this.mobileDock.getClientRects().length) return;
    this.dockIndicator.style.width = `${active.offsetWidth}px`;
    this.dockIndicator.style.transform = `translateX(${active.offsetLeft}px)`;
  }

  trapFocus(event, container) {
    const controls = Array.from(container.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')).filter(el => !el.disabled && el.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  setPage(page, updateHistory = true) {
    const target = ['overview', 'banks', 'ledger', 'planning'].includes(page) ? page : 'overview';
    const changed = target !== this.page;
    this.page = target;
    document.querySelector('.app-container').dataset.view = target;
    if (target === 'overview' || target === 'banks') {
      const slot = document.getElementById(target === 'overview' ? 'overview-banks-slot' : 'banks-cards-slot');
      slot.appendChild(document.getElementById('cards-section'));
    }
    document.querySelectorAll('.workspace-page').forEach(section => {
      section.hidden = section.id !== target;
      if (section.hidden) section.classList.remove('page-enter');
      else if (changed) {
        section.classList.remove('page-enter');
        void section.offsetWidth;
        section.classList.add('page-enter');
      }
    });
    this.closePopovers();
    this.closeMobileMenu(false);
    if (updateHistory && location.hash !== `#${target}`) history.pushState(null, '', `#${target}`);
    document.title = `Vank | ${target.charAt(0).toUpperCase() + target.slice(1)}`;
    document.querySelectorAll('.rail-link').forEach(link => {
      const active = link.dataset.page === target;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.querySelectorAll('.mobile-dock-btn[data-page]').forEach(button => {
      const active = button.dataset.page === target;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    this.applyStackPositions(false);
    this.showMobileDock();
    this.updateDockIndicator();
    window.scrollTo(0, 0);
    this.lastScrollY = 0;
    this.scrollTravel = 0;
  }

  selectBank(id) {
    this.state.setActiveVirtualBank(this.state.activeVirtualBankId === id ? 'all' : id);
  }

  render() {
    const profile = this.state.userProfile;
    const initials = (profile.name || '').trim().split(/\s+/).filter(Boolean).map(name => name[0]).join('').slice(0, 2).toUpperCase() || 'U';
    this.workspaceLabel.textContent = { all: 'All accounts', business: 'Business', personal: 'Personal' }[this.state.activeWorkspace] || 'All accounts';
    ['user-avatar-btn', 'popover-avatar-preview', 'mobile-menu-avatar'].forEach(id => {
      document.getElementById(id).textContent = initials;
    });
    ['popover-user-name', 'mobile-menu-user-name'].forEach(id => {
      document.getElementById(id).textContent = profile.name || 'Your profile';
    });
    ['popover-user-email', 'mobile-menu-user-email'].forEach(id => {
      const element = document.getElementById(id);
      element.textContent = profile.email || '';
      element.hidden = !profile.email;
    });
    document.getElementById('mobile-menu-struct-pill').textContent = profile.currencyCode || 'PHP';
    document.querySelectorAll('[data-workspace], [data-mobile-ws]').forEach(button => {
      const selected = (button.dataset.workspace || button.dataset.mobileWs) === this.state.activeWorkspace;
      button.classList.toggle('selected', selected);
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('.filter-btn').forEach(button => {
      const filter = this.state.filter;
      const selected = button.dataset.filter === (filter.type !== 'all' ? filter.type : filter.classification);
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    this.renderVirtualCards();
    this.renderMobileMenuBanks();
    this.renderSearchChips();
    this.renderOverview();
    this.renderBankManagement();
  }

  renderSearchChips() {
    const chips = [];
    if (this.state.filter.category !== 'all') chips.push(['category', this.state.filter.category]);
    const bank = this.state.virtualBanks.find(item => item.id === this.state.activeVirtualBankId);
    if (bank) chips.push(['bank', bank.name]);
    this.searchChipsContainer.innerHTML = chips.map(([type, label]) => `
      <button type="button" class="filter-chip" data-clear-filter="${type}" aria-label="Clear ${type} filter: ${escapeHtml(label)}">
        ${escapeHtml(label)} <span aria-hidden="true">×</span>
      </button>`).join('');
    this.searchChipsContainer.hidden = !chips.length;
  }

  renderVirtualCards() {
    const banks = this.state.virtualBanks || [];
    const currency = this.state.userProfile.currency || '₱';
    const holderName = this.state.userProfile.name || 'CARD MEMBER';
    const signature = JSON.stringify([banks, currency, holderName]);
    const rebuilding = signature !== this.bankSignature;
    if (rebuilding) {
      this.bankSignature = signature;
      this.virtualCardsRack.innerHTML = banks.map(bank => `
        <div class="debit-card ${escapeHtml(bank.gradient || 'gradient-obsidian')}" data-bank-id="${escapeHtml(bank.id)}" role="button" tabindex="0" aria-label="Select or cycle ${escapeHtml(bank.name)}">
          <div class="card-top-row">
            <div class="card-brand-header-left">
              <div class="card-brand-emblem">${getBankLogoSvg(bank.brand || detectBankBrand(bank.name))}</div>
              <div class="card-bank-info">
                <span class="card-bank-name">${escapeHtml(bank.name)}</span>
                <span class="card-class-badge">${bank.classification === 'business' ? 'BIZ' : 'PERS'}</span>
              </div>
            </div>
            <div class="card-top-actions">
              <div class="card-network-logo">${bank.network === 'mastercard'
                ? '<svg class="mastercard-logo-svg" viewBox="0 0 36 24" aria-label="Mastercard"><circle cx="13" cy="12" r="10" fill="#eb001b"/><circle cx="23" cy="12" r="10" fill="#f79e1b" fill-opacity="0.8"/></svg>'
                : '<svg class="visa-logo-svg" viewBox="0 0 52 17" aria-label="Visa"><path d="M19.5 1.5L13.1 15.5H8.7L5.3 4.2C5.1 3.4 4.9 3.1 4.3 2.7C3.3 2.1 1.5 1.6 0 1.3L0.1 0.7H7.1C8.0 0.7 8.8 1.3 9.0 2.3L10.7 11.2L15.1 0.7H19.5ZM37.1 10.7C37.1 6.6 31.4 6.4 31.5 4.6C31.5 4.0 32.1 3.4 33.3 3.3C33.9 3.2 35.6 3.1 37.3 3.9L38.0 0.8C37.0 0.4 35.8 0.1 34.2 0.1C30.0 0.1 27.0 2.4 27.0 5.6C26.9 8.0 29.1 9.3 30.7 10.1C32.4 10.9 32.9 11.4 32.9 12.1C32.9 13.2 31.6 13.7 30.3 13.7C28.2 13.7 27.0 13.1 26.0 12.6L25.2 15.8C26.3 16.3 28.3 16.7 30.2 16.7C34.6 16.7 37.1 14.5 37.1 10.7ZM47.8 15.5H51.7L48.3 0.7H44.7C43.9 0.7 43.2 1.2 42.9 1.9L36.7 15.5H41.1L42.0 13.0H47.3L47.8 15.5ZM43.2 9.8L45.4 3.7L46.7 9.8H43.2ZM26.2 0.7L22.8 15.5H18.7L22.1 0.7H26.2Z"/></svg>'}</div>
            <button type="button" class="btn-card-menu" data-bank-id="${escapeHtml(bank.id)}" aria-label="Manage ${escapeHtml(bank.name)}" title="Manage ${escapeHtml(bank.name)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
            </button>
            </div>
          </div>
          <div class="card-mid-row">
            <div class="card-emv-chip"></div>
            <svg class="card-contactless-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 16.5a5 5 0 0 1 0-9M12 19a9 9 0 0 0 0-14M15.5 21.5a13 13 0 0 0 0-19"/></svg>
            <span class="card-number-display">•••• •••• •••• ${escapeHtml(bank.last4 || '')}</span>
          </div>
          <div class="card-bottom-row">
            <div class="card-holder-area"><span class="card-holder-label">Cardholder</span><span class="card-holder-name">${escapeHtml((bank.cardHolder || holderName).toUpperCase())}</span></div>
            <div class="card-balance-box"><span class="card-balance-label">Balance</span><span class="card-balance-value">${currency}${(bank.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          </div>
        </div>`).join('') || '<div class="banks-empty-state">No banks yet. Add a bank to track its balance.</div>';
    }
    this.virtualCardsRack.querySelectorAll('.debit-card').forEach(card => {
      const selected = card.dataset.bankId === this.state.activeVirtualBankId;
      card.classList.toggle('active', selected);
      card.setAttribute('aria-pressed', String(selected));
    });
    const filtered = this.state.activeVirtualBankId !== 'all';
    this.btnAllCardsView.hidden = !filtered;
    this.allCardsViewText.textContent = 'Show all';
    this.applyStackPositions(!rebuilding);
  }

  applyStackPositions(animate = true) {
    if (!this.virtualCardsRack.getClientRects().length) return;
    const banks = this.state.virtualBanks || [];
    if (!banks.length) {
      this.virtualCardsRack.style.height = 'auto';
      return;
    }
    const mobile = window.innerWidth <= 760;
    const width = Math.min(320, this.virtualCardsRack.clientWidth);
    const height = Math.round(width / 1.6);
    const active = banks.find(bank => bank.id === this.state.activeVirtualBankId) || banks[0];
    this.frontBankId = active.id;
    const ordered = [active, ...banks.filter(bank => bank.id !== active.id)];
    const peek = mobile ? 30 : Math.max(0, Math.min(48, (this.virtualCardsRack.clientWidth - width) / Math.max(1, banks.length - 1)));
    const lastScale = Math.max(.90, 1 - (banks.length - 1) * .035);
    const fanWidth = mobile ? width : Math.max(width, (banks.length - 1) * peek + width * lastScale);
    const left = Math.max(0, (this.virtualCardsRack.clientWidth - fanWidth) / 2);
    ordered.forEach((bank, position) => {
      const card = Array.from(this.virtualCardsRack.children).find(element => element.dataset.bankId === bank.id);
      if (!card) return;
      card.style.transition = animate ? '' : 'none';
      card.style.width = `${width}px`;
      card.style.height = `${height}px`;
      card.style.zIndex = String(banks.length - position + 1);
      const scale = Math.max(.90, 1 - position * .035);
      card.style.transformOrigin = mobile ? 'top center' : 'top left';
      card.style.transform = mobile
        ? `translate(${left}px, ${position * peek}px) scale(${scale})`
        : `translate(${left + position * peek}px, 0) scale(${scale})`;
      card.style.filter = position === 0 ? '' : `brightness(${Math.max(.7, 1 - position * .1)})`;
      card.classList.toggle('is-front', position === 0);
      card.querySelector('.btn-card-menu').tabIndex = position === 0 ? 0 : -1;
    });
    this.virtualCardsRack.style.height = `${height + (mobile ? (banks.length - 1) * peek : 0) + 26}px`;
    if (!animate) {
      void this.virtualCardsRack.offsetWidth;
      this.virtualCardsRack.querySelectorAll('.debit-card').forEach(card => { card.style.transition = ''; });
    }
  }

  renderOverview() {
    const transactions = this.state.getFilteredTransactions().slice(0, 5);
    const currency = this.state.userProfile.currency || '₱';
    document.getElementById('overview-transactions').innerHTML = transactions.map(tx => `
      <a class="recent-transaction" href="#ledger" data-overview-ledger>
        <span class="recent-transaction-details"><strong>${escapeHtml(tx.description)}</strong><span>${escapeHtml(tx.account)} · ${escapeHtml(tx.date)}</span></span>
        <span class="recent-transaction-amount">${tx.type === 'income' ? '+' : '-'}${currency}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </a>`).join('') || '<p class="overview-empty-state">No transactions yet. Add your first income or expense.</p>';
    document.querySelectorAll('[data-overview-ledger]').forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      this.setPage('ledger');
    }));
  }

  renderBankManagement() {
    const currency = this.state.userProfile.currency || '₱';
    document.getElementById('bank-management-list').innerHTML = (this.state.virtualBanks || []).map(bank => `
      <div class="bank-management-row"><span class="bank-management-name">${escapeHtml(bank.name)}</span>
        <span class="bank-management-balance">${currency}${(bank.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        <button type="button" class="btn-pill btn-outline" data-manage-bank="${escapeHtml(bank.id)}">Manage</button>
      </div>`).join('');
  }

  renderMobileMenuBanks() {
    const currency = this.state.userProfile.currency || '₱';
    this.mobileBanksRack.innerHTML = (this.state.virtualBanks || []).map(bank => `
      <button type="button" class="mobile-menu-bank-card ${this.state.activeVirtualBankId === bank.id ? 'active' : ''}" data-mobile-bank-id="${escapeHtml(bank.id)}" aria-pressed="${this.state.activeVirtualBankId === bank.id}">
        <span class="mobile-bank-card-name">${escapeHtml(bank.name)}</span>
        <span class="mobile-bank-card-balance">${currency}${(bank.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </button>`).join('') || '<p class="banks-empty-state">No banks yet.</p>';
  }

  exportToCSV() {
    const transactions = this.state.getFilteredTransactions();
    if (!transactions.length) {
      alert('No transactions in this view to export.');
      return;
    }
    const quote = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const headers = ['ID', 'Date', 'Description', 'Memo', 'Type', 'Amount', 'Currency', 'Category', 'Account', 'BankId', 'Classification', 'TaxDeductible', 'Client'];
    const rows = transactions.map(tx => [tx.id, tx.date, tx.description, tx.memo, tx.type,
      tx.amount.toFixed(2), this.state.userProfile.currencyCode || 'PHP', tx.category, tx.account,
      tx.bankId, tx.classification, tx.taxDeductible ? 'YES' : 'NO', tx.client].map(quote).join(','));
    const url = URL.createObjectURL(new Blob([[headers.join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `vank-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
