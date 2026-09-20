// ADD VIRTUAL BANK CONTROLLER (DEBIT CARD THEME & PHILIPPINE BANK LOGOS)

import { PHILIPPINE_BANKS, getBankLogoSvg, detectBankBrand } from './bankLogos.js';

export class BankModal {
  constructor(state) {
    this.state = state;
    this.modalEl = document.getElementById('add-bank-modal');
    this.formEl = document.getElementById('add-bank-form');

    if (!this.modalEl) return;

    // Form inputs
    this.nameInput = document.getElementById('new-bank-name');
    this.balanceInput = document.getElementById('new-bank-balance');
    this.networkBtns = this.modalEl.querySelectorAll('.bank-network-btn');
    this.classBtns = this.modalEl.querySelectorAll('.bank-class-btn');
    this.swatchBtns = this.modalEl.querySelectorAll('.bank-swatch-btn');
    this.brandBtns = this.modalEl.querySelectorAll('.modal-bank-brand-btn');

    // Dynamic modal controls (Edit / Create mode)
    this.modalTitle = document.getElementById('bank-modal-title');
    this.submitBtn = document.getElementById('bank-modal-submit-btn');
    this.deleteBtn = document.getElementById('btn-delete-bank-modal');
    this.balanceLabel = document.getElementById('bank-modal-balance-label');
    this.editingBankId = null;

    // Live preview elements
    this.previewCard = document.getElementById('new-card-preview');
    this.previewName = document.getElementById('preview-card-name');
    this.previewBadge = document.getElementById('preview-card-badge');
    this.previewBalance = document.getElementById('preview-card-balance');
    this.previewLogo = document.getElementById('preview-card-logo');
    this.previewBrandLogo = document.getElementById('modal-preview-brand-logo');

    this.currentData = {
      name: '',
      brand: 'maya',
      network: 'visa',
      classification: 'business',
      gradient: 'gradient-emerald',
      initialBalance: 0
    };

    this.bindEvents();
  }

  bindEvents() {
    // Delete Card button (Available in Edit Mode)
    if (this.deleteBtn) {
      this.deleteBtn.addEventListener('click', () => {
        if (!this.editingBankId) return;
        const bank = (this.state.virtualBanks || []).find(b => b.id === this.editingBankId);
        if (!bank) return;

        if (this.state.virtualBanks.length <= 1) {
          alert('You must keep at least 1 Virtual Bank.');
          return;
        }

        if (confirm(`Remove "${bank.name}"? Transactions linked to this card will be safely preserved as unassigned.`)) {
          const removed = this.state.deleteVirtualBank(this.editingBankId);
          if (removed) {
            this.close();
          }
        }
      });
    }
    // Name input live reflection & auto brand detection
    if (this.nameInput) {
      this.nameInput.addEventListener('input', (e) => {
        delete this.nameInput.dataset.autoFilled;
        const val = e.target.value.trim();
        this.currentData.name = val;
        if (this.previewName) {
          this.previewName.textContent = val || 'Virtual Card';
        }
        // Auto-detect brand from name if user types
        const detected = detectBankBrand(val);
        if (detected !== 'generic' && detected !== this.currentData.brand) {
          this.setBrand(detected);
        }
      });
    }

    // Brand selector buttons
    this.brandBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const brandId = btn.dataset.brand;
        this.setBrand(brandId, true);
      });
    });

    // Balance input live reflection
    if (this.balanceInput) {
      this.balanceInput.addEventListener('input', (e) => {
        const amt = parseFloat(e.target.value) || 0;
        this.currentData.initialBalance = amt;
        const cur = this.state.userProfile.currency || '₱';
        if (this.previewBalance) {
          this.previewBalance.textContent = `${cur}${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        }
      });
    }

    // Network selector (Visa vs Mastercard)
    this.networkBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.networkBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.currentData.network = btn.dataset.network;
        this.updatePreviewLogo();
      });
    });

    // Classification selector (Business vs Personal)
    this.classBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.classBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.currentData.classification = btn.dataset.classification;
        if (this.previewBadge) {
          this.previewBadge.textContent = this.currentData.classification === 'business' ? 'BIZ' : 'PERS';
        }
      });
    });

    // Gradient swatches
    this.swatchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.swatchBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.currentData.gradient = btn.dataset.gradient;
        this.updatePreviewGradient();
      });
    });

    // Close buttons
    const closeTriggers = this.modalEl.querySelectorAll('.bank-modal-close-trigger');
    closeTriggers.forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    // Form submit
    if (this.formEl) {
      this.formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalEl.classList.contains('active')) {
        this.close();
      }
    });
  }

  setBrand(brandId, autoFillName = false) {
    this.currentData.brand = brandId;
    this.brandBtns.forEach(b => {
      if (b.dataset.brand === brandId) b.classList.add('selected');
      else b.classList.remove('selected');
    });

    this.updatePreviewBrandLogo();

    const bankInfo = PHILIPPINE_BANKS.find(b => b.id === brandId);
    if (bankInfo) {
      if (autoFillName && (!this.nameInput.value || this.nameInput.dataset.autoFilled)) {
        this.nameInput.value = bankInfo.presetName;
        this.nameInput.dataset.autoFilled = 'true';
        this.currentData.name = bankInfo.presetName;
        if (this.previewName) this.previewName.textContent = bankInfo.presetName;
      }

      // Sync recommended network
      if (bankInfo.defaultNetwork) {
        this.currentData.network = bankInfo.defaultNetwork;
        this.networkBtns.forEach(b => {
          if (b.dataset.network === bankInfo.defaultNetwork) b.classList.add('selected');
          else b.classList.remove('selected');
        });
        this.updatePreviewLogo();
      }

      // Sync recommended gradient
      if (bankInfo.defaultGradient) {
        this.currentData.gradient = bankInfo.defaultGradient;
        this.swatchBtns.forEach(b => {
          if (b.dataset.gradient === bankInfo.defaultGradient) b.classList.add('selected');
          else b.classList.remove('selected');
        });
        this.updatePreviewGradient();
      }
    }
  }

  updatePreviewBrandLogo() {
    if (!this.previewBrandLogo) return;
    this.previewBrandLogo.innerHTML = getBankLogoSvg(this.currentData.brand);
  }

  updatePreviewLogo() {
    if (!this.previewLogo) return;
    if (this.currentData.network === 'mastercard') {
      this.previewLogo.innerHTML = `
        <svg class="mastercard-logo-svg" viewBox="0 0 36 24">
          <circle cx="13" cy="12" r="10" fill="#eb001b"/>
          <circle cx="23" cy="12" r="10" fill="#f79e1b" fill-opacity="0.8"/>
        </svg>
      `;
    } else {
      this.previewLogo.innerHTML = `
        <svg class="visa-logo-svg" viewBox="0 0 50 16">
          <path d="M19.5 1.5L13.1 15.5H8.7L5.3 4.2C5.1 3.4 4.9 3.1 4.3 2.7C3.3 2.1 1.5 1.6 0 1.3L0.1 0.7H7.1C8.0 0.7 8.8 1.3 9.0 2.3L10.7 11.2L15.1 0.7H19.5ZM37.1 10.7C37.1 6.6 31.4 6.4 31.5 4.6C31.5 4.0 32.1 3.4 33.3 3.3C33.9 3.2 35.6 3.1 37.3 3.9L38.0 0.8C37.0 0.4 35.8 0.1 34.2 0.1C30.0 0.1 27.0 2.4 27.0 5.6C26.9 8.0 29.1 9.3 30.7 10.1C32.4 10.9 32.9 11.4 32.9 12.1C32.9 13.2 31.6 13.7 30.3 13.7C28.2 13.7 27.0 13.1 26.0 12.6L25.2 15.8C26.3 16.3 28.3 16.7 30.2 16.7C34.6 16.7 37.1 14.5 37.1 10.7ZM47.8 15.5H51.7L48.3 0.7H44.7C43.9 0.7 43.2 1.2 42.9 1.9L36.7 15.5H41.1L42.0 13.0H47.3L47.8 15.5ZM43.2 9.8L45.4 3.7L46.7 9.8H43.2ZM26.2 0.7L22.8 15.5H18.7L22.1 0.7H26.2Z"/>
        </svg>
      `;
    }
  }

  updatePreviewGradient() {
    if (!this.previewCard) return;
    const gradients = ['gradient-obsidian', 'gradient-platinum', 'gradient-midnight', 'gradient-emerald', 'gradient-amethyst', 'gradient-sunset'];
    gradients.forEach(g => this.previewCard.classList.remove(g));
    this.previewCard.classList.add(this.currentData.gradient);
  }

  open(bankId = null) {
    this.editingBankId = bankId;
    const cur = this.state.userProfile.currency || '₱';

    if (bankId) {
      const bank = (this.state.virtualBanks || []).find(b => b.id === bankId);
      if (!bank) return;

      if (this.modalTitle) this.modalTitle.textContent = 'Manage Virtual Card';
      if (this.submitBtn) this.submitBtn.textContent = 'Save Changes ↵';
      if (this.balanceLabel) this.balanceLabel.textContent = 'Card Balance / Starting Value (₱ PHP)';
      if (this.deleteBtn) this.deleteBtn.style.display = 'inline-flex';

      const initialBal = bank.initialBalance !== undefined ? bank.initialBalance : (bank.balance || 0);

      this.currentData = {
        name: bank.name,
        brand: bank.brand || detectBankBrand(bank.name),
        network: bank.network || 'visa',
        classification: bank.classification || 'business',
        gradient: bank.gradient || 'gradient-obsidian',
        initialBalance: initialBal
      };

      if (this.nameInput) {
        this.nameInput.value = bank.name;
        delete this.nameInput.dataset.autoFilled;
      }
      if (this.balanceInput) {
        // Show the live balance in edit mode so the user sees the real current number
        const displayBal = typeof bank.balance === 'number' ? bank.balance : initialBal;
        this.balanceInput.value = displayBal;
        this.currentData.initialBalance = displayBal;
      }

      this.setBrand(this.currentData.brand, false);

      this.networkBtns.forEach(b => {
        if (b.dataset.network === this.currentData.network) b.classList.add('selected');
        else b.classList.remove('selected');
      });

      this.classBtns.forEach(b => {
        if (b.dataset.classification === this.currentData.classification) b.classList.add('selected');
        else b.classList.remove('selected');
      });

      this.swatchBtns.forEach(b => {
        if (b.dataset.gradient === this.currentData.gradient) b.classList.add('selected');
        else b.classList.remove('selected');
      });

      if (this.previewName) this.previewName.textContent = bank.name;
      if (this.previewBadge) this.previewBadge.textContent = this.currentData.classification === 'business' ? 'BIZ' : 'PERS';
      if (this.previewBalance) {
        const liveBal = typeof bank.balance === 'number' ? bank.balance : initialBal;
        this.previewBalance.textContent = `${cur}${liveBal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      }

      this.updatePreviewLogo();
      this.updatePreviewGradient();
      this.updatePreviewBrandLogo();
    } else {
      if (this.modalTitle) this.modalTitle.textContent = 'New Virtual Bank Card';
      if (this.submitBtn) this.submitBtn.textContent = 'Create Virtual Card ↵';
      if (this.balanceLabel) this.balanceLabel.textContent = 'Initial Balance (₱ PHP)';
      if (this.deleteBtn) this.deleteBtn.style.display = 'none';

      this.currentData = {
        name: 'Maya Virtual Visa',
        brand: 'maya',
        network: 'visa',
        classification: 'business',
        gradient: 'gradient-emerald',
        initialBalance: 0
      };

      if (this.nameInput) {
        this.nameInput.value = 'Maya Virtual Visa';
        this.nameInput.dataset.autoFilled = 'true';
      }
      if (this.balanceInput) this.balanceInput.value = '';

      this.setBrand('maya', false);

      this.classBtns.forEach(b => {
        if (b.dataset.classification === 'business') b.classList.add('selected');
        else b.classList.remove('selected');
      });

      if (this.previewName) this.previewName.textContent = 'Maya Virtual Visa';
      if (this.previewBadge) this.previewBadge.textContent = 'BIZ';
      if (this.previewBalance) this.previewBalance.textContent = `${cur}0.00`;

      this.updatePreviewLogo();
      this.updatePreviewGradient();
      this.updatePreviewBrandLogo();
    }

    this.modalEl.classList.add('active');
    setTimeout(() => {
      if (this.nameInput) this.nameInput.focus();
    }, 100);
  }

  close() {
    this.modalEl.classList.remove('active');
    this.editingBankId = null;
  }

  handleSubmit() {
    const name = this.nameInput ? this.nameInput.value.trim() : '';
    if (!name) {
      alert('Please enter a Bank / Card nickname.');
      if (this.nameInput) this.nameInput.focus();
      return;
    }

    const payload = {
      name: name,
      brand: this.currentData.brand || detectBankBrand(name),
      network: this.currentData.network,
      classification: this.currentData.classification,
      gradient: this.currentData.gradient,
      initialBalance: this.currentData.initialBalance
    };

    if (this.editingBankId) {
      this.state.updateVirtualBank(this.editingBankId, payload);
    } else {
      const newBank = this.state.addVirtualBank(payload);
      // Automatically select the new bank
      this.state.setActiveVirtualBank(newBank.id);
    }

    this.close();
  }
}
