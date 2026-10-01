import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: '**/research-preview.spec.ts',
  timeout: 30000,
  workers: 2,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:3113', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'research-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    { name: 'research-mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node node_modules/next/dist/bin/next start --port 3113',
    url: 'http://127.0.0.1:3113/api/health',
    reuseExistingServer: false,
    env: {
      EDOCTOR_RESEARCH_TEST_BUILD: '1',
      EDOCTOR_RESEARCH_PREVIEW: '1',
      GRAPHQL_URL: '',
      NEXT_PUBLIC_GRAPHQL_URL: '',
      SITE_URL: 'http://127.0.0.1:3113',
    },
  },
});
