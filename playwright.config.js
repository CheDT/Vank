import { defineConfig } from '@playwright/test';
import path from 'node:path';

const frontendPort = process.env.VANK_TEST_FRONTEND_PORT || '4317';
const backendPort = process.env.VANK_TEST_BACKEND_PORT || '4318';
const frontendUrl = `http://127.0.0.1:${frontendPort}`;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 30_000,
  reporter: 'list',
  // The real API uses one test database, so each test gets exclusive access.
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: frontendUrl,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: [
    {
      command: 'npm run server',
      url: `http://127.0.0.1:${backendPort}/api/state`,
      env: { PORT: backendPort, VANK_DB_FILE: path.resolve('test-results/backend/db.json') },
      reuseExistingServer: false
    },
    {
      command: `npm run dev -- --port ${frontendPort}`,
      url: frontendUrl,
      env: { PORT: backendPort, VITE_API_BASE_URL: '/api' },
      reuseExistingServer: false
    }
  ]
});
