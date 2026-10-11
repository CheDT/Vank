export async function saveWithFeedback(state, button, change) {
  if (button.disabled) return false;
  const content = button.innerHTML;
  const minWidth = button.style.minWidth;
  button.style.minWidth = `${button.getBoundingClientRect().width}px`;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.innerHTML = '<span class="button-spinner" aria-hidden="true"></span><span>Saving…</span>';
  try {
    change();
    await state.pendingSave;
    return true;
  } finally {
    button.innerHTML = content;
    button.style.minWidth = minWidth;
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}

export class WorkspaceFeedback {
  constructor(state) {
    this.state = state;
    this.app = document.querySelector('.app-container');
    this.viewport = document.querySelector('.workspace-viewport');
    this.status = document.getElementById('app-status');
    this.statusText = document.getElementById('app-status-text');
    this.retry = document.getElementById('retry-sync');
    this.progress = document.getElementById('workspace-progress');
    this.feedback = document.getElementById('save-feedback');
    this.feedbackText = document.getElementById('save-feedback-text');
    this.feedbackRetry = document.getElementById('save-feedback-retry');
    this.lastSaveStatus = 'idle';
    [this.retry, this.feedbackRetry].forEach(button => {
      button.addEventListener('click', () => this.state.retrySync());
    });
    window.addEventListener('online', () => {
      if (state.connectionStatus === 'offline') state.retrySync();
    });
    state.subscribe(() => this.update());
    this.update();
  }

  update() {
    const { state } = this;
    const fetching = state.dataStatus !== 'ready';
    const loading = !state.hasLoadedData;
    this.app.classList.toggle('is-loading-data', loading);
    this.viewport.setAttribute('aria-busy', String(loading));
    this.progress.hidden = !fetching;
    this.progress.setAttribute('aria-label', loading ? 'Loading workspace' : 'Refreshing workspace');
    document.querySelectorAll('.open-add-modal-btn, .open-add-bank-trigger, #user-avatar-btn, #mobile-dock-menu-btn').forEach(button => {
      button.disabled = loading;
    });

    const offline = state.connectionStatus === 'offline';
    this.status.hidden = !fetching && !offline;
    this.retry.hidden = !offline || fetching;
    this.retry.disabled = state.saveStatus === 'saving';
    this.statusText.textContent = fetching
      ? (loading ? 'Loading workspace…' : 'Refreshing workspace…')
      : state.saveStatus === 'error'
        ? 'Couldn’t save. Keep this tab open and retry.'
        : 'Can’t reach the local server. Working from browser data.';

    if (state.saveStatus === this.lastSaveStatus) return;
    this.lastSaveStatus = state.saveStatus;
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
    this.feedback.hidden = true;
    this.feedbackRetry.hidden = true;
    this.feedback.classList.toggle('is-saving', state.saveStatus === 'saving');
    if (state.saveStatus === 'idle') return;

    if (state.saveStatus === 'saving') {
      this.showTimer = setTimeout(() => {
        if (state.saveStatus !== 'saving') return;
        this.feedbackText.textContent = 'Saving…';
        this.feedback.hidden = false;
      }, 150);
      return;
    }
    this.feedbackText.textContent = {
      saved: 'Saved',
      local: 'Saved on this device',
      error: 'Couldn’t save'
    }[state.saveStatus];
    this.feedbackRetry.hidden = state.saveStatus === 'saved';
    this.feedback.hidden = false;
    if (state.saveStatus === 'saved') {
      this.hideTimer = setTimeout(() => { this.feedback.hidden = true; }, 2500);
    }
  }
}
