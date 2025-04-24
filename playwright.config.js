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
  timeout: process.env.CI ? 180000 : 180000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 2,
  workers: process.env.CI ? 1 : 1, // Use 1 worker on CI, 1 locally
  reporter: 'html',

  use: {
    //trace: 'on-first-retry',
    actionTimeout: 60000,
    navigationTimeout: 60000,
    extraHTTPHeaders: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.AUTH_USERNAME}:${process.env.AUTH_PASSWORD}`
      ).toString('base64')}`,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        viewport: { width: 1536, height: 738 }, // Let browser use full available screen size
      },
    },
    /*     {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        }, */

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
