import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4873/newsletter-flow/',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run pages:preview -- --port 4873',
    reuseExistingServer: true,
    timeout: 20_000,
    url: 'http://127.0.0.1:4873/newsletter-flow/',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
