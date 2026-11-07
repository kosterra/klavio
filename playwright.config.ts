import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against the running dev stack:
 *   docker compose up -d mongo mailpit && npm run dev
 * Passkeys use Chromium's virtual WebAuthn authenticator (real crypto, no mocks).
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  // Specs share one database and the global "registration open" switch → run serially.
  workers: 1,
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    locale: 'de-CH',
    trace: 'retain-on-failure',
    // Caddy's local CA is not trusted inside the test browser
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'tablet-landscape',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1180, height: 820 } },
    },
  ],
});
