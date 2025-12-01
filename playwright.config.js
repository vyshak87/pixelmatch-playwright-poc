import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './src/tests',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './src/utils/clean-before-run.js'
});
