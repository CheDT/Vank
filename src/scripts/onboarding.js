import { PHILIPPINE_BANKS, getBankLogoSvg, detectBankBrand } from './bankLogos.js';

// CONVERSATIONAL MULTI-STEP ONBOARDING CONTROLLER (PESOS & MONOCHROME)

export class OnboardingWizard {
  constructor(state) {
    this.state = state;
    this.overlayEl = document.getElementById('onboarding-overlay');
    this.currentStep = 1;
    this.totalSteps = 5;

    this.formData = {
      name: '',
      workspaceMode: 'hybrid',
      currency: '₱',
      currencyCode: 'PHP',
      bankName: 'Maya Virtual Visa',
      bankBrand: 'maya',
      bankNetwork: 'visa',
      bankGradient: 'gradient-emerald',
      openingBalance: 0
    };

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.stepEls = [
      document.getElementById('step-1'),
      document.getElementById('step-2'),
      document.getElementById('step-3'),
      document.getElementById('step-4'),
      document.getElementById('step-5')
    ];

    this.progressFill = document.getElementById('onboarding-progress-fill');
    this.stepCounter = document.getElementById('onboarding-step-counter');
    this.btnBack = document.getElementById('btn-onboard-back');
    this.btnNext = document.getElementById('btn-onboard-next');
    this.btnSkip = document.getElementById('btn-onboard-skip');
    this.btnSkipFooter = document.getElementById('btn-onboard-skip-footer');
    this.btnClose = document.getElementById('btn-onboard-close');
    this.btnSsoLogin = document.getElementById('btn-sso-login');

    this.nameInput = document.getElementById('onboard-name-input');
    this.avatarPreview = document.getElementById('onboard-avatar-preview');

    // Step 4 Virtual Card elements
    this.bankNameInput = document.getElementById('onboard-bank-name-input');
    this.networkBtns = document.querySelectorAll('.onboard-network-btn');
    this.swatchBtns = document.querySelectorAll('.onboard-swatch-btn');
    this.brandBtns = document.querySelectorAll('.onboard-bank-brand-btn');
    this.cardPreview = document.getElementById('onboard-card-preview');
    this.cardPreviewName = document.getElementById('onboard-preview-bank-name');
    this.cardPreviewBadge = document.getElementById('onboard-preview-bank-badge');
    this.cardPreviewLogo = document.getElementById('onboard-preview-network-logo');
    this.cardPreviewBrandLogo = document.getElementById('onboard-preview-brand-logo');
    this.cardPreviewHolder = document.getElementById('onboard-preview-holder');
    this.cardPreviewBalance = document.getElementById('onboard-preview-balance');
  }

  bindEvents() {
    // Dynamic name input & avatar initials
    if (this.nameInput) {
      this.nameInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        this.formData.name = val;
        if (val) {
          const initials = val.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
          if (this.avatarPreview) this.avatarPreview.textContent = initials || '—';
          if (this.cardPreviewHolder) this.cardPreviewHolder.textContent = val.toUpperCase();
        } else {
          if (this.avatarPreview) this.avatarPreview.textContent = '—';
          if (this.cardPreviewHolder) this.cardPreviewHolder.textContent = 'USER';
        }
      });

      this.nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.nextStep();
        }
      });
    }

    // Step 2: Mode choice cards
    const modeCards = document.querySelectorAll('.mode-choice-card');
    modeCards.forEach(card => {
      card.addEventListener('click', () => {
        modeCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.formData.workspaceMode = card.dataset.mode;
        if (this.cardPreviewBadge) {
          this.cardPreviewBadge.textContent = card.dataset.mode === 'personal' ? 'PERS' : 'BIZ';
        }
        setTimeout(() => this.nextStep(), 150);
      });
    });

    // Step 3: Currency choice chips (₱ PHP default)
    const currencyChips = document.querySelectorAll('.currency-chip-btn');
    currencyChips.forEach(chip => {
      chip.addEventListener('click', () => {
        currencyChips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.formData.currency = chip.dataset.symbol;
        this.formData.currencyCode = chip.dataset.code;
        if (this.cardPreviewBalance) {
          this.cardPreviewBalance.textContent = `${this.formData.currency}0.00`;
        }
        setTimeout(() => this.nextStep(), 150);
      });
    });

    // Step 4: Virtual Bank Name & Debit Card
    if (this.bankNameInput) {
      this.bankNameInput.addEventListener('input', (e) => {
        delete this.bankNameInput.dataset.autoFilled;
        const val = e.target.value.trim();
        this.formData.bankName = val || 'Maya Virtual Visa';
        if (this.cardPreviewName) {
          this.cardPreviewName.textContent = val || 'Maya Virtual Visa';
        }
        // Auto detect brand
        const detected = detectBankBrand(val);
        if (detected !== 'generic' && detected !== this.formData.bankBrand) {
          this.setBrand(detected, false);
        }
      });

      this.bankNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.nextStep();
        }
      });
    }

    // Step 4: Brand selector buttons
    this.brandBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const brandId = btn.dataset.brand;
        this.setBrand(brandId, true);
      });
    });

    const bankSuggestions = document.querySelectorAll('.onboard-bank-suggestion');
    bankSuggestions.forEach(tag => {
      tag.addEventListener('click', () => {
        if (this.bankNameInput) {
          this.bankNameInput.value = tag.textContent.trim();
          this.formData.bankName = this.bankNameInput.value;
          if (this.cardPreviewName) {
            this.cardPreviewName.textContent = this.formData.bankName;
          }
          const detected = detectBankBrand(this.formData.bankName);
          this.setBrand(detected, false);
        }
      });
    });

    // Step 4: Network buttons (Visa vs Mastercard)
    this.networkBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.networkBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.formData.bankNetwork = btn.dataset.network;
        this.updateCardPreviewLogo();
      });
    });

    // Step 4: Gradient Swatches
    this.swatchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.swatchBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.formData.bankGradient = btn.dataset.gradient;
        this.updateCardPreviewGradient();
      });
    });

    // Step 5: Capital choice cards
    const balanceCards = document.querySelectorAll('.balance-choice-card');
    balanceCards.forEach(card => {
      card.addEventListener('click', () => {
        balanceCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.formData.openingBalance = parseFloat(card.dataset.amount) || 0;
        if (this.cardPreviewBalance) {
          const cur = this.formData.currency || '₱';
          this.cardPreviewBalance.textContent = `${cur}${this.formData.openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        }
      });
    });

    // Navigation buttons
    if (this.btnBack) {
      this.btnBack.addEventListener('click', () => this.prevStep());
    }

    if (this.btnNext) {
      this.btnNext.addEventListener('click', () => {
        if (this.currentStep === this.totalSteps) {
          this.completeOnboarding();
        } else {
          this.nextStep();
        }
      });
    }

    const handleSkip = () => this.skipOnboarding();
    if (this.btnSkip) this.btnSkip.addEventListener('click', handleSkip);
    if (this.btnSkipFooter) this.btnSkipFooter.addEventListener('click', handleSkip);
    if (this.btnClose) this.btnClose.addEventListener('click', handleSkip);

    // Escape key to dismiss if active
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlayEl && this.overlayEl.classList.contains('active')) {
        this.hide();
      }
    });

    // Enterprise SSO simulator
    if (this.btnSsoLogin) {
      this.btnSsoLogin.addEventListener('click', () => {
        this.formData.name = 'Vank User';
        this.formData.email = 'user@vank.app';
        if (this.nameInput) this.nameInput.value = 'Vank User';
        if (this.avatarPreview) this.avatarPreview.textContent = 'VU';
        this.nextStep();
      });
    }
  }

  setBrand(brandId, autoFillName = false) {
    this.formData.bankBrand = brandId;
    this.brandBtns.forEach(b => {
      if (b.dataset.brand === brandId) b.classList.add('selected');
      else b.classList.remove('selected');
    });

    this.updateCardPreviewBrandLogo();

    const bankInfo = PHILIPPINE_BANKS.find(b => b.id === brandId);
    if (bankInfo) {
      if (autoFillName && (!this.bankNameInput.value || this.bankNameInput.dataset.autoFilled)) {
        this.bankNameInput.value = bankInfo.presetName;
        this.bankNameInput.dataset.autoFilled = 'true';
        this.formData.bankName = bankInfo.presetName;
        if (this.cardPreviewName) this.cardPreviewName.textContent = bankInfo.presetName;
      }

      if (bankInfo.defaultNetwork) {
        this.formData.bankNetwork = bankInfo.defaultNetwork;
        this.networkBtns.forEach(b => {
          if (b.dataset.network === bankInfo.defaultNetwork) b.classList.add('selected');
          else b.classList.remove('selected');
        });
        this.updateCardPreviewLogo();
      }

      if (bankInfo.defaultGradient) {
        this.formData.bankGradient = bankInfo.defaultGradient;
        this.swatchBtns.forEach(b => {
          if (b.dataset.gradient === bankInfo.defaultGradient) b.classList.add('selected');
          else b.classList.remove('selected');
        });
        this.updateCardPreviewGradient();
      }
    }
  }

  updateCardPreviewBrandLogo() {
    if (!this.cardPreviewBrandLogo) return;
    this.cardPreviewBrandLogo.innerHTML = getBankLogoSvg(this.formData.bankBrand || 'maya');
  }

  updateCardPreviewLogo() {
    if (!this.cardPreviewLogo) return;
    if (this.formData.bankNetwork === 'mastercard') {
      this.cardPreviewLogo.innerHTML = `
        <svg class="mastercard-logo-svg" viewBox="0 0 36 24">
          <circle cx="13" cy="12" r="10" fill="#eb001b"/>
          <circle cx="23" cy="12" r="10" fill="#f79e1b" fill-opacity="0.8"/>
        </svg>
      `;
    } else {
      this.cardPreviewLogo.innerHTML = `
        <svg class="visa-logo-svg" viewBox="0 0 50 16">
          <path d="M19.5 1.5L13.1 15.5H8.7L5.3 4.2C5.1 3.4 4.9 3.1 4.3 2.7C3.3 2.1 1.5 1.6 0 1.3L0.1 0.7H7.1C8.0 0.7 8.8 1.3 9.0 2.3L10.7 11.2L15.1 0.7H19.5ZM37.1 10.7C37.1 6.6 31.4 6.4 31.5 4.6C31.5 4.0 32.1 3.4 33.3 3.3C33.9 3.2 35.6 3.1 37.3 3.9L38.0 0.8C37.0 0.4 35.8 0.1 34.2 0.1C30.0 0.1 27.0 2.4 27.0 5.6C26.9 8.0 29.1 9.3 30.7 10.1C32.4 10.9 32.9 11.4 32.9 12.1C32.9 13.2 31.6 13.7 30.3 13.7C28.2 13.7 27.0 13.1 26.0 12.6L25.2 15.8C26.3 16.3 28.3 16.7 30.2 16.7C34.6 16.7 37.1 14.5 37.1 10.7ZM47.8 15.5H51.7L48.3 0.7H44.7C43.9 0.7 43.2 1.2 42.9 1.9L36.7 15.5H41.1L42.0 13.0H47.3L47.8 15.5ZM43.2 9.8L45.4 3.7L46.7 9.8H43.2ZM26.2 0.7L22.8 15.5H18.7L22.1 0.7H26.2Z"/>
        </svg>
      `;
    }
  }

  updateCardPreviewGradient() {
    if (!this.cardPreview) return;
    const gradients = ['gradient-obsidian', 'gradient-platinum', 'gradient-midnight', 'gradient-emerald', 'gradient-amethyst', 'gradient-sunset'];
    gradients.forEach(g => this.cardPreview.classList.remove(g));
    this.cardPreview.classList.add(this.formData.bankGradient || 'gradient-obsidian');
  }

  show(forceStep = 1, startBlank = false) {
    this.currentStep = forceStep;
    this.direction = 'forward';

    if (startBlank) {
      this.formData = {
        name: '',
        workspaceMode: 'hybrid',
        currency: '₱',
        currencyCode: 'PHP',
        bankName: 'Maya Virtual Visa',
        bankBrand: 'maya',
        bankNetwork: 'visa',
        bankGradient: 'gradient-emerald',
        openingBalance: 0
      };
      if (this.nameInput) this.nameInput.value = '';
      if (this.avatarPreview) this.avatarPreview.textContent = '—';
      if (this.bankNameInput) {
        this.bankNameInput.value = 'Maya Virtual Visa';
        this.bankNameInput.dataset.autoFilled = 'true';
      }

      if (this.cardPreviewName) this.cardPreviewName.textContent = 'Maya Virtual Visa';
      if (this.cardPreviewHolder) this.cardPreviewHolder.textContent = 'USER';
      if (this.cardPreviewBalance) this.cardPreviewBalance.textContent = '₱0.00';

      this.setBrand('maya', false);

      this.updateCardPreviewLogo();
      this.updateCardPreviewGradient();
      this.updateCardPreviewBrandLogo();

      const balanceCards = document.querySelectorAll('.balance-choice-card');
      balanceCards.forEach(c => {
        if (c.dataset.amount === '0') c.classList.add('selected');
        else c.classList.remove('selected');
      });
    } else {
      if (this.nameInput && !this.nameInput.value && this.state.userProfile.name) {
        this.nameInput.value = this.state.userProfile.name;
        const initials = this.state.userProfile.name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
        if (this.avatarPreview) this.avatarPreview.textContent = initials || '—';
        if (this.cardPreviewHolder) this.cardPreviewHolder.textContent = this.state.userProfile.name.toUpperCase();
      }
      if (this.bankNameInput && !this.bankNameInput.value && this.state.virtualBanks && this.state.virtualBanks[0]) {
        this.bankNameInput.value = this.state.virtualBanks[0].name;
        if (this.cardPreviewName) this.cardPreviewName.textContent = this.state.virtualBanks[0].name;
      }
    }

    this.overlayEl.classList.remove('closing');
    this.overlayEl.classList.add('active');
    this.renderStep();
  }

  skipOnboarding() {
    if (!this.state.userProfile.onboardingComplete) {
      this.state.updateProfile({ onboardingComplete: true });
    }
    this.hide();
  }

  hide() {
    if (this.overlayEl.classList.contains('closing')) return;
    this.overlayEl.classList.add('closing');
    setTimeout(() => {
      this.overlayEl.classList.remove('active', 'closing');
    }, 250);
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.direction = 'forward';
      this.currentStep++;
      this.renderStep();
    } else {
      this.completeOnboarding();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.direction = 'backward';
      this.currentStep--;
      this.renderStep();
    }
  }

  renderStep() {
    const pct = (this.currentStep / this.totalSteps) * 100;
    if (this.progressFill) this.progressFill.style.width = `${pct}%`;
    if (this.stepCounter) this.stepCounter.textContent = `0${this.currentStep} / 0${this.totalSteps}`;

    const slideClass = this.direction === 'backward' ? 'slide-backward' : 'slide-forward';

    this.stepEls.forEach((el, idx) => {
      if (el) {
        el.classList.remove('slide-forward', 'slide-backward');
        if (idx + 1 === this.currentStep) {
          el.classList.add('active', slideClass);
        } else {
          el.classList.remove('active');
        }
      }
    });

    if (this.btnBack) {
      this.btnBack.style.visibility = this.currentStep === 1 ? 'hidden' : 'visible';
    }

    if (this.btnNext) {
      this.btnNext.textContent = this.currentStep === this.totalSteps ? 'Finish Setup ↵' : 'Next →';
    }

    if (this.currentStep === 1 && this.nameInput) {
      setTimeout(() => this.nameInput.focus(), 120);
    } else if (this.currentStep === 4 && this.bankNameInput) {
      setTimeout(() => this.bankNameInput.focus(), 120);
    }
  }

  completeOnboarding() {
    const rawName = this.nameInput ? this.nameInput.value.trim() : '';
    const rawBankName = this.bankNameInput ? this.bankNameInput.value.trim() : '';

    const name = rawName || this.formData.name || 'User';
    const bankName = rawBankName || this.formData.bankName || 'Primary Digital Debit';

    this.state.createNewProfile({
      name,
      email: this.formData.email || '',
      workspaceName: `${bankName} Ledger`,
      workspaceMode: this.formData.workspaceMode || 'hybrid',
      currency: this.formData.currency || '₱',
      currencyCode: this.formData.currencyCode || 'PHP',
      bankName: bankName,
      bankBrand: this.formData.bankBrand || detectBankBrand(bankName),
      bankNetwork: this.formData.bankNetwork || 'visa',
      bankGradient: this.formData.bankGradient || 'gradient-obsidian',
      openingBalance: this.formData.openingBalance || 0
    });

    this.hide();
  }
}
