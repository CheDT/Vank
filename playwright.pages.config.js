import { defineConfig } from '@playwright/test';

const port = process.env.VANK_PAGES_TEST_PORT || '4347';
const base = process.env.VANK_BASE_PATH || '/Vank/';
const url = `http://127.0.0.1:${port}${base}`;

export default defineConfig({
  testDir: './tests/pages',
  workers: 1,
  reporter: 'list',
  use: { baseURL: url, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: `npm run build:pages && npm run preview -- --port ${port} --strictPort`,
    url,
    env: { VANK_BASE_PATH: base },
    reuseExistingServer: false
  }
});
