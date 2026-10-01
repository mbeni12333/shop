import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: '**/catalog.spec.ts',
  timeout: 30000,
  workers: 2,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/catalog', open: 'never' }],
  ],
  use: { baseURL: 'http://127.0.0.1:3112', trace: 'retain-on-failure' },
  projects: [
    { name: 'catalog-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'catalog-mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command:
      'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3112',
    url: 'http://127.0.0.1:3112/api/health',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      EDOCTOR_TEST_BUILD: '1',
      GRAPHQL_URL: 'http://127.0.0.1:3111/graphql',
      SITE_URL: 'http://127.0.0.1:3112',
    },
  },
});
