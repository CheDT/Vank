import { registerSearchFeedbackTests } from '../helpers/searchFeedback.js';
import { STORAGE_KEY } from '../helpers/fixtures.js';

registerSearchFeedbackTests({
  startPath: './',
  browserOnly: true,
  seed: async ({ page }, state) => {
    await page.addInitScript(({ key, state }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
    }, { key: STORAGE_KEY, state });
  }
});
