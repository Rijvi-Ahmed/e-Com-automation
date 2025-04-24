// @ts-nocheck
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load the correct env file based on ENV value
dotenv.config({
  path: `./env/.env.${process.env.ENV}`,
});

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4, // Use 1 worker on CI, 4 locally
  reporter: 'html',

  use: {
    trace: 'on-first-retry',
    viewport: { width: 1536, height: 738 },
    extraHTTPHeaders: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.AUTH_USERNAME}:${process.env.AUTH_PASSWORD}`
      ).toString('base64')}`,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile or branded browsers can be added here if needed
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
  ],
});
