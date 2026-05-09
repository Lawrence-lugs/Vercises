import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e/specs',
  fullyParallel: false, // Docker stack can't handle many parallel sim requests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/smoke-real-exercises.spec.js'],
    },
    {
      name: 'smoke-real',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/smoke-real-exercises.spec.js'],
    },
  ],
});
