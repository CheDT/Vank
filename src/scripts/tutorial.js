// NEW USER TUTORIAL & INTERACTIVE FEATURE GUIDE (TEXT LINE ANIMATION)

export class TutorialGuide {
  constructor(state, txModal, bankModal, budgetModal) {
    this.state = state;
    this.txModal = txModal;
    this.bankModal = bankModal;
    this.budgetModal = budgetModal;

    this.bannerEl = document.getElementById('tutorial-banner');
    if (!this.bannerEl) return;

    this.topicEl = document.getElementById('tutorial-topic');
    this.lineEl = document.getElementById('tutorial-text-line');
    this.counterEl = document.getElementById('tutorial-counter');
    this.btnPrev = document.getElementById('btn-tutorial-prev');
    this.btnNext = document.getElementById('btn-tutorial-next');
    this.btnAction = document.getElementById('tutorial-action-btn');
    this.btnDismiss = document.getElementById('btn-tutorial-dismiss');

    this.currentIndex = 0;
    this.typewriterTimer = null;
    this.autoAdvanceTimer = null;
    this.isPaused = false;

    this.tips = [
      {
        topic: 'Virtual Banks',
        text: 'Click any debit card above to isolate bank activity, or tap + Bank to add Visa/Mastercard.',
        actionLabel: '+ Bank',
        action: () => this.bankModal && this.bankModal.open()
      },
      {
        topic: 'Quick Entry',
        text: 'Press N anywhere or click + Entry to record income, expenses, or business write-offs.',
        actionLabel: '+ Entry',
        action: () => this.txModal && this.txModal.open()
      },
      {
        topic: 'Monthly Budgets',
        text: 'Set category spending caps to track limits and prevent overspending.',
        actionLabel: '+ Budget',
        action: () => this.budgetModal && this.budgetModal.open()
      },
      {
        topic: 'Smart Filters',
        text: 'Toggle Biz / Pers to separate tax-deductible expenses from personal living.',
        actionLabel: 'Biz Filter',
        action: () => this.state.setFilter({ classification: 'business', type: 'all' })
      },
      {
        topic: 'Instant Search',
        text: 'Press / on your keyboard to instantly search descriptions, memos, and categories.',
        actionLabel: 'Search',
        action: () => {
          const input = document.getElementById('global-search-input');
          if (input) input.focus();
        }
      }
    ];

    this.bindEvents();
    this.init();
  }

  init() {
    const isDismissed = this.state.userProfile.tutorialDismissed;
    if (isDismissed) {
      this.bannerEl.classList.add('hidden');
    } else {
      this.bannerEl.classList.remove('hidden');
      this.renderTip(0);
    }
  }

  bindEvents() {
    if (this.btnPrev) {
      this.btnPrev.addEventListener('click', () => this.prevTip());
    }

    if (this.btnNext) {
      this.btnNext.addEventListener('click', () => this.nextTip());
    }

    if (this.btnAction) {
      this.btnAction.addEventListener('click', () => {
        const cur = this.tips[this.currentIndex];
        if (cur && typeof cur.action === 'function') {
          cur.action();
        }
      });
    }

    if (this.btnDismiss) {
      this.btnDismiss.addEventListener('click', () => this.dismiss());
    }

    // Pause auto-advance on mouse hover
    this.bannerEl.addEventListener('mouseenter', () => {
      this.isPaused = true;
      clearTimeout(this.autoAdvanceTimer);
    });

    this.bannerEl.addEventListener('mouseleave', () => {
      this.isPaused = false;
      this.scheduleNext();
    });
  }

  renderTip(index) {
    this.currentIndex = (index + this.tips.length) % this.tips.length;
    const tip = this.tips[this.currentIndex];

    if (this.counterEl) {
      this.counterEl.textContent = `${this.currentIndex + 1}/${this.tips.length}`;
    }

    if (this.topicEl) {
      this.topicEl.textContent = `${tip.topic}:`;
    }

    if (this.btnAction) {
      this.btnAction.textContent = tip.actionLabel;
    }

    // Typewriter text line animation
    this.typewrite(tip.text);
  }

  typewrite(fullText) {
    clearInterval(this.typewriterTimer);
    clearTimeout(this.autoAdvanceTimer);

    if (!this.lineEl) return;
    this.lineEl.textContent = '';

    let charIdx = 0;
    const speed = 18; // ms per char for crisp energetic feel

    this.typewriterTimer = setInterval(() => {
      if (charIdx < fullText.length) {
        this.lineEl.textContent += fullText.charAt(charIdx);
        charIdx++;
      } else {
        clearInterval(this.typewriterTimer);
        this.scheduleNext();
      }
    }, speed);
  }

  scheduleNext() {
    clearTimeout(this.autoAdvanceTimer);
    if (this.isPaused) return;

    this.autoAdvanceTimer = setTimeout(() => {
      if (!this.isPaused) {
        this.nextTip();
      }
    }, 5500);
  }

  nextTip() {
    this.renderTip(this.currentIndex + 1);
  }

  prevTip() {
    this.renderTip(this.currentIndex - 1);
  }

  dismiss() {
    clearInterval(this.typewriterTimer);
    clearTimeout(this.autoAdvanceTimer);
    this.bannerEl.classList.add('hidden');
    this.state.updateProfile({ tutorialDismissed: true });
  }

  show() {
    this.bannerEl.classList.remove('hidden');
    this.state.updateProfile({ tutorialDismissed: false });
    this.renderTip(0);
    this.bannerEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
