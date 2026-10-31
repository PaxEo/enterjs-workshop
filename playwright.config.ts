import { defineConfig } from '@playwright/test';

// Standard ist der installierte Chrome, damit kein Browser-Download nötig ist.
// Ohne Chrome: `npx playwright install chromium` und PW_CHANNEL=chromium setzen.
const channel = process.env.PW_CHANNEL ?? 'chrome';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  reporter: process.env.CI ? 'github' : 'line',
  use: {
    baseURL: 'http://localhost:5173',
    channel: channel === 'chromium' ? undefined : channel,
    viewport: { width: 1400, height: 850 },
    launchOptions: { args: ['--ignore-gpu-blocklist'] },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/api/groups',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
