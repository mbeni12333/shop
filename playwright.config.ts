import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  testIgnore: ['**/catalog.spec.ts'],
  timeout: 30000,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:3107', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run start -- --port 3107',
    url: 'http://localhost:3107/api/health',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      SITE_URL: 'http://localhost:3107',
      GRAPHQL_URL: '',
      NEXT_PUBLIC_GRAPHQL_URL: '',
      WORDPRESS_URL: '',
      CHECKOUT_SECRET: '',
      REVALIDATE_SECRET: '',
    },
  },
});
