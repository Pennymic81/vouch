import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;
// Set CHROME_PATH to use an already-installed Chrome instead of Playwright's download.
const executablePath = process.env.CHROME_PATH;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Fresh test database every run, then a production build.
    command: `node -e "for (const f of ['test.db','test.db-wal','test.db-shm']) require('fs').rmSync(f,{force:true})" && npm run build && npm run start -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      DATABASE_URL: "file:test.db",
      BETTER_AUTH_URL: baseURL,
      BETTER_AUTH_SECRET: "test-secret-only-for-e2e-0123456789abcdef",
      E2E: "1",
      AI_FAKE: "1", // tests use a predictable stand-in instead of the real AI
      REVIEWER_EMAILS: "*@qa.vouch.test",
      APP_CURRENCY: "USD", // keeps amounts like "$700" in assertions
      PAYSTACK_FAKE: "1", // pretend Paystack: no real API calls or money
      PAYSTACK_SECRET_KEY: "sk_test_e2e_only_webhook_signing_key", // used only to sign test webhooks
      PLATFORM_FEE_PERCENT: "10",
    },
  },
});
