import { expect } from '@playwright/test';
import { registerSearchFeedbackTests } from './helpers/searchFeedback.js';

registerSearchFeedbackTests({
  seed: async ({ request }, state) => {
    const response = await request.post('/api/state', { data: state });
    expect(response.ok()).toBe(true);
  }
});
