import { getBankLogoSvg, detectBankBrand } from './bankLogos.js';

// WORKSPACE NAVIGATION, SEARCH CHIPS, USER PROFILE & VIRTUAL BANK CARDS CONTROLLER

export class WorkspaceController {
  constructor(state, onboardingWizard, bankModal) {
    this.state = state;
    this.onboarding = onboardingWizard;
    this.bankModal = bankModal;

    // Elements
    this.workspaceSelectBtn = document.getElementById('btn-workspace-dropdown');
    this.workspaceDropdown = document.getElementById('workspace-dropdown-menu');
    this.workspaceLabel = document.getElementById('current-workspace-label');

    this.searchInput = document.getElementById('global-search-input');
    this.searchChipsContainer = document.getElementById('search-chips-container');

    this.userAvatarBtn = document.getElementById('user-avatar-btn');
    this.accountPopover = document.getElementById('account-popover');
    this.profileNameEl = document.getElementById('popover-user-name');
    this.profileEmailEl = document.getElementById('popover-user-email');
    this.popoverAvatarEl = document.getElementById('popover-avatar-preview');

    this.exportBtn = document.getElementById('btn-export-csv');
    this.resetBtn = document.getElementById('btn-reset-demo');
    this.rePersonalizeBtn = document.getElementById('btn-repersonalize');
    this.newProfileBtn = document.getElementById('btn-new-profile');
    this.clearTxBtn = document.getElementById('btn-clear-transactions');

    // Virtual Card Rack & Rail Elements
    this.virtualCardsRack = document.getElementById('virtual-cards-rack');
    this.railBanksList = document.getElementById('rail-banks-list');
    this.cardsCountBadge = document.getElementById('cards-count-badge');
    this.btnAllCardsView = document.getElementById('btn-all-cards-view');
    this.allCardsViewText = document.getElementById('all-cards-view-text');
    this.navCountAll = document.getElementById('nav-count-all');
    this.allBanksNavItem = document.querySelector('[data-bank-nav="all"]');

    // Mobile Menu & Dock Elements
    this.mobileMenuSheet = document.getElementById('mobile-app-menu-sheet');
    this.mobileMenuCloseBtn = document.getElementById('btn-close-mobile-menu');
    this.mobileMenuDoneBtn = document.getElementById('btn-done-mobile-menu');
    this.mobileDockMenuBtn = document.getElementById('mobile-dock-menu-btn');
    this.mobileProfileAvatar = document.getElementById('mobile-menu-avatar');
    this.mobileProfileName = document.getElementById('mobile-menu-user-name');
    this.mobileProfileEmail = document.getElementById('mobile-menu-user-email');
    this.mobileProfileStruct = document.getElementById('mobile-menu-struct-pill');
    this.mobileBanksRack = document.getElementById('mobile-menu-banks-rack');
    this.dockAvatarMini = document.getElementById('dock-avatar-mini');

    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Responsive: re-stack cards when viewport crosses the mobile breakpoint
    let _resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(_resizeTimer);
      _resizeTimer = setTimeout(() => {
        if (this.virtualCardsRack) this._applyStackPositions();
      }, 120);
    });

    // Workspace dropdown toggle
    if (this.workspaceSelectBtn && this.workspaceDropdown) {
      this.workspaceSelectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.innerWidth <= 768) {
          this.openMobileMenu();
          return;
        }
        this.workspaceDropdown.classList.toggle('active');
        if (this.accountPopover) this.accountPopover.classList.remove('active');
      });

      const options = this.workspaceDropdown.querySelectorAll('.workspace-option-item');
      options.forEach(opt => {
        opt.addEventListener('click', () => {
          const ws = opt.dataset.workspace;
          this.state.setActiveWorkspace(ws);
          this.workspaceDropdown.classList.remove('active');
        });
      });
    }

    // Account popover toggle / Mobile Menu trigger
    if (this.userAvatarBtn) {
      this.userAvatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.innerWidth <= 768) {
          this.openMobileMenu();
        } else if (this.accountPopover) {
          this.accountPopover.classList.toggle('active');
          if (this.workspaceDropdown) this.workspaceDropdown.classList.remove('active');
        }
      });
    }

    // Mobile Dock Menu Trigger
    if (this.mobileDockMenuBtn) {
      this.mobileDockMenuBtn.addEventListener('click', () => {
        this.openMobileMenu();
      });
    }

    // Mobile Menu Close Buttons
    if (this.mobileMenuCloseBtn) {
      this.mobileMenuCloseBtn.addEventListener('click', () => this.closeMobileMenu());
    }

    if (this.mobileMenuDoneBtn) {
      this.mobileMenuDoneBtn.addEventListener('click', () => this.closeMobileMenu());
    }

    if (this.mobileMenuSheet) {
      this.mobileMenuSheet.addEventListener('click', (e) => {
        if (e.target === this.mobileMenuSheet) {
          this.closeMobileMenu();
        }
      });
    }

    // Mobile Dock Navigation Tabs
    const mobileDockTabs = document.querySelectorAll('.mobile-dock-btn[data-dock-tab]');
    mobileDockTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.dockTab;
        if (tab === 'menu') return; // Handled by mobileDockMenuBtn

        mobileDockTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (tab === 'cards' && this.virtualCardsRack) {
          this.virtualCardsRack.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (tab === 'ledger') {
          const ledgerEl = document.getElementById('main-ledger-table') || document.querySelector('.ledger-card');
          if (ledgerEl) ledgerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (tab === 'stats') {
          const statsEl = document.getElementById('analytics-container') || document.querySelector('.tactical-summary-grid');
          if (statsEl) statsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Mobile Workspace Switcher in Menu Sheet
    const mobileWsBtns = document.querySelectorAll('.mobile-ws-btn[data-mobile-ws]');
    mobileWsBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const ws = btn.dataset.mobileWs;
        this.state.setActiveWorkspace(ws);
        mobileWsBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Mobile Quick Actions inside Sheet
    const mobileSetupBtn = document.getElementById('mobile-action-setup');
    if (mobileSetupBtn) {
      mobileSetupBtn.addEventListener('click', () => {
        this.closeMobileMenu();
        this.onboarding.show(1);
      });
    }

    const mobileGuideBtn = document.getElementById('mobile-action-guide');
    if (mobileGuideBtn) {
      mobileGuideBtn.addEventListener('click', () => {
        this.closeMobileMenu();
        const guideTrigger = document.getElementById('btn-show-guide');
        if (guideTrigger) guideTrigger.click();
      });
    }

    const mobileExportBtn = document.getElementById('mobile-action-export');
    if (mobileExportBtn) {
      mobileExportBtn.addEventListener('click', () => {
        this.closeMobileMenu();
        this.exportToCSV();
      });
    }

    const mobileNewProfBtn = document.getElementById('mobile-action-new-profile');
    if (mobileNewProfBtn) {
      mobileNewProfBtn.addEventListener('click', () => {
        this.closeMobileMenu();
        this.state.startBlankProfile();
        this.onboarding.show(1, true);
      });
    }

    const mobileDemoBtn = document.getElementById('mobile-action-demo');
    if (mobileDemoBtn) {
      mobileDemoBtn.addEventListener('click', () => {
        this.closeMobileMenu();
        if (confirm('Load sample demonstration records with Philippine Virtual Banks?')) {
          this.state.resetDemoData();
        }
      });
    }

    const mobileClearBtn = document.getElementById('mobile-action-clear');
    if (mobileClearBtn) {
      mobileClearBtn.addEventListener('click', () => {
        this.closeMobileMenu();
        if (confirm('Clear all transactions to start with a blank ledger?')) {
          this.state.clearAllTransactions();
        }
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      if (this.workspaceDropdown) this.workspaceDropdown.classList.remove('active');
      if (this.accountPopover) this.accountPopover.classList.remove('active');
    });

    // Search input with instant filtering
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.state.setFilter({ search: e.target.value });
      });

      // Quick key / for focusing search
      window.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== this.searchInput && !document.querySelector('.modal-backdrop.active') && !document.querySelector('.onboarding-overlay.active')) {
          e.preventDefault();
          this.searchInput.focus();
        }
      });
    }

    // Open Add Bank Modal Triggers (Global listener for dynamically rendered buttons)
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('.open-add-bank-trigger');
      if (trigger) {
        e.preventDefault();
        e.stopPropagation();
        this.closeMobileMenu();
        if (this.bankModal) this.bankModal.open();
      }

      if (e.target.closest('.open-add-budget-btn') || e.target.closest('.open-add-modal-btn')) {
        this.closeMobileMenu();
      }
    });

    // All Virtual Banks Nav Filter
    if (this.allBanksNavItem) {
      this.allBanksNavItem.addEventListener('click', () => {
        this.state.setActiveVirtualBank('all');
      });
    }

    // All Cards Shelf View Button Toggle
    if (this.btnAllCardsView) {
      this.btnAllCardsView.addEventListener('click', () => {
        this.state.setActiveVirtualBank('all');
      });
    }

    // Search Chips Clear Listener
    if (this.searchChipsContainer) {
      this.searchChipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-clear-filter]');
        if (chip) {
          const type = chip.dataset.clearFilter;
          if (type === 'category') {
            this.state.setFilter({ category: 'all' });
          } else if (type === 'bank') {
            this.state.setActiveVirtualBank('all');
          }
        }
      });
    }

    // Virtual Card Rack Selection Delegation
    if (this.virtualCardsRack) {
      this.virtualCardsRack.addEventListener('click', (e) => {
        // Handle 3-Dots Menu Trigger -> Open Card Edit / Manage Modal
        const menuBtn = e.target.closest('.btn-card-menu');
        if (menuBtn) {
          e.stopPropagation();
          const bankId = menuBtn.dataset.bankId;
          if (this.bankModal) {
            this.bankModal.open(bankId);
          }
          return;
        }

        // Support fallback remove trigger if any
        const removeBtn = e.target.closest('.btn-card-remove');
        if (removeBtn) {
          e.stopPropagation();
          const bankId = removeBtn.dataset.removeBankId;
          if (this.bankModal) {
            this.bankModal.open(bankId);
          }
          return;
        }

        const card = e.target.closest('.debit-card');
        if (card && card.dataset.bankId) {
          const bankId = card.dataset.bankId;
          if (this.state.activeVirtualBankId === bankId) {
            const banks = this.state.virtualBanks || [];
            if (banks.length > 1) {
              const currentIndex = banks.findIndex(bank => bank.id === bankId);
              const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % banks.length : 0;
              this.state.setActiveVirtualBank(banks[nextIndex].id);
            }
          } else {
            this.state.setActiveVirtualBank(bankId);
          }
        }

        const slot = e.target.closest('.add-debit-card-slot');
        if (slot) {
        }
      });
    }

    // Rail Banks List Selection Delegation
    if (this.railBanksList) {
      this.railBanksList.addEventListener('click', (e) => {
        // Handle Manage Bank from Rail
        const menuBtn = e.target.closest('.btn-rail-bank-menu') || e.target.closest('.btn-rail-bank-remove');
        if (menuBtn) {
          e.stopPropagation();
          const bankId = menuBtn.dataset.bankId || menuBtn.dataset.removeBankId;
          if (this.bankModal) {
            this.bankModal.open(bankId);
          }
          return;
        }

        const navItem = e.target.closest('.nav-item[data-bank-id]');
        if (navItem && navItem.dataset.bankId) {
          const bankId = navItem.dataset.bankId;
          if (this.state.activeVirtualBankId === bankId) {
            this.state.setActiveVirtualBank('all');
          } else {
            this.state.setActiveVirtualBank(bankId);
          }
        }
      });
    }

    // Export CSV
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.exportToCSV());
    }

    // Reset Demo Data
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        if (confirm('Load sample demonstration records with Philippine Virtual Banks?')) {
          this.state.resetDemoData();
          if (this.accountPopover) this.accountPopover.classList.remove('active');
        }
      });
    }

    // Conversational Re-personalization
    if (this.rePersonalizeBtn) {
      this.rePersonalizeBtn.addEventListener('click', () => {
        if (this.accountPopover) this.accountPopover.classList.remove('active');
        this.onboarding.show(1);
      });
    }

    // Create New Blank Profile (Single initial bank)
    if (this.newProfileBtn) {
      this.newProfileBtn.addEventListener('click', () => {
        if (this.accountPopover) this.accountPopover.classList.remove('active');
        this.state.startBlankProfile();
        this.onboarding.show(1, true);
      });
    }

    // Clear All Transactions
    if (this.clearTxBtn) {
      this.clearTxBtn.addEventListener('click', () => {
        if (this.accountPopover) this.accountPopover.classList.remove('active');
        if (confirm('Clear all transactions to start with a blank ledger?')) {
          this.state.clearAllTransactions();
        }
      });
    }
  }

  openMobileMenu() {
    if (!this.mobileMenuSheet) return;
    this.renderMobileMenuBanks();
    this.mobileMenuSheet.classList.add('active');
    if (this.accountPopover) this.accountPopover.classList.remove('active');
    if (this.workspaceDropdown) this.workspaceDropdown.classList.remove('active');
  }

  closeMobileMenu() {
    if (!this.mobileMenuSheet) return;
    this.mobileMenuSheet.classList.remove('active');
  }

  renderMobileMenuBanks() {
    if (!this.mobileBanksRack) return;
    const banks = this.state.virtualBanks || [];
    const activeBankId = this.state.activeVirtualBankId || 'all';
    const currency = this.state.userProfile.currency || '₱';

    this.mobileBanksRack.innerHTML = banks.map(bank => {
      const isActive = activeBankId === bank.id;
      const brand = bank.brand || detectBankBrand(bank.name);
      const brandSvg = getBankLogoSvg(brand);
      const balance = bank.balance || 0;

      return `
        <div class="mobile-menu-bank-card ${bank.gradient || 'gradient-obsidian'} ${isActive ? 'active' : ''}" data-mobile-bank-id="${bank.id}" role="button" tabindex="0">
          <div class="mobile-bank-card-left">
            <div class="card-brand-emblem" style="flex-shrink: 0;">${brandSvg}</div>
            <div class="mobile-bank-card-info">
              <span class="mobile-bank-card-name">${bank.name}</span>
              <span class="mobile-bank-card-badge">${bank.classification === 'business' ? 'BIZ' : 'PERS'} •••• ${bank.last4 || '4829'}</span>
            </div>
          </div>
          <span class="mobile-bank-card-balance">${currency}${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      `;
    }).join('');

    // Attach click listeners to mobile bank cards
    const bankCards = this.mobileBanksRack.querySelectorAll('[data-mobile-bank-id]');
    bankCards.forEach(card => {
      card.addEventListener('click', () => {
        const bankId = card.dataset.mobileBankId;
        if (this.state.activeVirtualBankId === bankId) {
          this.state.setActiveVirtualBank('all');
        } else {
          this.state.setActiveVirtualBank(bankId);
        }
        this.closeMobileMenu();
      });
    });
  }

  render() {
    const profile = this.state.userProfile;
    const activeWs = this.state.activeWorkspace;
    const currency = profile.currency || '₱';

    // Update workspace button label
    if (this.workspaceLabel) {
      if (activeWs === 'business') {
        this.workspaceLabel.textContent = 'Business Ledger';
      } else if (activeWs === 'personal') {
        this.workspaceLabel.textContent = 'Personal Finances';
      } else {
        this.workspaceLabel.textContent = profile.workspaceName || 'Consolidated Ledger';
      }
    }

    // Compute initials for avatar badges
    const name = profile.name ? profile.name.trim() : '';
    const initials = name
      ? name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'U';

    // Update avatar button & desktop popover avatar
    if (this.userAvatarBtn) this.userAvatarBtn.textContent = name ? initials : '—';
    if (this.popoverAvatarEl) this.popoverAvatarEl.textContent = name ? initials : '—';

    // Update mobile menu avatar & bottom dock mini avatar
    if (this.mobileProfileAvatar) this.mobileProfileAvatar.textContent = name ? initials : '—';
    if (this.dockAvatarMini) this.dockAvatarMini.textContent = name ? initials : '—';

    // Update account popover info & mobile menu user info
    if (this.profileNameEl) this.profileNameEl.textContent = profile.name || 'New Profile';
    if (this.profileEmailEl) this.profileEmailEl.textContent = profile.email || 'Click Personalize to setup';

    if (this.mobileProfileName) this.mobileProfileName.textContent = profile.name || 'New Profile';
    if (this.mobileProfileEmail) this.mobileProfileEmail.textContent = profile.email || 'Personalized Workspace';
    if (this.mobileProfileStruct) this.mobileProfileStruct.textContent = `${currency} ${profile.currencyCode || 'PHP'}`;

    // Update active dropdown item highlight
    if (this.workspaceDropdown) {
      const options = this.workspaceDropdown.querySelectorAll('.workspace-option-item');
      options.forEach(opt => {
        if (opt.dataset.workspace === activeWs) {
          opt.classList.add('selected');
        } else {
          opt.classList.remove('selected');
        }
      });
    }

    // Update mobile workspace switcher active buttons
    const mobileWsBtns = document.querySelectorAll('.mobile-ws-btn[data-mobile-ws]');
    mobileWsBtns.forEach(btn => {
      if (btn.dataset.mobileWs === activeWs) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Render Virtual Debit Cards, Rail & Mobile Menu Cards
    this.renderVirtualCards();
    this.renderRailBanks();
    this.renderMobileMenuBanks();
    this.renderSearchChips();
  }

  renderSearchChips() {
    if (!this.searchChipsContainer) return;
    const chips = [];
    const filter = this.state.filter;
    
    if (filter.category && filter.category !== 'all') {
      chips.push(`
        <span class="filter-chip" data-clear-filter="category" title="Click to clear category filter">
          <span>Category: ${filter.category}</span>
          <button type="button" class="btn-chip-clear" aria-label="Clear category filter">✕</button>
        </span>
      `);
    }

    if (this.state.activeVirtualBankId && this.state.activeVirtualBankId !== 'all') {
      const bank = (this.state.virtualBanks || []).find(b => b.id === this.state.activeVirtualBankId);
      if (bank) {
        chips.push(`
          <span class="filter-chip" data-clear-filter="bank" title="Click to show all cards">
            <span>Card: ${bank.name}</span>
            <button type="button" class="btn-chip-clear" aria-label="Clear card filter">✕</button>
          </span>
        `);
      }
    }

    this.searchChipsContainer.innerHTML = chips.join('');
  }

  renderVirtualCards() {
    if (!this.virtualCardsRack) return;

    const banks = this.state.virtualBanks || [];
    const activeBankId = this.state.activeVirtualBankId || 'all';
    const currency = this.state.userProfile.currency || '₱';
    const holderName = (this.state.userProfile.name
      ? this.state.userProfile.name.trim() : 'CARD MEMBER').toUpperCase();

    // ── Signature: changes when bank list / content changes (not just active bank) ──
    const bankSig = banks.map(b =>
      `${b.id}:${b.name}:${b.gradient}:${b.brand}:${b.network}:${b.classification}:${b.last4}:${Math.round(b.balance * 100)}`
    ).join('|') + `|h:${holderName}|c:${currency}`;

    const needsRebuild = bankSig !== this._bankSig;
    this._bankSig = bankSig;

    if (needsRebuild) {
      // ── Full DOM rebuild ──────────────────────────────────────────────
      const cardsHtml = banks.map(bank => {
        const isMastercard = bank.network === 'mastercard';
        const balance = bank.balance || 0;
        const networkSvg = isMastercard
          ? `<svg class="mastercard-logo-svg" viewBox="0 0 36 24"><circle cx="13" cy="12" r="10" fill="#eb001b"/><circle cx="23" cy="12" r="10" fill="#f79e1b" fill-opacity="0.8"/></svg>`
          : `<svg class="visa-logo-svg" viewBox="0 0 50 16"><path d="M19.5 1.5L13.1 15.5H8.7L5.3 4.2C5.1 3.4 4.9 3.1 4.3 2.7C3.3 2.1 1.5 1.6 0 1.3L0.1 0.7H7.1C8.0 0.7 8.8 1.3 9.0 2.3L10.7 11.2L15.1 0.7H19.5ZM37.1 10.7C37.1 6.6 31.4 6.4 31.5 4.6C31.5 4.0 32.1 3.4 33.3 3.3C33.9 3.2 35.6 3.1 37.3 3.9L38.0 0.8C37.0 0.4 35.8 0.1 34.2 0.1C30.0 0.1 27.0 2.4 27.0 5.6C26.9 8.0 29.1 9.3 30.7 10.1C32.4 10.9 32.9 11.4 32.9 12.1C32.9 13.2 31.6 13.7 30.3 13.7C28.2 13.7 27.0 13.1 26.0 12.6L25.2 15.8C26.3 16.3 28.3 16.7 30.2 16.7C34.6 16.7 37.1 14.5 37.1 10.7ZM47.8 15.5H51.7L48.3 0.7H44.7C43.9 0.7 43.2 1.2 42.9 1.9L36.7 15.5H41.1L42.0 13.0H47.3L47.8 15.5ZM43.2 9.8L45.4 3.7L46.7 9.8H43.2ZM26.2 0.7L22.8 15.5H18.7L22.1 0.7H26.2Z"/></svg>`;
        const brand = bank.brand || detectBankBrand(bank.name);
        const brandSvg = getBankLogoSvg(brand);

        return `
          <div class="debit-card ${bank.gradient || 'gradient-obsidian'} stacked-behind"
               data-bank-id="${bank.id}" role="button" tabindex="0">
            <div class="card-top-row">
              <div class="card-brand-header-left">
                <div class="card-brand-emblem">${brandSvg}</div>
                <div class="card-bank-info">
                  <span class="card-bank-name">${bank.name}</span>
                  <span class="card-class-badge">${bank.classification === 'business' ? 'BIZ' : 'PERS'}</span>
                </div>
              </div>
              <div class="card-top-actions">
                <div class="card-network-logo">${networkSvg}</div>
                <button type="button" class="btn-card-menu" data-bank-id="${bank.id}"
                        title="Manage ${bank.name}" aria-label="Card Options">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="card-mid-row">
              <div class="card-emv-chip"></div>
              <svg class="card-contactless-icon" viewBox="0 0 24 24">
                <path d="M8.5 16.5a5 5 0 0 1 0-9M12 19a9 9 0 0 0 0-14M15.5 21.5a13 13 0 0 0 0-19"/>
              </svg>
              <span class="card-number-display">•••• •••• •••• ${bank.last4 || '4829'}</span>
            </div>
            <div class="card-bottom-row">
              <div class="card-holder-area">
                <span class="card-holder-label">Cardholder</span>
                <span class="card-holder-name">${holderName}</span>
              </div>
              <div class="card-balance-box">
                <span class="card-balance-label">Live Balance</span>
                <span class="card-balance-value">${currency}${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>`;
      }).join('');

      const addSlotHtml = `
        <div class="add-debit-card-slot open-add-bank-trigger" role="button" tabindex="0" title="Add New Virtual Bank">
          <div class="add-card-plus-icon">+</div>
          <span class="add-card-text">New Bank</span>
        </div>`;

      this.virtualCardsRack.innerHTML = cardsHtml + addSlotHtml;

      // 1. Paint cards at their final positions INSTANTLY (transition: none)
      this._applyStackPositions({ animate: false });

      // 2. Force a reflow so the browser records the "start" position
      //    (reading offsetWidth triggers layout)
      void this.virtualCardsRack.offsetWidth; // eslint-disable-line no-unused-expressions

      // 3. Re-enable transitions — nothing moves yet (positions unchanged)
      //    This ensures subsequent state changes animate smoothly
      const allCards = this.virtualCardsRack.querySelectorAll('.debit-card, .add-debit-card-slot');
      allCards.forEach(el => { el.style.transition = ''; });

    } else {
      // ── Only active card changed: update classes + animate positions ──
      const cardEls = this.virtualCardsRack.querySelectorAll('.debit-card');
      let activeIdx = banks.findIndex(b => b.id === activeBankId);
      if (activeIdx < 0) activeIdx = 0;

      cardEls.forEach(el => {
        const bid = el.dataset.bankId;
        const isActive = bid === activeBankId || (activeBankId === 'all' && bid === banks[activeIdx]?.id);
        el.classList.toggle('active', isActive);
        el.classList.toggle('stacked-behind', !isActive);
        el.tabIndex = isActive ? -1 : 0;
      });

      // Also update balance values in-place (no flicker)
      banks.forEach(bank => {
        const el = this.virtualCardsRack.querySelector(`[data-bank-id="${bank.id}"]`);
        if (!el) return;
        const balEl = el.querySelector('.card-balance-value');
        if (balEl) {
          balEl.textContent = `${currency}${(bank.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      });

      this._applyStackPositions({ animate: true });
    }

    this._updateAllCardsBtn(banks, activeBankId);
  }

  _updateAllCardsBtn(banks, activeBankId) {
    if (!this.btnAllCardsView) return;
    if (activeBankId === 'all') {
      this.btnAllCardsView.classList.add('active');
      if (this.allCardsViewText) {
        this.allCardsViewText.innerHTML = `All Cards (${banks.length})`;
      }
    } else {
      this.btnAllCardsView.classList.remove('active');
      const activeBank = banks.find(b => b.id === activeBankId);
      const name = activeBank ? activeBank.name : 'Card';
      if (this.allCardsViewText) {
        this.allCardsViewText.innerHTML = `<span class="active-dot"></span> Filtered: ${name} <span style="margin-left:5px;opacity:0.7;font-weight:800;">✕</span>`;
      }
    }
  }

  /**
   * Position cards as a centred horizontal fan (desktop) or vertical stack (mobile).
   *
   * HOW THE FAN WORKS (desktop):
   *   - Active card sits at the leftmost position of the fan.
   *   - Each subsequent card is offset +PEEK px to the right, so a strip of its
   *     gradient/content is visible behind the card in front of it.
   *   - The entire fan group is centred inside the rack container.
   *
   * ANIMATION:
   *   animate:false → transition overridden to "none" so cards jump to position instantly
   *   animate:true  → CSS transition (520ms ease) kicks in and animates the move
   */
  _applyStackPositions({ animate = true } = {}) {
    if (!this.virtualCardsRack) return;

    const banks = this.state.virtualBanks || [];
    const activeBankId = this.state.activeVirtualBankId || 'all';
    const isMobile = window.innerWidth <= 768;

    // ── Geometry constants ────────────────────────────────────────────
    const CARD_W  = 345;  // must match CSS .debit-card width
    const CARD_H  = 215;  // must match CSS .debit-card height
    const PEEK    = isMobile ? 38 : 58;  // px each back card peeks from behind
    const SLOT_W  = 110;  // add-slot visible width
    const SLOT_GAP = 20;

    // Active card index (default to 0 when "all" = no specific card selected)
    let activeIdx = banks.findIndex(b => b.id === activeBankId);
    if (activeIdx < 0) activeIdx = 0;

    // Reorder so active card is always first (stack position 0)
    const ordered = [
      banks[activeIdx],
      ...banks.filter((_, i) => i !== activeIdx)
    ].filter(Boolean);

    const n = ordered.length;

    // ── Centering ──────────────────────────────────────────────────────
    const fanW    = CARD_W + (n - 1) * PEEK;
    const totalW  = fanW + SLOT_GAP + SLOT_W;
    const rackW   = this.virtualCardsRack.offsetWidth || 700;
    const fanLeft = Math.max(0, Math.round((rackW - totalW) / 2));

    const cardEls = Array.from(this.virtualCardsRack.querySelectorAll('.debit-card'));

    ordered.forEach((bank, pos) => {
      const el = cardEls.find(c => c.dataset.bankId === bank.id);
      if (!el) return;

      const isActive = pos === 0;

      // X position: front card at fanLeft, each successive card +PEEK further right
      const xPos = fanLeft + pos * PEEK;
      const zIndex = n + 10 - pos;

      // Depth: back cards are darker AND slightly smaller — makes them feel physical
      const brightness = isActive ? 1 : Math.max(0.7, 1 - pos * 0.1);
      const scale      = isActive ? 1 : Math.max(0.90, 1 - pos * 0.035);

      if (!animate) {
        el.style.transition = 'none';
      } else {
        el.style.transition = ''; // restore CSS bouncy transition
      }

      el.style.left = isMobile ? '50%' : '0';
      el.style.transformOrigin = isMobile ? 'top center' : 'top left';
      el.style.transform = isMobile
        ? `translateX(-50%) translateY(${pos * PEEK}px) scale(${scale})`
        : `translateX(${xPos}px) scale(${scale})`;
      el.style.zIndex  = zIndex;
      el.style.filter  = isActive ? '' : `brightness(${brightness})`;
      el.style.opacity = '1';
      // Store position/scale in CSS variables for the bounce keyframe animation
      el.style.setProperty('--card-x', `${xPos}px`);
      el.style.setProperty('--card-scale', scale);
    });

    // ── Add-slot: ALWAYS static — never animates position on card switch ──
    const addSlot = this.virtualCardsRack.querySelector('.add-debit-card-slot');
    if (addSlot) {
      const slotX = fanLeft + fanW + SLOT_GAP;
      // Store as CSS variable for the bounce keyframe to use
      addSlot.style.setProperty('--slot-x', `${slotX}px`);
      // Always instant — NO transition on the slot position, ever
      addSlot.style.transition = 'filter 200ms ease, box-shadow 200ms ease';
      addSlot.style.left = isMobile ? '50%' : '0';
      addSlot.style.transformOrigin = isMobile ? 'top center' : 'top left';
      addSlot.style.transform = isMobile
        ? `translateX(-50%) translateY(${n * PEEK}px)`
        : `translateX(${slotX}px)`;
      addSlot.style.zIndex = '1';
    }

    // ── Rack height: snug around the stacked cards ─────────────────────
    if (isMobile) {
      this.virtualCardsRack.style.height = `${CARD_H + Math.max(1, n - 1) * PEEK + 28}px`;
    } else {
      this.virtualCardsRack.style.height = `${CARD_H + 26}px`;
    }
  }

  renderRailBanks() {
    const banks = this.state.virtualBanks || [];
    const activeBankId = this.state.activeVirtualBankId || 'all';
    const currency = this.state.userProfile.currency || '₱';

    // Update "All Virtual Banks" item in side rail
    if (this.allBanksNavItem) {
      if (activeBankId === 'all') {
        this.allBanksNavItem.classList.add('active');
      } else {
        this.allBanksNavItem.classList.remove('active');
      }
    }

    if (this.navCountAll) {
      this.navCountAll.textContent = banks.length;
    }

    if (!this.railBanksList) return;

    // Dot color map for gradients
    const dotColors = {
      'gradient-obsidian': '#27272a',
      'gradient-platinum': '#71717a',
      'gradient-midnight': '#3b82f6',
      'gradient-emerald': '#10b981',
      'gradient-amethyst': '#8b5cf6',
      'gradient-sunset': '#f97316'
    };

    this.railBanksList.innerHTML = banks.map(bank => {
      const isActive = activeBankId === bank.id;
      const dotColor = dotColors[bank.gradient] || '#27272a';
      const balance = bank.balance || 0;

      return `
        <div class="nav-item ${isActive ? 'active' : ''}" data-bank-id="${bank.id}" role="button" tabindex="0" title="${isActive ? 'Click to show all cards' : `Filter by ${bank.name}`}">
          <div class="nav-item-content">
            <span style="width: 8px; height: 8px; border-radius: 50%; display: inline-block; background: ${dotColor}; flex-shrink: 0; box-shadow: 0 0 4px ${dotColor};"></span>
            <span class="nav-bank-title">${bank.name}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
            <span class="nav-counter mono-num">${currency}${balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            <button type="button" class="btn-rail-bank-menu" data-bank-id="${bank.id}" title="Manage ${bank.name}" aria-label="Manage Bank">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                <circle cx="5" cy="12" r="2.2"/>
                <circle cx="12" cy="12" r="2.2"/>
                <circle cx="19" cy="12" r="2.2"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  exportToCSV() {
    const txs = this.state.getFilteredTransactions();
    if (txs.length === 0) {
      alert('No transactions available in the current view to export.');
      return;
    }

    const headers = ['ID', 'Date', 'Description', 'Memo', 'Type', 'Amount', 'Currency', 'Category', 'Account', 'BankId', 'Classification', 'TaxDeductible', 'Client'];
    const rows = txs.map(t => [
      t.id,
      t.date,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.memo || '').replace(/"/g, '""')}"`,
      t.type,
      t.amount.toFixed(2),
      this.state.userProfile.currencyCode || 'PHP',
      `"${t.category}"`,
      `"${t.account}"`,
      `"${t.bankId || ''}"`,
      t.classification,
      t.taxDeductible ? 'YES' : 'NO',
      `"${t.client || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `workspace_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
