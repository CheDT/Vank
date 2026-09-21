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
      bankName: 'Maya',
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
    this.btnGoogleLogin = document.getElementById('btn-google-login');

    // SSO & Social Auth Modals
    this.googleModal = document.getElementById('google-sso-modal');
    this.enterpriseModal = document.getElementById('enterprise-sso-modal');
    this.enterpriseForm = document.getElementById('enterprise-sso-form');
    this.ssoEmailInput = document.getElementById('sso-email-input');
    this.ssoProviderSelect = document.getElementById('sso-provider-select');
    this.googleAccPrimary = document.getElementById('google-acc-primary');
    this.googleAccSecondary = document.getElementById('google-acc-secondary');
    this.googleAccCustom = document.getElementById('google-acc-custom');
    this.googleAccName1 = document.getElementById('google-acc-name-1');
    this.googleAccEmail1 = document.getElementById('google-acc-email-1');
    this.googleAccAvatar1 = document.getElementById('google-acc-avatar-1');
    this.googleCloseBtns = document.querySelectorAll('.google-modal-close');
    this.ssoCloseBtns = document.querySelectorAll('.sso-modal-close');

    this.nameInput = document.getElementById('onboard-name-input');
    this.avatarPreview = document.getElementById('onboard-avatar-preview');

    // Step 4 Virtual Card elements
    this.cardHolderInput = document.getElementById('onboard-card-holder-input');
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

  updateCardHolderPreview() {
    const val = (this.cardHolderInput ? this.cardHolderInput.value.trim() : '') || (this.nameInput ? this.nameInput.value.trim() : '') || this.formData.name || (this.state.userProfile ? this.state.userProfile.name : '') || '';
    if (this.cardPreviewHolder) {
      this.cardPreviewHolder.textContent = (val || 'USER').toUpperCase();
    }
    if (this.cardHolderInput && !this.cardHolderInput.matches(':focus')) {
      this.cardHolderInput.value = val;
    }
    if (this.nameInput && !this.nameInput.matches(':focus') && val) {
      this.nameInput.value = val;
    }
    if (this.avatarPreview) {
      const initials = val.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
      this.avatarPreview.textContent = initials || '—';
    }
  }

  bindEvents() {
    // Dynamic name input & avatar initials
    if (this.nameInput) {
      const handleNameInput = (e) => {
        const val = e.target.value.trim();
        this.formData.name = val;
        this.updateCardHolderPreview();
      };

      this.nameInput.addEventListener('input', handleNameInput);
      this.nameInput.addEventListener('change', handleNameInput);

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

    // Step 4: Cardholder Name Live Reflection
    if (this.cardHolderInput) {
      const handleHolderInput = (e) => {
        const val = e.target.value;
        this.formData.name = val.trim();
        if (this.nameInput && !this.nameInput.matches(':focus')) {
          this.nameInput.value = val;
        }
        this.updateCardHolderPreview();
      };

      this.cardHolderInput.addEventListener('input', handleHolderInput);
      this.cardHolderInput.addEventListener('change', handleHolderInput);
      this.cardHolderInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.nextStep();
        }
      });
    }

    // Step 4: Brand selector buttons (automatically sets card nickname to company name)
    this.brandBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const brandId = btn.dataset.brand;
        this.setBrand(brandId, true);
      });
    });

    const bankSuggestions = document.querySelectorAll('.onboard-bank-suggestion');
    bankSuggestions.forEach(tag => {
      tag.addEventListener('click', () => {
        const brandId = tag.dataset.brand || detectBankBrand(tag.textContent.trim());
        this.setBrand(brandId, true);
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

    // Escape key to dismiss modals first, or setup if active
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.googleModal && this.googleModal.classList.contains('active')) {
          this.closeAuthModals();
          return;
        }
        if (this.enterpriseModal && this.enterpriseModal.classList.contains('active')) {
          this.closeAuthModals();
          return;
        }
        if (this.overlayEl && this.overlayEl.classList.contains('active')) {
          this.hide();
        }
      }
    });

    // Google Sign-In with Official Modal Chooser
    if (this.btnGoogleLogin) {
      this.btnGoogleLogin.addEventListener('click', (e) => {
        e.preventDefault();
        this.openGoogleModal();
      });
    }

    if (this.googleAccPrimary) {
      this.googleAccPrimary.addEventListener('click', () => {
        const name = (this.googleAccName1 ? this.googleAccName1.textContent.trim() : '') || 'Neon Felix Cruz';
        const email = (this.googleAccEmail1 ? this.googleAccEmail1.textContent.trim() : '') || 'neonfelix.cruz@gmail.com';
        this.applyAuthentication(name, email, 'personal');
      });
    }

    if (this.googleAccSecondary) {
      this.googleAccSecondary.addEventListener('click', () => {
        this.applyAuthentication('Felix Vance', 'felix@apexstudio.ph', 'hybrid');
      });
    }

    if (this.googleAccCustom) {
      this.googleAccCustom.addEventListener('click', () => {
        const inputName = prompt('Enter your name for Google Account:', 'Alex Vance');
        if (inputName && inputName.trim()) {
          const cleanName = inputName.trim();
          const cleanEmail = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.')}@gmail.com`;
          this.applyAuthentication(cleanName, cleanEmail, 'personal');
        }
      });
    }

    // Enterprise SSO Modal & Form Flow
    if (this.btnSsoLogin) {
      this.btnSsoLogin.addEventListener('click', (e) => {
        e.preventDefault();
        this.openEnterpriseModal();
      });
    }

    if (this.enterpriseForm) {
      this.enterpriseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = (this.ssoEmailInput ? this.ssoEmailInput.value.trim() : '') || 'user@company.com';
        const currentName = (this.nameInput ? this.nameInput.value.trim() : '');
        let name = currentName;
        if (!name) {
          const localPart = email.split('@')[0] || 'User';
          name = localPart.split(/[._-]/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Enterprise User';
        }
        this.applyAuthentication(name, email, 'business');
      });
    }

    // Modal Close Buttons & Backdrop Clicks
    if (this.googleCloseBtns) {
      this.googleCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => this.closeAuthModals());
      });
    }
    if (this.ssoCloseBtns) {
      this.ssoCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => this.closeAuthModals());
      });
    }

    if (this.googleModal) {
      this.googleModal.addEventListener('click', (e) => {
        if (e.target === this.googleModal) this.closeAuthModals();
      });
    }
    if (this.enterpriseModal) {
      this.enterpriseModal.addEventListener('click', (e) => {
        if (e.target === this.enterpriseModal) this.closeAuthModals();
      });
    }
  }

  applyAuthentication(name, email, workspaceMode = 'hybrid') {
    if (name) {
      this.formData.name = name;
      if (this.nameInput) this.nameInput.value = name;
    }
    if (email) {
      this.formData.email = email;
    }
    if (workspaceMode) {
      this.formData.workspaceMode = workspaceMode;
      const modeCards = document.querySelectorAll('.mode-choice-card');
      modeCards.forEach(c => {
        if (c.dataset.mode === workspaceMode) c.classList.add('selected');
        else c.classList.remove('selected');
      });
      if (this.cardPreviewBadge) {
        this.cardPreviewBadge.textContent = workspaceMode === 'personal' ? 'PERS' : 'BIZ';
      }
    }

    this.updateCardHolderPreview();
    this.closeAuthModals();
    this.nextStep();
  }

  openGoogleModal() {
    const currentName = (this.nameInput ? this.nameInput.value.trim() : '') || 'Neon Felix Cruz';
    const emailPrefix = currentName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.');
    const primaryEmail = `${emailPrefix || 'user'}@gmail.com`;

    if (this.googleAccName1) this.googleAccName1.textContent = currentName;
    if (this.googleAccEmail1) this.googleAccEmail1.textContent = primaryEmail;
    if (this.googleAccAvatar1) {
      const initials = currentName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'NF';
      this.googleAccAvatar1.textContent = initials;
    }

    if (this.googleModal) {
      this.googleModal.classList.add('active');
    }
  }

  openEnterpriseModal() {
    if (this.ssoEmailInput) {
      const currentName = (this.nameInput ? this.nameInput.value.trim() : '');
      if (currentName) {
        const handle = currentName.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '');
        this.ssoEmailInput.value = `${handle || 'user'}@acmestudios.com`;
      } else if (!this.ssoEmailInput.value) {
        this.ssoEmailInput.value = 'neon@apexgroup.ph';
      }
    }

    if (this.enterpriseModal) {
      this.enterpriseModal.classList.add('active');
      if (this.ssoEmailInput) {
        setTimeout(() => this.ssoEmailInput.focus(), 100);
      }
    }
  }

  closeAuthModals() {
    if (this.googleModal) this.googleModal.classList.remove('active');
    if (this.enterpriseModal) this.enterpriseModal.classList.remove('active');
  }

  setBrand(brandId, autoFillName = true) {
    this.formData.bankBrand = brandId;
    this.brandBtns.forEach(b => {
      if (b.dataset.brand === brandId) b.classList.add('selected');
      else b.classList.remove('selected');
    });

    this.updateCardPreviewBrandLogo();

    const bankInfo = PHILIPPINE_BANKS.find(b => b.id === brandId);
    if (bankInfo) {
      // Automatically set card nickname to company name!
      const companyName = bankInfo.name || bankInfo.presetName;
      this.formData.bankName = companyName;
      if (this.cardPreviewName) this.cardPreviewName.textContent = companyName;
      if (this.bankNameInput) this.bankNameInput.value = companyName;

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
        bankName: 'Maya',
        bankBrand: 'maya',
        bankNetwork: 'visa',
        bankGradient: 'gradient-emerald',
        openingBalance: 0
      };
      if (this.nameInput) this.nameInput.value = '';
      if (this.cardHolderInput) this.cardHolderInput.value = '';
      if (this.bankNameInput) {
        this.bankNameInput.value = 'Maya';
        this.bankNameInput.dataset.autoFilled = 'true';
      }

      if (this.cardPreviewName) this.cardPreviewName.textContent = 'Maya';
      if (this.cardPreviewBalance) this.cardPreviewBalance.textContent = '₱0.00';

      this.setBrand('maya', true);

      this.updateCardPreviewLogo();
      this.updateCardPreviewGradient();
      this.updateCardPreviewBrandLogo();
      this.updateCardHolderPreview();

      const balanceCards = document.querySelectorAll('.balance-choice-card');
      balanceCards.forEach(c => {
        if (c.dataset.amount === '0') c.classList.add('selected');
        else c.classList.remove('selected');
      });
    } else {
      const existingName = (this.cardHolderInput && this.cardHolderInput.value.trim()) || (this.nameInput && this.nameInput.value.trim()) || (this.state.userProfile ? this.state.userProfile.name : '') || '';
      if (this.nameInput && existingName) {
        this.nameInput.value = existingName;
      }
      if (this.cardHolderInput && existingName) {
        this.cardHolderInput.value = existingName;
      }
      if (existingName) {
        this.formData.name = existingName;
      }
      this.updateCardHolderPreview();

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

    this.updateCardHolderPreview();

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
    } else if (this.currentStep === 4 && this.cardHolderInput) {
      setTimeout(() => this.cardHolderInput.focus(), 120);
    }
  }

  completeOnboarding() {
    const rawName = (this.cardHolderInput ? this.cardHolderInput.value.trim() : '') || (this.nameInput ? this.nameInput.value.trim() : '');
    const name = rawName || this.formData.name || 'User';
    const bankName = this.formData.bankName || 'Maya';

    this.state.createNewProfile({
      name,
      cardHolder: name,
      email: this.formData.email || '',
      workspaceName: `${bankName} Ledger`,
      workspaceMode: this.formData.workspaceMode || 'hybrid',
      currency: this.formData.currency || '₱',
      currencyCode: this.formData.currencyCode || 'PHP',
      bankName: bankName,
      bankBrand: this.formData.bankBrand || detectBankBrand(bankName),
      bankNetwork: this.formData.bankNetwork || 'visa',
      bankGradient: this.formData.bankGradient || 'gradient-emerald',
      openingBalance: this.formData.openingBalance || 0
    });

    this.hide();
  }
}
